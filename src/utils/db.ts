import { openDB, DBSchema, IDBPDatabase } from 'idb';

export interface Record {
  id: string;
  name: string;
  phone: string;
  date: string;
  garment: string;
  halfBack: string;
  fullBack: string;
  chest: string;
  stomach: string;
  sleeves: string;
  topLength: string;
  arm: string;
  shoulder: string;
  waist: string;
  downLength: string;
  hip: string;
  bass: string;
  thigh: string;
  knee: string;
  charged: string;
  paid: string;
  collection: string;
  receivedDate: string;
  received: boolean;
  notes: string;
  updatedAt: string;
  createdAt: string;
}

export interface SyncQueueItem {
  id?: number;
  action: 'UPSERT' | 'DELETE';
  payload: Record | string; // Record object for UPSERT, ID string for DELETE
  timestamp: number;
}

interface LemaireDB extends DBSchema {
  records: {
    key: string;
    value: Record;
    indexes: { 'by-date': string };
  };
  sync_queue: {
    key: number;
    value: SyncQueueItem;
  };
}

const DB_NAME = 'LemaireAtelier';
const STORE_NAME = 'records';
const QUEUE_STORE = 'sync_queue';
const VERSION = 3;

let dbPromise: Promise<IDBPDatabase<LemaireDB>> | null = null;

export const getDB = () => {
  if (dbPromise) return dbPromise;
  
  dbPromise = openDB<LemaireDB>(DB_NAME, VERSION, {
    upgrade(db, oldVersion, newVersion, transaction) {
      if (oldVersion < 1) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('by-date', 'date');
      }
      
      // Handle legacy data migration if needed
      if (oldVersion === 1) {
        // Migration logic from version 1 to 2 if needed
      }

      if (oldVersion < 3) {
        if (!db.objectStoreNames.contains(QUEUE_STORE)) {
          db.createObjectStore(QUEUE_STORE, { keyPath: 'id', autoIncrement: true });
        }
      }
    },
  });
  
  return dbPromise;
};

export const DB = {
  async getAll(): Promise<Record[]> {
    const db = await getDB();
    const records = await db.getAll(STORE_NAME);
    return records.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  },

  async save(record: Record): Promise<void> {
    const db = await getDB();
    await db.put(STORE_NAME, record);
  },

  async saveAll(records: Record[]): Promise<void> {
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    for (const record of records) {
      tx.store.put(record);
    }
    await tx.done;
  },

  async delete(id: string): Promise<void> {
    const db = await getDB();
    await db.delete(STORE_NAME, id);
  },

  // --- Sync Queue Operations ---
  
  async enqueueSync(action: 'UPSERT' | 'DELETE', payload: Record | string): Promise<void> {
    const db = await getDB();
    await db.add(QUEUE_STORE, {
      action,
      payload,
      timestamp: Date.now()
    });
  },

  async getSyncQueue(): Promise<SyncQueueItem[]> {
    const db = await getDB();
    const items = await db.getAll(QUEUE_STORE);
    return items.sort((a, b) => a.timestamp - b.timestamp);
  },

  async removeFromSyncQueue(id: number): Promise<void> {
    const db = await getDB();
    await db.delete(QUEUE_STORE, id);
  },

  async clearSyncQueue(): Promise<void> {
    const db = await getDB();
    await db.clear(QUEUE_STORE);
  },
  
  migrateLegacy(data: any[]): Record[] {
    return data.map(r => ({
      id:         r.id         || Math.random().toString(36).slice(2, 11),
      name:       r.name       || '',
      phone:      r.phone      || '',
      date:       r.date       || '',
      garment:    r.garment    || '',
      halfBack:   r.halfBack   || '',
      fullBack:   r.fullBack   || '',
      chest:      r.chest      || '',
      stomach:    r.stomach    || '',
      sleeves:    r.sleeves    || '',
      topLength:  r.topLength  || r.topLen || '',
      arm:        r.arm        || '',
      shoulder:   r.shoulder   || '',
      waist:      r.waist      || '',
      downLength: r.downLength || r.downLen || '',
      hip:        r.hip        || '',
      bass:       r.bass       || '',
      thigh:      r.thigh      || '',
      knee:       r.knee       || '',
      charged:    r.charged    || '',
      paid:       r.paid       || '',
      collection: r.collection || '',
      receivedDate: r.receivedDate || r.rcvDate || '',
      received:   !!r.received,
      notes:      r.notes      || '',
      updatedAt:  r.updatedAt  || new Date().toISOString(),
      createdAt:  r.createdAt  || r.updatedAt || new Date().toISOString(),
    }));
  }
};
