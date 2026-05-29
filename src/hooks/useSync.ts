import { useEffect, useState, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useSupabase } from '../utils/supabase';
import { DB, Record, SyncQueueItem } from '../utils/db';

export const useSync = (records: Record[], refresh: () => Promise<void>) => {
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
    if (!isLoaded || !user || !supabase || !isOnline) return;
    
    setSyncing(true);
    try {
      const queue = await DB.getSyncQueue();
      if (queue.length === 0) return;

      const client = supabase;
      
      for (const item of queue) {
        if (item.action === 'UPSERT') {
          const cloudRecord = { ...(item.payload as Record), user_id: user.id };
          const { error } = await client.from('records').upsert(cloudRecord);
          if (!error && item.id) {
            await DB.removeFromSyncQueue(item.id);
          }
        } else if (item.action === 'DELETE') {
          const { error } = await client.from('records').delete().eq('id', item.payload as string);
          if (!error && item.id) {
            await DB.removeFromSyncQueue(item.id);
          }
        }
      }
    } catch (err) {
      console.error('Failed to process sync queue:', err);
    } finally {
      setSyncing(false);
    }
  }, [isLoaded, user, isOnline]);

  // Process queue when coming back online
  useEffect(() => {
    if (isOnline) {
      processSyncQueue();
    }
  }, [isOnline, processSyncQueue]);

  // Initial Sync from Cloud to Local
  useEffect(() => {
    if (isLoaded && user && supabase) {
      const client = supabase; // Local ref for narrowing
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

          if (error) throw error;
          if (data) {
            // Reconcile with local DB (Cloud wins for latest updatedAt)
            const localRecords = await DB.getAll();
            const toUpdateLocally = data.filter(cloud => {
              const local = localRecords.find(l => l.id === cloud.id);
              return !local || new Date(cloud.updatedAt) > new Date(local.updatedAt);
            });
            
            if (toUpdateLocally.length > 0) {
              await DB.saveAll(toUpdateLocally);
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
  }, [isLoaded, user, refresh, isOnline, processSyncQueue]);

  // Real-time Subscriptions
  useEffect(() => {
    if (isLoaded && user && supabase) {
      const client = supabase;
      const channel = client
        .channel('records_sync')
        .on(
          'postgres_changes' as any, 
          { event: '*', schema: 'public', table: 'records', filter: `user_id=eq.${user.id}` },
          async (payload: any) => {
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              const record = payload.new as Record;
              await DB.save(record);
              await refresh();
            } else if (payload.eventType === 'DELETE') {
              const id = payload.old.id;
              await DB.delete(id);
              await refresh();
            }
          }
        )
        .subscribe();

      return () => {
        client.removeChannel(channel);
      };
    }
  }, [isLoaded, user, refresh]);

  // Sync Local Changes to Cloud
  const syncToCloud = async (record: Record) => {
    if (!isLoaded || !user) return;
    
    if (!isOnline || !supabase) {
      await DB.enqueueSync('UPSERT', record);
      return;
    }

    const client = supabase;
    const cloudRecord = { ...record, user_id: user.id };
    try {
      const { error } = await client
        .from('records')
        .upsert(cloudRecord);
      if (error) throw error;
    } catch (err) {
      console.error('Sync to cloud error. Queuing for later:', err);
      await DB.enqueueSync('UPSERT', record);
    }
  };

  const deleteFromCloud = async (id: string) => {
    if (!isLoaded || !user) return;

    if (!isOnline || !supabase) {
      await DB.enqueueSync('DELETE', id);
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
      await DB.enqueueSync('DELETE', id);
    }
  };

  return { syncing, isOnline, syncToCloud, deleteFromCloud };
};
