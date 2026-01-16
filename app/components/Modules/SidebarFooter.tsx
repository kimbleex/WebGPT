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
        <div className="mt-auto pt-4 border-t border-[var(--glass-border)]">
            <div className="flex items-center space-x-2 sm:space-x-3 px-1 sm:px-2">
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
            <button
                onClick={() => setShowRenew(!showRenew)}
                className="w-full mt-3 text-xs text-[var(--accent-primary)] hover:opacity-80 text-left px-2"
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
                        className="w-full bg-[var(--input-bg)] border border-[var(--glass-border)] rounded px-2 py-1 text-xs text-[var(--foreground)] mb-2"
                    />
                    <button
                        onClick={handleRenew}
                        className="w-full bg-[var(--accent-primary)] text-white text-xs py-1 rounded hover:opacity-90"
                    >
                        {t("sidebar.submit")}
                    </button>
                </div>
            )}

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

            {/* Logout Button */}
            <button
                onClick={onLogout}
                className="w-full mt-4 flex items-center justify-center space-x-2 text-xs text-red-400 hover:text-red-300 py-2.5 rounded-xl bg-red-500/5 hover:bg-red-500/10 backdrop-blur-md border border-red-500/10 hover:border-red-500/20 shadow-lg shadow-red-500/5 transition-all duration-300"
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="font-medium">{t("sidebar.logout")}</span>
            </button>
        </div>
    );
}
