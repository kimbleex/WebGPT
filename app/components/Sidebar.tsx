"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/i18n";
import SessionList from "./Modules/SessionList";
import SidebarFooter from "./Modules/SidebarFooter";
import { useRenewToken } from "./Modules/hooks/useRenewToken";

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

/**
 * Sidebar Component
 * 
 * 功能 (What):
 * 应用程序的侧边栏，包含会话列表、新建会话按钮和底部用户信息区域。
 * The sidebar of the application, containing the session list, new chat button, and bottom user info area.
 * 
 * 生效范围 (Where):
 * 应用程序的左侧（桌面端）或抽屉式菜单（移动端）。
 * The left side of the application (desktop) or drawer menu (mobile).
 * 
 * 使用方法 (How):
 * <Sidebar sessions={...} activeSessionId={...} ... />
 */
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

    // 使用自定义 Hook 处理续期逻辑
    const {
        renewToken,
        setRenewToken,
        showRenew,
        setShowRenew,
        handleRenew
    } = useRenewToken();

    return (
        <>
            {/* Mobile Toggle Button - Terminal Style */}
            <button
                onClick={() => setIsMobileOpen(!isMobileOpen)}
                className="lg:hidden fixed top-4 left-4 z-50 p-2 glass-panel border border-[var(--border-color)] hover:border-[var(--hover-border)] transition-all group"
                aria-label="Toggle sidebar"
            >
                <svg className="w-6 h-6 text-[var(--accent-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {isMobileOpen ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    )}
                </svg>
            </button>

            {/* Mobile Overlay */}
            {isMobileOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-40 animate-fade-in"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* Sidebar - Terminal Style */}
            <aside
                className={`
                    fixed lg:relative inset-y-0 left-0 z-40
                    w-72 lg:w-80
                    bg-[var(--sidebar-bg)]
                    border-r-2 border-[var(--border-color)]
                    flex flex-col
                    transition-transform duration-300 ease-out
                    ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                    shadow-[4px_0_20px_rgba(0,255,159,0.1)]
                `}
            >
                {/* Terminal Header */}
                <div className="flex-shrink-0 p-4 border-b-2 border-[var(--border-color)] bg-[var(--panel-bg)]">
                    {/* New Chat Button - Terminal Style */}
                    <button
                        onClick={() => {
                            onNewChat();
                            setIsMobileOpen(false);
                        }}
                        className="w-full btn-terminal py-3 flex items-center justify-center gap-2 group"
                    >
                        <span className="text-[var(--accent-primary)] group-hover:text-[var(--background)] transition-colors">&gt;</span>
                        <span className="font-mono text-sm tracking-wider">{t("sidebar.newSession")}</span>
                        <svg className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                    </button>
                </div>

                {/* Session List */}
                <div className="flex-1 overflow-y-auto scrollbar-thin">
                    <SessionList
                        sessions={sessions}
                        activeSessionId={activeSessionId}
                        onSelectSession={(id) => {
                            onSelectSession(id);
                            setIsMobileOpen(false);
                        }}
                        onDeleteSession={onDeleteSession}
                        t={t}
                    />
                </div>

                {/* Footer */}
                <SidebarFooter
                    user={user}
                    onLogout={onLogout}
                    language={language}
                    setLanguage={setLanguage}
                    renewToken={renewToken}
                    setRenewToken={setRenewToken}
                    showRenew={showRenew}
                    setShowRenew={setShowRenew}
                    handleRenew={handleRenew}
                    t={t}
                />
            </aside>
        </>
    );
}
