"use client";

import { useState, useEffect, useCallback } from "react";
import { loadSessions, deleteSession, clearAllSessions, getStorageStats, getAllSettings } from "@/lib/storage";

interface StorageManagerProps {
    isOpen: boolean;
    onClose: () => void;
    onSessionsChange?: (sessions: any[]) => void;
    t: (key: string) => string;
}

export default function StorageManager({ isOpen, onClose, onSessionsChange, t }: StorageManagerProps) {
    const [activeTab, setActiveTab] = useState<"sessions" | "settings">("sessions");
    const [sessions, setSessions] = useState<any[]>([]);
    const [settings, setSettings] = useState<Record<string, any>>({});
    const [stats, setStats] = useState<{ sessionCount: number; messageCount: number; estimatedSize: number } | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(true);

    const refreshData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [loadedSessions, storageStats, loadedSettings] = await Promise.all([
                loadSessions(),
                getStorageStats(),
                getAllSettings()
            ]);
            setSessions(loadedSessions);
            setStats(storageStats);
            setSettings(loadedSettings);
            if (onSessionsChange) {
                onSessionsChange(loadedSessions);
            }
        } catch {
            // Silently handle storage load errors
        } finally {
            setIsLoading(false);
        }
    }, [onSessionsChange]);

    useEffect(() => {
        if (isOpen) {
            refreshData();
            setSelectedIds(new Set());
        }
    }, [isOpen, refreshData]);

    const toggleSelect = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === sessions.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(sessions.map(s => s.id)));
        }
    };

    const handleDeleteSelected = async () => {
        if (selectedIds.size === 0) return;
        if (!confirm(t("storage.confirmDelete"))) return;

        try {
            await Promise.all(Array.from(selectedIds).map(id => deleteSession(id)));
            await refreshData();
            setSelectedIds(new Set());
        } catch {
            alert("Failed to delete some sessions");
        }
    };

    const handleClearAll = async () => {
        if (!confirm(t("storage.confirmClear"))) return;

        try {
            await clearAllSessions();
            await refreshData();
            setSelectedIds(new Set());
        } catch {
            alert("Failed to clear storage");
        }
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleString();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div
                className="bg-[var(--panel-bg)] border border-[var(--glass-border)] w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-[var(--glass-border)]/30 flex items-center justify-between bg-gradient-to-r from-[var(--accent-primary)]/10 to-transparent">
                    <div>
                        <h2 className="text-xl font-bold text-[var(--foreground)] flex items-center gap-2">
                            <svg className="w-6 h-6 text-[var(--accent-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                            </svg>
                            {t("storage.title")}
                        </h2>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5">{t("storage.subtitle")}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-[var(--hover-bg)] rounded-full transition-colors text-[var(--text-muted)] hover:text-[var(--foreground)]"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex px-6 border-b border-[var(--glass-border)]/20 bg-[var(--hover-bg)]/10">
                    <button
                        onClick={() => setActiveTab("sessions")}
                        className={`px-4 py-3 text-sm font-medium transition-all border-b-2 ${activeTab === "sessions"
                            ? "text-[var(--accent-primary)] border-[var(--accent-primary)]"
                            : "text-[var(--text-muted)] border-transparent hover:text-[var(--foreground)]"
                            }`}
                    >
                        {t("storage.tabs.sessions")}
                    </button>
                    <button
                        onClick={() => setActiveTab("settings")}
                        className={`px-4 py-3 text-sm font-medium transition-all border-b-2 ${activeTab === "settings"
                            ? "text-[var(--accent-primary)] border-[var(--accent-primary)]"
                            : "text-[var(--text-muted)] border-transparent hover:text-[var(--foreground)]"
                            }`}
                    >
                        {t("storage.tabs.settings")}
                    </button>
                </div>

                {activeTab === "sessions" ? (
                    <>
                        {/* Stats Summary */}
                        {stats && (
                            <div className="grid grid-cols-3 gap-4 px-6 py-4 bg-[var(--hover-bg)]/30 border-b border-[var(--glass-border)]/20">
                                <div className="flex flex-col">
                                    <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-bold">{t("storage.totalSessions")}</span>
                                    <span className="text-lg font-semibold text-[var(--foreground)]">{stats.sessionCount}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-bold">{t("storage.totalMessages")}</span>
                                    <span className="text-lg font-semibold text-[var(--foreground)]">{stats.messageCount}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-bold">{t("storage.estimatedSize")}</span>
                                    <span className="text-lg font-semibold text-[var(--accent-primary)]">{formatSize(stats.estimatedSize)}</span>
                                </div>
                            </div>
                        )}

                        {/* Toolbar */}
                        <div className="px-6 py-3 flex items-center justify-between gap-4 border-b border-[var(--glass-border)]/20">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleDeleteSelected}
                                    disabled={selectedIds.size === 0}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${selectedIds.size > 0
                                        ? "bg-red-500/10 text-red-500 border border-red-500/30 hover:bg-red-500/20"
                                        : "bg-gray-500/5 text-gray-500 border border-transparent cursor-not-allowed"
                                        }`}
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    {t("storage.deleteSelected")} ({selectedIds.size})
                                </button>
                            </div>
                            <button
                                onClick={handleClearAll}
                                className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-500 hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20"
                            >
                                {t("storage.clearAll")}
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-0 min-h-[300px]">
                            {isLoading ? (
                                <div className="h-full flex items-center justify-center py-20">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-primary)]"></div>
                                </div>
                            ) : sessions.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center py-20 text-[var(--text-muted)]">
                                    <svg className="w-16 h-16 opacity-20 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                    </svg>
                                    <p>{t("storage.noData")}</p>
                                </div>
                            ) : (
                                <table className="w-full text-left border-collapse">
                                    <thead className="sticky top-0 bg-[var(--panel-bg)] z-10 shadow-sm">
                                        <tr className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] border-b border-[var(--glass-border)]/20">
                                            <th className="px-6 py-3 w-10">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.size === sessions.length && sessions.length > 0}
                                                    onChange={toggleSelectAll}
                                                    className="rounded border-[var(--glass-border)] bg-transparent text-[var(--accent-primary)] focus:ring-[var(--accent-primary)]"
                                                />
                                            </th>
                                            <th className="px-4 py-3 font-bold">{t("storage.sessionTitle")}</th>
                                            <th className="px-4 py-3 font-bold">{t("storage.messages")}</th>
                                            <th className="px-4 py-3 font-bold">{t("storage.lastUpdated")}</th>
                                            <th className="px-6 py-3 font-bold text-right">{t("storage.actions")}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--glass-border)]/10">
                                        {sessions.map((session) => (
                                            <tr
                                                key={session.id}
                                                className={`group hover:bg-[var(--hover-bg)]/50 transition-colors ${selectedIds.has(session.id) ? 'bg-[var(--accent-primary)]/5' : ''}`}
                                                onClick={() => toggleSelect(session.id)}
                                            >
                                                <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedIds.has(session.id)}
                                                        onChange={() => toggleSelect(session.id)}
                                                        className="rounded border-[var(--glass-border)] bg-transparent text-[var(--accent-primary)] focus:ring-[var(--accent-primary)]"
                                                    />
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="font-medium text-[var(--foreground)] truncate max-w-[200px] sm:max-w-xs">
                                                        {session.title || "Untitled Chat"}
                                                    </div>
                                                    <div className="text-[10px] text-[var(--text-muted)] font-mono mt-0.5">ID: {session.id}</div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className="px-2 py-0.5 rounded-full bg-[var(--hover-bg)] text-[var(--text-muted)] text-[10px] font-medium border border-[var(--glass-border)]/20">
                                                        {session.messages?.length || 0}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 text-xs text-[var(--text-muted)]">
                                                    {formatDate(session.updatedAt)}
                                                </td>
                                                <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                                    <button
                                                        onClick={async () => {
                                                            if (confirm(t("storage.confirmDelete"))) {
                                                                await deleteSession(session.id);
                                                                refreshData();
                                                            }
                                                        }}
                                                        className="p-2 text-red-500/60 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        {Object.keys(settings).length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center py-20 text-[var(--text-muted)]">
                                <p>{t("storage.noData")}</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                {Object.entries(settings).map(([key, value]) => (
                                    <div key={key} className="p-4 rounded-xl bg-[var(--hover-bg)]/30 border border-[var(--glass-border)]/20 flex items-center justify-between">
                                        <div>
                                            <h3 className="text-sm font-semibold text-[var(--foreground)]">
                                                {key === "theme" ? t("storage.settings.theme") :
                                                    key === "webgpt_language" ? t("storage.settings.language") :
                                                        t("storage.settings.unknown") + ` (${key})`}
                                            </h3>
                                            <p className="text-xs text-[var(--text-muted)] mt-1 font-mono">{String(value)}</p>
                                        </div>
                                        <div className="px-3 py-1 rounded-full bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] text-[10px] font-bold uppercase tracking-wider">
                                            Active
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Footer */}
                <div className="px-6 py-4 border-t border-[var(--glass-border)]/30 bg-[var(--hover-bg)]/20 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-[var(--foreground)] text-[var(--background)] rounded-xl font-bold hover:opacity-90 transition-all active:scale-95"
                    >
                        {t("storage.close")}
                    </button>
                </div>
            </div>
        </div>
    );
}
