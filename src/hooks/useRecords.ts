import { useState, useEffect, useCallback } from 'react';
import { DB, Record } from '../utils/db';
import { useSync } from './useSync';

export const useRecords = () => {
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRecords = useCallback(async () => {
    setLoading(true);
    try {
      const data = await DB.getAll();
      setRecords(data);
    } catch (error) {
      console.error('Failed to load records:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const { syncToCloud, deleteFromCloud, syncing, isOnline } = useSync(records, loadRecords);

  const addRecord = async (record: Record) => {
    await DB.save(record);
    await syncToCloud(record);
    await loadRecords();
  };

  const updateRecord = async (record: Record) => {
    await DB.save(record);
    await syncToCloud(record);
    await loadRecords();
  };

  const deleteRecord = async (id: string) => {
    await DB.delete(id);
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
