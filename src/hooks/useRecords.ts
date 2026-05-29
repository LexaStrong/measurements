import { useState, useEffect, useCallback, useMemo } from 'react';
import { createDBClient, Record } from '../utils/db';
import { useSync } from './useSync';
import { useUser } from '@clerk/clerk-react';

export const useRecords = () => {
  const { user } = useUser();
  const db = useMemo(() => user ? createDBClient(user.id) : null, [user?.id]);
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRecords = useCallback(async () => {
    if (!db) return;
    setLoading(true);
    try {
      const data = await db.getAll();
      setRecords(data);
    } catch (error) {
      console.error('Failed to load records:', error);
    } finally {
      setLoading(false);
    }
  }, [db]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const { syncToCloud, deleteFromCloud, syncing, isOnline } = useSync(records, loadRecords, db);

  const addRecord = async (record: Record) => {
    if (!db) return;
    await db.save(record);
    await syncToCloud(record);
    await loadRecords();
  };

  const updateRecord = async (record: Record) => {
    if (!db) return;
    await db.save(record);
    await syncToCloud(record);
    await loadRecords();
  };

  const deleteRecord = async (id: string) => {
    if (!db) return;
    await db.delete(id);
    await deleteFromCloud(id);
    await loadRecords();
  };

  return { 
    records, 
    loading: loading || syncing,
    isOnline,
    addRecord, 
    updateRecord, 
    deleteRecord, 
    refresh: loadRecords 
  };
};
