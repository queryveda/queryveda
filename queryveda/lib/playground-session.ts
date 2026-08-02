// Local (IndexedDB) persistence for the data playground session.

export type SavedTable = { name: string; csv: string };
export type Session = {
  tables: SavedTable[];
  sqlBuffer: string;
  pysparkBuffer: string;
  language: "sql" | "python";
};

const DB = "qv-playground";
const STORE = "session";
const KEY = "current";

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveSession(s: Session): Promise<void> {
  const db = await open();
  await new Promise<void>((res, rej) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(s, KEY);
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  db.close();
}

export async function loadSession(): Promise<Session | null> {
  const db = await open();
  const val = await new Promise<Session | null>((res, rej) => {
    const tx = db.transaction(STORE, "readonly");
    const r = tx.objectStore(STORE).get(KEY);
    r.onsuccess = () => res((r.result as Session) ?? null);
    r.onerror = () => rej(r.error);
  });
  db.close();
  return val;
}

export async function clearSession(): Promise<void> {
  const db = await open();
  await new Promise<void>((res, rej) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(KEY);
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  db.close();
}
