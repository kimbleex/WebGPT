import { useTheme } from "@/lib/theme";
import { Language } from "@/lib/i18n";

interface SidebarFooterProps {
    user: any;
    showRenew: boolean;
    setShowRenew: (show: boolean) => void;
    renewToken: string;
    setRenewToken: (token: string) => void;
    handleRenew: () => void;
    onLogout: () => void;
    t: (key: string) => string;
    language: Language;
    setLanguage: (lang: Language) => void;
}

/**
 * SidebarFooter Component
 * 
 * 功能 (What):
 * 显示侧边栏底部区域，包含用户信息、续期功能、主题切换、语言切换和退出登录。
 * Displays the bottom area of the sidebar, including user info, renewal, theme toggle, language switcher, and logout.
 * 
 * 生效范围 (Where):
 * Sidebar 组件的底部。
 * The bottom of the Sidebar component.
 * 
 * 使用方法 (How):
 * <SidebarFooter user={...} ... />
 */
export default function SidebarFooter({
    user,
    showRenew,
    setShowRenew,
    renewToken,
    setRenewToken,
    handleRenew,
    onLogout,
    t,
    language,
    setLanguage
}: SidebarFooterProps) {
    const { theme, toggleTheme } = useTheme();

    return (
        <div className="mt-auto pt-4 pb-4 border-t border-[var(--glass-border)]">
            <div className="flex items-center space-x-2 sm:space-x-3 px-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white">
                    {user.username.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--foreground)] truncate">{user.username}</p>
                    <p className="text-xs text-[var(--text-muted)] truncate">
                        {t("sidebar.expires")} {
                            (() => {
                                const date = new Date(user.expires_at);
                                return isNaN(date.getTime()) ? t("sidebar.forever") : date.toLocaleString();
                            })()
                        }
                    </p>
                </div>
            </div>

            {/* Theme and Language Switcher */}
            <div className="flex items-center justify-between mt-4 px-2">
                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-lg bg-[var(--hover-bg)] text-[var(--text-muted)] hover:text-[var(--foreground)] transition-all border border-[var(--glass-border)]"
                    title={theme === "dark" ? t("sidebar.theme.light") : t("sidebar.theme.dark")}
                >
                    {theme === "dark" ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M16.95 16.95l.707.707M7.757 7.757l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                        </svg>
                    ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                        </svg>
                    )}
                </button>

                <div className="flex items-center space-x-1 bg-[var(--hover-bg)] p-1 rounded-lg border border-[var(--glass-border)]">
                    <button
                        onClick={() => setLanguage("en")}
                        className={`text-[10px] px-2 py-1 rounded-md transition-all ${language === "en" ? "bg-[var(--accent-primary)] text-white shadow-sm" : "text-[var(--text-muted)] hover:text-[var(--foreground)]"}`}
                    >
                        EN
                    </button>
                    <button
                        onClick={() => setLanguage("cn")}
                        className={`text-[10px] px-2 py-1 rounded-md transition-all ${language === "cn" ? "bg-[var(--accent-primary)] text-white shadow-sm" : "text-[var(--text-muted)] hover:text-[var(--foreground)]"}`}
                    >
                        中文
                    </button>
                </div>
            </div>

            {/* Renew Subscription - Simplified */}
            <div className="mt-3 px-2">
                <button
                    onClick={() => setShowRenew(!showRenew)}
                    className="w-full flex items-center justify-between px-3 py-2 text-left rounded-lg border border-[var(--glass-border)] hover:border-[var(--accent-primary)]/30 bg-[var(--hover-bg)] hover:bg-[var(--glass-bg)] transition-all"
                >
                    <span className="text-xs font-medium text-[var(--foreground)]">{t("sidebar.renew")}</span>
                    <svg
                        className={`w-3.5 h-3.5 text-[var(--text-muted)] transition-transform ${showRenew ? 'rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                {showRenew && (
                    <div className="mt-2 flex gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
                        <input
                            type="text"
                            placeholder={t("sidebar.tokenPlaceholder")}
                            value={renewToken}
                            onChange={(e) => setRenewToken(e.target.value)}
                            className="flex-1 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-lg px-3 py-1.5 text-xs text-[var(--foreground)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]/50 focus:border-[var(--accent-primary)]/50 transition-all"
                        />
                        <button
                            onClick={handleRenew}
                            className="px-3 py-1.5 bg-[var(--accent-primary)]/80 hover:bg-[var(--accent-primary)] text-white text-xs font-medium rounded-lg transition-colors"
                        >
                            {t("sidebar.submit")}
                        </button>
                    </div>
                )}
            </div>

            {/* Profile Management and Logout Buttons */}
            <div className="flex gap-2 mt-3 px-2">
                <button
                    onClick={() => window.location.href = '/profile'}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs py-2 rounded-lg bg-[var(--hover-bg)] text-[var(--foreground)] hover:bg-[var(--accent-primary)]/80 hover:text-white border border-[var(--glass-border)] hover:border-[var(--accent-primary)]/50 transition-all duration-200"
                >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="font-medium text-[10px] sm:text-xs">{t("profile.title")}</span>
                </button>

                <button
                    onClick={onLogout}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs py-2 rounded-lg bg-[var(--hover-bg)] text-red-400/90 hover:text-red-300 hover:bg-red-500/5 border border-[var(--glass-border)] hover:border-red-500/20 transition-all duration-200"
                >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span className="font-medium text-[10px] sm:text-xs">{t("sidebar.logout")}</span>
                </button>
            </div>
        </div>
    );
}
