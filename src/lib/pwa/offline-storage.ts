/**
 * Offline Storage — IndexedDB for Draft Transactions
 * Stores pending operations when offline and syncs them when back online.
 */

const DB_NAME = "caros-offline";
const DB_VERSION = 1;
const STORES = {
  DRAFTS: "draft-transactions",
  IMAGES: "cached-images",
  SETTINGS: "app-settings",
} as const;

export type DraftType =
  | "car_sale"
  | "installment_payment"
  | "car_addition"
  | "attendance_clockin";

export interface DraftTransaction {
  id: string;
  type: DraftType;
  data: Record<string, unknown>;
  timestamp: number;
  synced: boolean;
  retryCount: number;
}

/**
 * Open the IndexedDB database, creating object stores if needed.
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB not available"));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STORES.DRAFTS)) {
        const store = db.createObjectStore(STORES.DRAFTS, { keyPath: "id" });
        store.createIndex("type", "type", { unique: false });
        store.createIndex("synced", "synced", { unique: false });
        store.createIndex("timestamp", "timestamp", { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.IMAGES)) {
        db.createObjectStore(STORES.IMAGES, { keyPath: "url" });
      }

      if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
        db.createObjectStore(STORES.SETTINGS, { keyPath: "key" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Generate a unique ID for draft transactions.
 */
function generateId(): string {
  return `draft_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Save a draft transaction to IndexedDB.
 */
export async function saveDraft(
  type: DraftType,
  data: Record<string, unknown>,
): Promise<string> {
  const db = await openDB();
  const id = generateId();

  const draft: DraftTransaction = {
    id,
    type,
    data,
    timestamp: Date.now(),
    synced: false,
    retryCount: 0,
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.DRAFTS, "readwrite");
    tx.objectStore(STORES.DRAFTS).put(draft);
    tx.oncomplete = () => {
      db.close();
      resolve(id);
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

/**
 * Get all unsynced draft transactions.
 */
export async function getUnsyncedDrafts(): Promise<DraftTransaction[]> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.DRAFTS, "readonly");
    const index = tx.objectStore(STORES.DRAFTS).index("synced");
    const request = index.getAll(IDBKeyRange.only(false));

    request.onsuccess = () => {
      db.close();
      resolve(request.result);
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

/**
 * Mark a draft as synced.
 */
export async function markDraftSynced(id: string): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.DRAFTS, "readwrite");
    const store = tx.objectStore(STORES.DRAFTS);
    const getReq = store.get(id);

    getReq.onsuccess = () => {
      const draft = getReq.result as DraftTransaction | undefined;
      if (draft) {
        draft.synced = true;
        store.put(draft);
      }
    };

    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

/**
 * Delete a draft after successful sync.
 */
export async function deleteDraft(id: string): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.DRAFTS, "readwrite");
    tx.objectStore(STORES.DRAFTS).delete(id);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

/**
 * Get count of unsynced drafts (for badge display).
 */
export async function getUnsyncedCount(): Promise<number> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.DRAFTS, "readonly");
    const index = tx.objectStore(STORES.DRAFTS).index("synced");
    const request = index.count(IDBKeyRange.only(false));

    request.onsuccess = () => {
      db.close();
      resolve(request.result);
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

/**
 * Save a setting to IndexedDB.
 */
export async function saveSetting(key: string, value: unknown): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.SETTINGS, "readwrite");
    tx.objectStore(STORES.SETTINGS).put({ key, value });
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

/**
 * Get a setting from IndexedDB.
 */
export async function getSetting<T = unknown>(key: string): Promise<T | null> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.SETTINGS, "readonly");
    const request = tx.objectStore(STORES.SETTINGS).get(key);

    request.onsuccess = () => {
      db.close();
      resolve(request.result?.value ?? null);
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

/**
 * Clear all synced drafts (cleanup).
 */
export async function clearSyncedDrafts(): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.DRAFTS, "readwrite");
    const store = tx.objectStore(STORES.DRAFTS);
    const index = store.index("synced");
    const request = index.openCursor(IDBKeyRange.only(true));

    request.onsuccess = () => {
      const cursor = request.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };

    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}
