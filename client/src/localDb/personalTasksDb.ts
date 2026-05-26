import { TaskResDto } from '@fullstack/common';

const DB_NAME = 'renwu-personal-tasks';
const DB_VERSION = 1;
const SNAPSHOT_STORE = 'personalTaskSnapshots';

type PersonalTaskSnapshot = {
  ownerId: string;
  tasks: TaskResDto[];
  syncedAt: string;
};

function isIndexedDbAvailable(): boolean {
  return typeof window !== 'undefined' && 'indexedDB' in window;
}

function openPersonalTasksDb(): Promise<IDBDatabase | null> {
  if (!isIndexedDbAvailable()) {
    return Promise.resolve(null);
  }

  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(SNAPSHOT_STORE)) {
        db.createObjectStore(SNAPSHOT_STORE, { keyPath: 'ownerId' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function readPersonalTasksSnapshot(ownerId: string): Promise<TaskResDto[] | null> {
  const db = await openPersonalTasksDb();
  if (!db) {
    return null;
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(SNAPSHOT_STORE, 'readonly');
    const store = transaction.objectStore(SNAPSHOT_STORE);
    const request = store.get(ownerId);

    request.onsuccess = () => {
      const snapshot = request.result as PersonalTaskSnapshot | undefined;
      resolve(snapshot?.tasks ?? null);
    };
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => db.close();
    transaction.onerror = () => {
      db.close();
      reject(transaction.error);
    };
  });
}

export async function writePersonalTasksSnapshot(ownerId: string, tasks: TaskResDto[]): Promise<void> {
  const db = await openPersonalTasksDb();
  if (!db) {
    return;
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(SNAPSHOT_STORE, 'readwrite');
    const store = transaction.objectStore(SNAPSHOT_STORE);
    store.put({
      ownerId,
      tasks,
      syncedAt: new Date().toISOString(),
    } satisfies PersonalTaskSnapshot);

    transaction.oncomplete = () => {
      db.close();
      resolve();
    };
    transaction.onerror = () => {
      db.close();
      reject(transaction.error);
    };
  });
}
