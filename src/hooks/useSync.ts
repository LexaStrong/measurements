import { useEffect, useState, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useSupabase } from '../utils/supabase';
import { Record, SyncQueueItem, createDBClient } from '../utils/db';

const formatCloudRecord = (record: Record, userId: string) => ({
  id: record.id,
  user_id: userId,
  name: record.name || '',
  phone: record.phone || '',
  date: record.date || '',
  garment: record.garment || '',
  imageUrl: record.imageUrl || '',
  halfBack: record.halfBack || '',
  fullBack: record.fullBack || '',
  chest: record.chest || '',
  stomach: record.stomach || '',
  sleeves: record.sleeves || '',
  topLength: record.topLength || '',
  arm: record.arm || '',
  shoulder: record.shoulder || '',
  neck: record.neck || '',
  wrist: record.wrist || '',
  agbada: record.agbada || '',
  cap: record.cap || '',
  waist: record.waist || '',
  downLength: record.downLength || '',
  hip: record.hip || '',
  bass: record.bass || '',
  thigh: record.thigh || '',
  knee: record.knee || '',
  inseam: record.inseam || '',
  outseam: record.outseam || '',
  charged: record.charged || '',
  paid: record.paid || '',
  collection: record.collection || '',
  receivedDate: record.receivedDate || '',
  received: Boolean(record.received),
  notes: record.notes || '',
  updatedAt: record.updatedAt || new Date().toISOString(),
  createdAt: record.createdAt || new Date().toISOString(),
});

export const useSync = (records: Record[], refresh: () => Promise<void>, db: ReturnType<typeof createDBClient> | null) => {
  const { user, isLoaded } = useUser();
  const supabase = useSupabase();
  const [syncing, setSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Track Online/Offline State
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const processSyncQueue = useCallback(async () => {
    if (!isLoaded || !user || !supabase || !isOnline || !db) return;
    
    setSyncing(true);
    try {
      const queue = await db.getSyncQueue();
      if (queue.length === 0) return;

      const client = supabase;
      
      for (const item of queue) {
        if (item.action === 'UPSERT') {
          const cloudRecord = formatCloudRecord(item.payload as Record, user.id);
          const { error } = await client.from('records').upsert(cloudRecord);
          if (error) {
            console.error('Supabase queue upsert error:', error.message, error.details || '', error.hint || '');
          } else if (item.id) {
            await db.removeFromSyncQueue(item.id);
          }
        } else if (item.action === 'DELETE') {
          const { error } = await client.from('records').delete().eq('id', item.payload as string);
          if (error) {
            console.error('Supabase queue delete error:', error.message, error.details || '');
          } else if (item.id) {
            await db.removeFromSyncQueue(item.id);
          }
        }
      }
    } catch (err) {
      console.error('Failed to process sync queue:', err);
    } finally {
      setSyncing(false);
    }
  }, [isLoaded, user, supabase, isOnline, db]);

  // Process queue when coming back online
  useEffect(() => {
    if (isOnline) {
      processSyncQueue();
    }
  }, [isOnline, processSyncQueue]);

  // Initial Sync from Cloud to Local
  useEffect(() => {
    if (isLoaded && user && supabase && db) {
      const client = supabase;
      const initialSync = async () => {
        setSyncing(true);
        try {
          // Process any queued items first so we don't overwrite them with stale cloud data
          if (isOnline) {
             await processSyncQueue();
          }

          const { data, error } = await client
            .from('records')
            .select('*')
            .eq('user_id', user.id);

          if (error) {
            console.error('Initial cloud fetch error:', error.message, error.details || '');
            throw error;
          }
          
          if (data) {
            // Reconcile with local DB (Cloud wins for latest updatedAt)
            const localRecords = await db.getAll();
            const toUpdateLocally = data.filter(cloud => {
              const local = localRecords.find(l => l.id === cloud.id);
              return !local || new Date(cloud.updatedAt) > new Date(local.updatedAt);
            });
            
            if (toUpdateLocally.length > 0) {
              await db.saveAll(toUpdateLocally);
              await refresh();
            }
          }
        } catch (err) {
          console.error('Initial sync error:', err);
        } finally {
          setSyncing(false);
        }
      };
      
      initialSync();
    }
  }, [isLoaded, user, refresh, isOnline, processSyncQueue, db, supabase]);

  // Real-time Subscriptions
  useEffect(() => {
    if (isLoaded && user && supabase && db) {
      const client = supabase;
      const channel = client
        .channel('records_sync')
        .on(
          'postgres_changes' as any, 
          { event: '*', schema: 'public', table: 'records', filter: `user_id=eq.${user.id}` },
          async (payload: any) => {
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              const record = payload.new as Record;
              await db.save(record);
              await refresh();
            } else if (payload.eventType === 'DELETE') {
              const id = payload.old.id;
              await db.delete(id);
              await refresh();
            }
          }
        )
        .subscribe();

      return () => {
        client.removeChannel(channel);
      };
    }
  }, [isLoaded, user, refresh, db, supabase]);

  // Sync Local Changes to Cloud
  const syncToCloud = async (record: Record) => {
    if (!isLoaded || !user || !db) return;
    
    if (!isOnline || !supabase) {
      await db.enqueueSync('UPSERT', record);
      return;
    }

    const client = supabase;
    const cloudRecord = formatCloudRecord(record, user.id);
    try {
      const { error } = await client
        .from('records')
        .upsert(cloudRecord);
      if (error) {
        console.error('Direct cloud sync error:', error.message, error.details || '', error.hint || '');
        throw error;
      }
    } catch (err) {
      console.error('Sync to cloud error. Queuing for later:', err);
      await db.enqueueSync('UPSERT', record);
    }
  };

  const deleteFromCloud = async (id: string) => {
    if (!isLoaded || !user || !db) return;

    if (!isOnline || !supabase) {
      await db.enqueueSync('DELETE', id);
      return;
    }

    const client = supabase;
    try {
      const { error } = await client
        .from('records')
        .delete()
        .eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.error('Delete from cloud error. Queuing for later:', err);
      await db.enqueueSync('DELETE', id);
    }
  };

  return { syncing, isOnline, syncToCloud, deleteFromCloud };
};
