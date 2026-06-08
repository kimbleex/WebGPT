"use client";

import { useState, useEffect, useCallback } from "react";
import AuthScreen from "./components/AuthScreen";
import ChatInterface, { Message } from "./components/ChatInterface";
import Sidebar from "./components/Sidebar";
import { loadSessions, saveSessions } from "@/lib/storage";
import { useLanguage } from "@/lib/i18n";

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
  const { t } = useLanguage();
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
        const savedSessions = await loadSessions();
        if (savedSessions.length > 0) {
          setSessions(savedSessions);
          setActiveSessionId(savedSessions[0].id);
        }
      } catch {
        // Silently handle storage initialization errors
      }
    };

    initStorage();
  }, []);

  // Save sessions to storage
  useEffect(() => {
    saveSessions(sessions).catch(() => {
      // Silently handle storage save errors
    });
  }, [sessions]);

  const handleNewChat = useCallback(() => {
    const newSession: Session = {
      id: Date.now().toString(),
      title: "新对话",
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
        // Auto-generate title from first user message if it's "新对话"
        let title = session.title;
        if (session.title === "新对话" && newMessages.length > 0) {
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
    } catch {
      // Silently handle logout errors
    }
  }, []);

  if (loading) {
    return (
      <div className="h-[100dvh] w-full bg-[var(--background)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-2 border-[var(--border-color)] border-t-[var(--accent-primary)] rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-16 h-16 border-2 border-transparent border-t-[var(--accent-secondary)] rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <div className="flex items-center gap-2 font-mono text-sm">
            <span className="text-[var(--accent-primary)]">&gt;</span>
            <span className="text-[var(--text-muted)]">INITIALIZING SYSTEM</span>
            <span className="inline-block w-2 h-4 bg-[var(--accent-primary)] animate-pulse ml-1"></span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="flex h-[100dvh] w-full bg-[var(--background)] text-[var(--foreground)] overflow-hidden">
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
                onSessionsChange={setSessions}
                user={user}
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-6 space-y-6">
                {/* Simple empty state */}
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--accent-primary)]/20 to-[var(--accent-secondary)]/20 flex items-center justify-center border border-[var(--border-color)]">
                    <svg className="w-8 h-8 text-[var(--accent-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <div className="space-y-2">
                    <p className="text-lg font-medium text-[var(--foreground)]">{t("chat.noConversations")}</p>
                    <p className="text-sm text-[var(--text-muted)]">{t("chat.createNewChat")}</p>
                  </div>
                  <button
                    onClick={handleNewChat}
                    className="mt-4 px-6 py-2.5 bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 text-white rounded-lg transition-all flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>{t("sidebar.newChat")}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
