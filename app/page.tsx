"use client";

import { useState, useEffect, useCallback } from "react";
import AuthScreen from "./components/AuthScreen";
import ChatInterface, { Message } from "./components/ChatInterface";
import Sidebar from "./components/Sidebar";
import AdminPanel from "./components/AdminPanel";
import { loadSessions, saveSessions } from "@/lib/storage";

interface Session {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: number;
}

interface User {
  id: number;
  username: string;
  role: string;
  expires_at: number;
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // Check auth status on mount
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  // Load sessions from storage
  useEffect(() => {
    const initStorage = async () => {
      try {
        // 1. Try to load from IndexedDB
        let savedSessions = await loadSessions();

        // 2. Migration: If IndexedDB is empty, check localStorage
        if (savedSessions.length === 0) {
          const localData = localStorage.getItem("webgpt_sessions");
          if (localData) {
            try {
              const parsed = JSON.parse(localData);
              if (parsed.length > 0) {
                console.log("Migrating sessions from localStorage to IndexedDB...");
                await saveSessions(parsed);
                savedSessions = parsed;
                // Optional: localStorage.removeItem("webgpt_sessions"); 
                // We'll keep it for safety for now, or remove it after confirmation
              }
            } catch (e) {
              console.error("Failed to parse localStorage sessions", e);
            }
          }
        }

        if (savedSessions.length > 0) {
          setSessions(savedSessions);
          setActiveSessionId(savedSessions[0].id);
        }
      } catch (e) {
        console.error("Failed to load sessions from IndexedDB", e);
      }
    };

    initStorage();
  }, []);

  // Save sessions to storage
  useEffect(() => {
    saveSessions(sessions).catch((e: any) => {
      console.error("Failed to save sessions to IndexedDB", e);
    });
  }, [sessions]);

  const handleNewChat = useCallback(() => {
    const newSession: Session = {
      id: Date.now().toString(),
      title: "New Chat",
      messages: [],
      updatedAt: Date.now(),
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
  }, []);

  const handleDeleteSession = useCallback((id: string) => {
    if (confirm("Delete this chat?")) {
      setSessions((prev) => {
        const newSessions = prev.filter(s => s.id !== id);
        if (activeSessionId === id) {
          setActiveSessionId(newSessions.length > 0 ? newSessions[0].id : null);
        }
        return newSessions;
      });
    }
  }, [activeSessionId]);

  const handleMessagesChange = useCallback((newMessages: Message[]) => {
    if (!activeSessionId) return;

    setSessions((prev) => prev.map((session) => {
      if (session.id === activeSessionId) {
        // Auto-generate title from first user message if it's "New Chat"
        let title = session.title;
        if (session.title === "New Chat" && newMessages.length > 0) {
          const firstUserMsg = newMessages.find(m => m.role === "user");
          if (firstUserMsg) {
            let contentText = "";
            if (typeof firstUserMsg.content === "string") {
              contentText = firstUserMsg.content;
            } else if (Array.isArray(firstUserMsg.content)) {
              const textItem = firstUserMsg.content.find((item: any) => item.type === "text");
              if (textItem) {
                contentText = textItem.text;
              } else {
                contentText = "Image Analysis"; // Fallback for image-only
              }
            }

            if (contentText) {
              title = contentText.slice(0, 30) + (contentText.length > 30 ? "..." : "");
            }
          }
        }
        return {
          ...session,
          messages: newMessages,
          title,
          updatedAt: Date.now()
        };
      }
      return session;
    }));
  }, [activeSessionId]);

  const activeSession = sessions.find((s) => s.id === activeSessionId);

  const handleLogout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      setActiveSessionId(null);
    } catch (e) {
      console.error("Logout failed", e);
    }
  }, []);

  if (loading) {
    return <div className="h-screen w-full bg-[var(--background)] flex items-center justify-center text-[var(--foreground)]">Loading...</div>;
  }

  return (
    <main className="flex h-screen w-full bg-[var(--background)] text-[var(--foreground)] overflow-hidden">
      {!user ? (
        <AuthScreen onLogin={setUser} />
      ) : (
        <div className="flex w-full h-full animate-in fade-in duration-500">
          <Sidebar
            sessions={sessions}
            activeSessionId={activeSessionId}
            onSelectSession={setActiveSessionId}
            onNewChat={handleNewChat}
            onDeleteSession={handleDeleteSession}
            onLogout={handleLogout}
            user={user}
          />

          <div className="flex-1 h-full relative flex flex-col min-w-0 bg-[var(--background)]">
            {activeSessionId ? (
              <ChatInterface
                key={activeSessionId} // Force re-mount on session switch
                accessPassword={""} // Not used anymore, handled by cookie
                initialMessages={activeSession?.messages}
                onMessagesChange={handleMessagesChange}
                user={user}
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-500 space-y-4">
                <p>Select a chat or start a new one.</p>
                <button
                  onClick={handleNewChat}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors"
                >
                  Start New Chat
                </button>
              </div>
            )}

            {user.role === "admin" && <AdminPanel />}
          </div>
        </div>
      )}
    </main>
  );
}
