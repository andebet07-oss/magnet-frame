// Minimal IndexedDB key-value store. Used only to remember the library folder handle,
// which can't be kept in localStorage.

const DB_NAME = 'magnet-frame-studio';
const STORE = 'kv';

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function run(mode, action) {
  const db = await openDb();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const req = action(tx.objectStore(STORE));
      tx.oncomplete = () => resolve(req.result);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

export const idbGet = (key) => run('readonly', (store) => store.get(key));
export const idbSet = (key, value) => run('readwrite', (store) => store.put(value, key));
export const idbDelete = (key) => run('readwrite', (store) => store.delete(key));
