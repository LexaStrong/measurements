import { openDB, DBSchema, IDBPDatabase } from 'idb';

export interface Record {
  id: string;
  name: string;
  phone: string;
  date: string;
  garment: string;
  imageUrl?: string;
  imageUrls?: string[];
  halfBack: string;
  fullBack: string;
  chest: string;
  stomach: string;
  sleeves: string;
  topLength: string;
  arm: string;
  shoulder: string;
  neck: string;
  wrist: string;
  agbada: string;
  cap: string;
  waist: string;
  downLength: string;
  hip: string;
  bass: string;
  thigh: string;
  knee: string;
  inseam: string;
  outseam: string;
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
const DB_VERSION = 4; // Bumped to 4 to exceed any existing browser database version

let dbPromise: Promise<IDBPDatabase<LemaireDB>> | null = null;
let currentUserId: string | null = null;

export const parseRecordImages = (r: any): { imageUrl: string; imageUrls: string[] } => {
  let urls: string[] = [];

  if (Array.isArray(r.imageUrls) && r.imageUrls.length > 0) {
    urls = r.imageUrls.filter(Boolean);
  } else if (r.imageUrl) {
    if (typeof r.imageUrl === 'string' && r.imageUrl.trim().startsWith('[') && r.imageUrl.trim().endsWith(']')) {
      try {
        const parsed = JSON.parse(r.imageUrl);
        if (Array.isArray(parsed)) {
          urls = parsed.filter(Boolean);
        }
      } catch {
        urls = [r.imageUrl];
      }
    } else if (typeof r.imageUrl === 'string' && r.imageUrl.trim()) {
      urls = [r.imageUrl.trim()];
    }
  } else if (r.image && typeof r.image === 'string' && r.image.trim()) {
    urls = [r.image.trim()];
  }

  const primary = urls[0] || (typeof r.imageUrl === 'string' ? r.imageUrl : '') || '';
  return { imageUrl: primary, imageUrls: urls };
};

export const normalizeRecord = (r: any): Record => {
  const { imageUrl, imageUrls } = parseRecordImages(r);

  return {
    id:         r.id         || Math.random().toString(36).slice(2, 11),
    name:       r.name       || '',
    phone:      r.phone      || '',
    date:       r.date       || '',
    garment:    r.garment    || '',
    imageUrl:   imageUrl,
    imageUrls:  imageUrls,
    halfBack:   r.halfBack   || '',
    fullBack:   r.fullBack   || '',
    chest:      r.chest      || '',
    stomach:    r.stomach    || '',
    sleeves:    r.sleeves    || '',
    topLength:  r.topLength  || r.topLen || '',
    arm:        r.arm        || '',
    shoulder:   r.shoulder   || '',
    neck:       r.neck       || '',
    wrist:      r.wrist      || '',
    agbada:     r.agbada     || '',
    cap:        r.cap        || '',
    waist:      r.waist      || '',
    downLength: r.downLength || r.downLen || '',
    hip:        r.hip        || '',
    bass:       r.bass       || '',
    thigh:      r.thigh      || '',
    knee:       r.knee       || '',
    inseam:     r.inseam     || '',
    outseam:    r.outseam    || '',
    charged:    r.charged    || '',
    paid:       r.paid       || '',
    collection: r.collection || '',
    receivedDate: r.receivedDate || r.rcvDate || '',
    received:   !!r.received,
    notes:      r.notes      || '',
    updatedAt:  r.updatedAt  || new Date().toISOString(),
    createdAt:  r.createdAt  || r.updatedAt || new Date().toISOString(),
  };
};

export const initDB = async (userId: string): Promise<IDBPDatabase<LemaireDB>> => {
  // If the user changes, reset the DB connection
  if (currentUserId !== userId) {
    if (dbPromise) {
      const db = await dbPromise;
      db.close();
    }
    dbPromise = null;
    currentUserId = userId;
  }

  if (!dbPromise) {
    const userDbName = `${DB_NAME}_${userId}`;
    dbPromise = openDB<LemaireDB>(userDbName, DB_VERSION, {
      upgrade(db, oldVersion, newVersion, transaction) {
        // Safe idempotent store initialization
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const recordStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          recordStore.createIndex('by-date', 'date');
        }
        if (!db.objectStoreNames.contains(QUEUE_STORE)) {
          db.createObjectStore(QUEUE_STORE, { keyPath: 'id', autoIncrement: true });
        }
      },
    });
  }
  return dbPromise;
};

export const getDB = async (userId: string) => {
  return initDB(userId);
};

export const createDBClient = (userId: string) => ({
  async getAll(): Promise<Record[]> {
    const db = await getDB(userId);
    const records = await db.getAll(STORE_NAME);
    return records.map(normalizeRecord);
  },

  async getById(id: string): Promise<Record | undefined> {
    const db = await getDB(userId);
    const record = await db.get(STORE_NAME, id);
    return record ? normalizeRecord(record) : undefined;
  },

  async save(record: Record): Promise<void> {
    const db = await getDB(userId);
    const normalized = normalizeRecord(record);
    await db.put(STORE_NAME, normalized);
    await this.enqueueSync('UPSERT', normalized);
  },

  async saveAll(records: Record[]): Promise<void> {
    const db = await getDB(userId);
    const tx = db.transaction(STORE_NAME, 'readwrite');
    for (const record of records) {
      const normalized = normalizeRecord(record);
      await tx.store.put(normalized);
    }
    await tx.done;
  },

  async delete(id: string): Promise<void> {
    const db = await getDB(userId);
    await db.delete(STORE_NAME, id);
    await this.enqueueSync('DELETE', id);
  },

  async enqueueSync(action: 'UPSERT' | 'DELETE', payload: Record | string): Promise<void> {
    const db = await getDB(userId);
    await db.add(QUEUE_STORE, {
      action,
      payload: typeof payload === 'object' ? normalizeRecord(payload) : payload,
      timestamp: Date.now()
    });
  },

  async getSyncQueue(): Promise<SyncQueueItem[]> {
    const db = await getDB(userId);
    const items = await db.getAll(QUEUE_STORE);
    return items.sort((a, b) => a.timestamp - b.timestamp);
  },

  async removeFromSyncQueue(id: number): Promise<void> {
    const db = await getDB(userId);
    await db.delete(QUEUE_STORE, id);
  },

  async clearSyncQueue(): Promise<void> {
    const db = await getDB(userId);
    await db.clear(QUEUE_STORE);
  },
  
  migrateLegacy(data: any[]): Record[] {
    return data.map(normalizeRecord);
  }
});
