"use client";

const DB_NAME = "WebGPT_DB";
const STORE_NAME = "sessions";
const DB_VERSION = 1;

const MAX_SESSIONS = 50;
const MAX_MESSAGES_PER_SESSION = 20;
const MAX_TOTAL_IMAGE_SIZE = 100 * 1024 * 1024;

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

const countImageSize = (sessions: any[]): number => {
    let totalSize = 0;
    sessions.forEach(session => {
        session.messages?.forEach((msg: any) => {
            if (Array.isArray(msg.content)) {
                msg.content.forEach((item: any) => {
                    if (item.type === "image_url" && item.image_url?.url) {
                        const base64 = item.image_url.url;
                        if (base64.startsWith("data:image")) {
                            const base64Data = base64.split(",")[1];
                            totalSize += base64Data ? base64Data.length * 0.75 : 0;
                        }
                    }
                });
            }
        });
    });
    return totalSize;
};

const trimSessionMessages = (session: any): any => {
    const messages = session.messages || [];
    if (messages.length <= MAX_MESSAGES_PER_SESSION) {
        return session;
    }
    return {
        ...session,
        messages: messages.slice(-MAX_MESSAGES_PER_SESSION)
    };
};

const cleanImageData = (sessions: any[]): any[] => {
    return sessions.map(session => {
        let totalSize = 0;
        const cleanedMessages = session.messages?.map((msg: any) => {
            if (Array.isArray(msg.content)) {
                const cleanedContent = msg.content.map((item: any) => {
                    if (item.type === "image_url" && item.image_url?.url) {
                        const url = item.image_url.url;
                        if (url.startsWith("data:image")) {
                            const base64Data = url.split(",")[1];
                            const size = base64Data ? base64Data.length * 0.75 : 0;
                            if (totalSize + size > MAX_TOTAL_IMAGE_SIZE && totalSize > 0) {
                                return null;
                            }
                            totalSize += size;
                        }
                    }
                    return item;
                }).filter(Boolean);
                return { ...msg, content: cleanedContent };
            }
            return msg;
        }).filter(Boolean) || [];
        return { ...session, messages: cleanedMessages };
    });
};

const limitSessions = (sessions: any[]): any[] => {
    if (sessions.length <= MAX_SESSIONS) {
        return sessions;
    }
    return sessions
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, MAX_SESSIONS);
};

export const saveSessions = async (sessions: any[]): Promise<void> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, "readwrite");
        const store = transaction.objectStore(STORE_NAME);

        let limitedSessions = limitSessions(sessions);
        limitedSessions = limitedSessions.map(trimSessionMessages);
        limitedSessions = cleanImageData(limitedSessions);

        if (limitedSessions.length === 0) {
            resolve();
            return;
        }

        let savedCount = 0;
        const totalCount = limitedSessions.length;

        limitedSessions.forEach((session) => {
            const putRequest = store.put(session);
            putRequest.onsuccess = () => {
                savedCount++;
                if (savedCount === totalCount) {
                    resolve();
                }
            };
            putRequest.onerror = (e) => reject((e.target as IDBRequest).error);
        });
    });
};

export const loadSessions = async (): Promise<any[]> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, "readonly");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
            const sessions = request.result.sort((a, b) => b.updatedAt - a.updatedAt);
            resolve(sessions);
        };

        request.onerror = (event) => {
            reject((event.target as IDBRequest).error);
        };
    });
};

export const getSession = async (sessionId: string): Promise<any | null> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, "readonly");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(sessionId);

        request.onsuccess = () => {
            resolve(request.result || null);
        };

        request.onerror = (event) => {
            reject((event.target as IDBRequest).error);
        };
    });
};

export const updateSession = async (session: any): Promise<void> => {
    const trimmedSession = trimSessionMessages(session);
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(trimmedSession);

        request.onsuccess = () => resolve();
        request.onerror = (event) => reject((event.target as IDBRequest).error);
    });
};

export const deleteSession = async (sessionId: string): Promise<void> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(sessionId);

        request.onsuccess = () => resolve();
        request.onerror = (event) => reject((event.target as IDBRequest).error);
    });
};

export const clearAllSessions = async (): Promise<void> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.clear();

        request.onsuccess = () => resolve();
        request.onerror = (event) => reject((event.target as IDBRequest).error);
    });
};

export const getStorageStats = async (): Promise<{
    sessionCount: number;
    messageCount: number;
    estimatedSize: number;
}> => {
    const sessions = await loadSessions();
    let messageCount = 0;
    let estimatedSize = 0;

    sessions.forEach(session => {
        messageCount += session.messages?.length || 0;
        estimatedSize += new Blob([JSON.stringify(session)]).size;
    });

    return {
        sessionCount: sessions.length,
        messageCount,
        estimatedSize
    };
};
