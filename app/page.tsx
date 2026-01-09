"use client";

import { useState, useEffect, useCallback } from "react";
import AuthScreen from "./components/AuthScreen";
import ChatInterface, { Message } from "./components/ChatInterface";
import Sidebar from "./components/Sidebar";
import AdminPanel from "./components/AdminPanel";

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

  // Load sessions from localStorage
  useEffect(() => {
    const savedSessions = localStorage.getItem("webgpt_sessions");
    if (savedSessions) {
      try {
        const parsed = JSON.parse(savedSessions);
        setSessions(parsed);
        if (parsed.length > 0) {
          setActiveSessionId(parsed[0].id);
        }
      } catch (e) {
        console.error("Failed to parse sessions", e);
      }
    }
  }, []);

  // Save sessions to localStorage
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem("webgpt_sessions", JSON.stringify(sessions));
    }
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
        if (newSessions.length === 0) {
          localStorage.removeItem("webgpt_sessions");
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
            title = firstUserMsg.content.slice(0, 30) + (firstUserMsg.content.length > 30 ? "..." : "");
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
    return <div className="h-screen w-full bg-[#0a0a0c] flex items-center justify-center text-white">Loading...</div>;
  }

  return (
    <main className="flex h-screen w-full bg-[#0a0a0c] text-white overflow-hidden">
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

          <div className="flex-1 h-full relative flex flex-col min-w-0 bg-[#0a0a0c]">
            {activeSessionId ? (
              <ChatInterface
                key={activeSessionId} // Force re-mount on session switch
                accessPassword={""} // Not used anymore, handled by cookie
                initialMessages={activeSession?.messages}
                onMessagesChange={handleMessagesChange}
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
