"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/i18n";

interface Session {
    id: string;
    title: string;
    updatedAt: number;
}

interface SidebarProps {
    sessions: Session[];
    activeSessionId: string | null;
    onSelectSession: (id: string) => void;
    onNewChat: () => void;
    onDeleteSession: (id: string) => void;
    onLogout: () => void;
    user: any;
}

export default function Sidebar({
    sessions,
    activeSessionId,
    onSelectSession,
    onNewChat,
    onDeleteSession,
    onLogout,
    user
}: SidebarProps) {
    const { t, language, setLanguage } = useLanguage();
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [renewToken, setRenewToken] = useState("");
    const [showRenew, setShowRenew] = useState(false);

    const handleRenew = async () => {
        try {
            const res = await fetch("/api/auth/renew", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token: renewToken })
            });
            const data = await res.json();
            if (data.success) {
                alert(t("sidebar.renewSuccess"));
                setShowRenew(false);
                setRenewToken("");
                window.location.reload();
            } else {
                alert(data.error || t("sidebar.renewFail"));
            }
        } catch (e) {
            alert(t("sidebar.renewFail"));
        }
    };

    return (
        <>
            {/* Mobile Toggle */}
            <button
                onClick={() => setIsMobileOpen(!isMobileOpen)}
                className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>

            {/* Sidebar Container */}
            <div
                className={`fixed inset-y-0 left-0 z-40 w-72 bg-[#0a0a0c] border-r border-white/5 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-full ${isMobileOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
            >
                <div className="flex flex-col h-full p-4">
                    {/* Header / New Chat */}
                    <div className="mb-6">
                        <button
                            onClick={() => {
                                onNewChat();
                                setIsMobileOpen(false);
                            }}
                            className="w-full flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl transition-all shadow-lg shadow-indigo-500/20 active:scale-[0.98]"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            <span className="font-medium">{t("sidebar.newChat")}</span>
                        </button>
                    </div>

                    {/* Session List */}
                    <div className="flex-1 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                        {sessions.length === 0 ? (
                            <div className="text-center text-gray-500 mt-10 text-sm">
                                {t("sidebar.noHistory")}
                            </div>
                        ) : (
                            sessions.map((session) => (
                                <div
                                    key={session.id}
                                    className="group relative flex items-center"
                                >
                                    <button
                                        onClick={() => {
                                            onSelectSession(session.id);
                                            setIsMobileOpen(false);
                                        }}
                                        className={`flex-1 text-left px-4 py-3 rounded-xl text-sm transition-all truncate ${activeSessionId === session.id
                                            ? "bg-white/10 text-white font-medium"
                                            : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
                                            }`}
                                    >
                                        {session.title || t("sidebar.newConversation")}
                                    </button>

                                    {/* Delete Button (visible on hover or if active) */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDeleteSession(session.id);
                                        }}
                                        className={`absolute right-2 p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-white/5 transition-all opacity-0 group-hover:opacity-100 ${activeSessionId === session.id ? "opacity-100" : ""
                                            }`}
                                        title="Delete chat"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    <div className="mt-4 pt-4 border-t border-white/5">
                        <div className="flex items-center space-x-3 px-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white">
                                {user.username.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">{user.username}</p>
                                <p className="text-xs text-gray-500 truncate">
                                    {t("sidebar.expires")} {
                                        (() => {
                                            const date = new Date(user.expires_at);
                                            return isNaN(date.getTime()) ? t("sidebar.forever") : date.toLocaleString();
                                        })()
                                    }
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowRenew(!showRenew)}
                            className="w-full mt-3 text-xs text-indigo-400 hover:text-indigo-300 text-left px-2"
                        >
                            {t("sidebar.renew")}
                        </button>

                        {showRenew && (
                            <div className="mt-2 px-2 animate-in fade-in slide-in-from-top-2">
                                <input
                                    type="text"
                                    placeholder={t("sidebar.tokenPlaceholder")}
                                    value={renewToken}
                                    onChange={(e) => setRenewToken(e.target.value)}
                                    className="w-full bg-black/20 border border-white/10 rounded px-2 py-1 text-xs text-white mb-2"
                                />
                                <button
                                    onClick={handleRenew}
                                    className="w-full bg-indigo-600 text-white text-xs py-1 rounded hover:bg-indigo-500"
                                >
                                    {t("sidebar.submit")}
                                </button>
                            </div>
                        )}

                        {/* Language Switcher in Sidebar */}
                        <div className="flex justify-center mt-4 space-x-2">
                            <button
                                onClick={() => setLanguage("en")}
                                className={`text-xs px-2 py-1 rounded ${language === "en" ? "bg-white/20 text-white" : "text-gray-500 hover:text-gray-300"}`}
                            >
                                English
                            </button>
                            <span className="text-gray-600 text-xs">|</span>
                            <button
                                onClick={() => setLanguage("cn")}
                                className={`text-xs px-2 py-1 rounded ${language === "cn" ? "bg-white/20 text-white" : "text-gray-500 hover:text-gray-300"}`}
                            >
                                中文
                            </button>
                        </div>

                        {/* Logout Button */}
                        <button
                            onClick={onLogout}
                            className="w-full mt-4 flex items-center justify-center space-x-2 text-xs text-red-400 hover:text-red-300 py-2 rounded-lg hover:bg-white/5 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span>{t("sidebar.logout")}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Overlay */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}
        </>
    );
}
