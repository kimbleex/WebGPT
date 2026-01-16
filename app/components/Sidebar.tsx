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
            {/* Mobile Toggle */}
            <button
                onClick={() => setIsMobileOpen(!isMobileOpen)}
                className="lg:hidden fixed top-4 left-4 z-50 p-2.5 rounded-xl bg-[var(--panel-bg)] border border-[var(--glass-border)] text-[var(--foreground)] shadow-xl backdrop-blur-md transition-all active:scale-95"
            >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>

            {/* Sidebar Container */}
            <div
                className={`fixed inset-y-0 left-0 z-40 w-[80vw] sm:w-72 bg-[var(--sidebar-bg)] border-r border-[var(--glass-border)] transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-full ${isMobileOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
            >
                <div className="flex flex-col h-full p-3 sm:p-4">
                    {/* Header / New Chat */}
                    <div className="mb-4 sm:mb-6">
                        <button
                            onClick={() => {
                                onNewChat();
                                setIsMobileOpen(false);
                            }}
                            className="w-full flex items-center justify-center space-x-2 bg-[var(--accent-primary)] hover:opacity-90 text-white py-3 rounded-xl transition-all shadow-lg shadow-indigo-500/20 active:scale-[0.98]"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            <span className="font-medium">{t("sidebar.newChat")}</span>
                        </button>
                    </div>

                    {/* Session List */}
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

                    {/* Footer */}
                    <SidebarFooter
                        user={user}
                        showRenew={showRenew}
                        setShowRenew={setShowRenew}
                        renewToken={renewToken}
                        setRenewToken={setRenewToken}
                        handleRenew={handleRenew}
                        onLogout={onLogout}
                        t={t}
                        language={language}
                        setLanguage={setLanguage}
                    />
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
