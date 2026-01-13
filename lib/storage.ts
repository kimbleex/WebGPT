"use client";

const DB_NAME = "WebGPT_DB";
const STORE_NAME = "sessions";
const DB_VERSION = 1;

export const initDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: "id" });
            }
        };

        request.onsuccess = (event) => {
            resolve((event.target as IDBOpenDBRequest).result);
        };

        request.onerror = (event) => {
            reject((event.target as IDBOpenDBRequest).error);
        };
    });
};

export const saveSessions = async (sessions: any[]): Promise<void> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, "readwrite");
        const store = transaction.objectStore(STORE_NAME);

        // Clear existing and add new
        const clearRequest = store.clear();
        clearRequest.onsuccess = () => {
            let count = 0;
            if (sessions.length === 0) {
                resolve();
                return;
            }
            sessions.forEach((session) => {
                const addRequest = store.add(session);
                addRequest.onsuccess = () => {
                    count++;
                    if (count === sessions.length) {
                        resolve();
                    }
                };
                addRequest.onerror = (e) => reject((e.target as IDBRequest).error);
            });
        };
        clearRequest.onerror = (e) => reject((e.target as IDBRequest).error);
    });
};

export const loadSessions = async (): Promise<any[]> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, "readonly");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
            // Sort by updatedAt desc
            const sessions = request.result.sort((a, b) => b.updatedAt - a.updatedAt);
            resolve(sessions);
        };

        request.onerror = (event) => {
            reject((event.target as IDBRequest).error);
        };
    });
};
