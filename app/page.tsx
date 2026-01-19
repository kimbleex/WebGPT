"use client";

import { useState, useEffect, useCallback } from "react";
import AuthScreen from "./components/AuthScreen";
import ChatInterface, { Message } from "./components/ChatInterface";
import Sidebar from "./components/Sidebar";
import AdminPanel from "./components/AdminPanel";
import { loadSessionMetadata, getSession, saveSessions, updateSession } from "@/lib/storage";

interface Session {
  id: string;
  title: string;
  messages?: Message[];
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
  const [activeMessages, setActiveMessages] = useState<Message[]>([]);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);

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
        // 1. Try to load metadata from IndexedDB
        let savedMetadata = await loadSessionMetadata();

        // 2. Migration: If IndexedDB is empty, check localStorage
        if (savedMetadata.length === 0) {
          const localData = localStorage.getItem("webgpt_sessions");
          if (localData) {
            try {
              const parsed = JSON.parse(localData);
              if (parsed.length > 0) {
                console.log("Migrating sessions from localStorage to IndexedDB...");
                await saveSessions(parsed);
                savedMetadata = parsed.map((s: any) => ({
                  id: s.id,
                  title: s.title,
                  updatedAt: s.updatedAt
                }));
              }
            } catch (e) {
              console.error("Failed to parse localStorage sessions", e);
            }
          }
        }

        if (savedMetadata.length > 0) {
          setSessions(savedMetadata);
          setActiveSessionId(savedMetadata[0].id);
        }
      } catch (e) {
        console.error("Failed to load sessions from IndexedDB", e);
      }
    };

    initStorage();
  }, []);

  // Load active session messages when activeSessionId changes
  useEffect(() => {
    if (!activeSessionId) {
      setActiveMessages([]);
      return;
    }

    const loadActiveMessages = async () => {
      setIsMessagesLoading(true);
      try {
        const session = await getSession(activeSessionId);
        if (session) {
          setActiveMessages(session.messages || []);
        } else {
          setActiveMessages([]);
        }
      } catch (e) {
        console.error("Failed to load active session messages", e);
        setActiveMessages([]);
      } finally {
        setIsMessagesLoading(false);
      }
    };

    loadActiveMessages();
  }, [activeSessionId]);

  // Save sessions metadata to storage (handled by updateSession now)
  // We don't need a global useEffect for sessions anymore as we update individually

  const handleNewChat = useCallback(() => {
    const newSession: Session = {
      id: Date.now().toString(),
      title: "New Chat",
      updatedAt: Date.now(),
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setActiveMessages([]);

    // Save new session to DB
    updateSession({ ...newSession, messages: [] });
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

    // Update active messages in state
    setActiveMessages(newMessages);

    // Update session metadata and save to DB
    setSessions((prev) => {
      let titleUpdated = false;
      const updated = prev.map((session) => {
        if (session.id === activeSessionId) {
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
                  contentText = "Image Analysis";
                }
              }

              if (contentText) {
                title = contentText.slice(0, 30) + (contentText.length > 30 ? "..." : "");
                titleUpdated = true;
              }
            }
          }

          const updatedSession = {
            ...session,
            title,
            updatedAt: Date.now()
          };

          // Save full session to DB
          updateSession({
            ...updatedSession,
            messages: newMessages
          });

          return updatedSession;
        }
        return session;
      });
      return updated;
    });
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
              isMessagesLoading ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : (
                <ChatInterface
                  key={activeSessionId} // Force re-mount on session switch
                  accessPassword={""} // Not used anymore, handled by cookie
                  initialMessages={activeMessages}
                  onMessagesChange={handleMessagesChange}
                  user={user}
                />
              )
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
