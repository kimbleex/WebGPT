"use client";

import { useLanguage } from "@/lib/i18n";
import { useAuth } from "./Modules/hooks/useAuth";
import AuthForm from "./Modules/AuthForm";

interface AuthScreenProps {
    onLogin: (user: any) => void;
}

/**
 * AuthScreen Component
 * 
 * 功能 (What):
 * 认证屏幕，处理用户登录和注册。
 * Authentication screen, handles user login and registration.
 * 
 * 生效范围 (Where):
 * 当用户未登录时显示的全屏组件。
 * Full-screen component displayed when the user is not logged in.
 * 
 * 使用方法 (How):
 * <AuthScreen onLogin={...} />
 */
export default function AuthScreen({ onLogin }: AuthScreenProps) {
    const { t, language, setLanguage } = useLanguage();

    const {
        mode,
        setMode,
        username,
        setUsername,
        password,
        setPassword,
        token,
        setToken,
        error,
        loading,
        handleSubmit
    } = useAuth({ onLogin, t });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--background)] bg-opacity-95 backdrop-blur-sm">
            {/* Language Switcher */}
            <div className="absolute top-4 right-4 flex space-x-2">
                <button
                    onClick={() => setLanguage("en")}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${language === "en" ? "bg-[var(--accent-primary)] text-white" : "bg-[var(--hover-bg)] text-[var(--text-muted)] hover:text-[var(--foreground)]"}`}
                >
                    EN
                </button>
                <button
                    onClick={() => setLanguage("cn")}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${language === "cn" ? "bg-[var(--accent-primary)] text-white" : "bg-[var(--hover-bg)] text-[var(--text-muted)] hover:text-[var(--foreground)]"}`}
                >
                    中文
                </button>
            </div>

            <div className="w-full max-w-md mx-4 p-6 sm:p-8 bg-[var(--panel-bg)] border border-[var(--glass-border)] rounded-2xl shadow-2xl animate-in fade-in zoom-in duration-300">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-[var(--foreground)]">
                        {process.env.NEXT_PUBLIC_AUTH_TITLE || t("auth.defaultTitle")}
                    </h2>
                    <p className="text-[var(--text-muted)] text-sm mt-2">
                        {mode === "login"
                            ? (process.env.NEXT_PUBLIC_AUTH_SUBTITLE || t("auth.defaultSubtitleLogin"))
                            : t("auth.defaultSubtitleRegister")}
                    </p>
                </div>

                <div className="flex mb-6 bg-[var(--hover-bg)] p-1 rounded-lg">
                    <button
                        onClick={() => setMode("login")}
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${mode === "login" ? "bg-[var(--panel-bg)] text-[var(--foreground)] shadow-sm" : "text-[var(--text-muted)] hover:text-[var(--foreground)]"}`}
                    >
                        {t("auth.login")}
                    </button>
                    <button
                        onClick={() => setMode("register")}
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${mode === "register" ? "bg-[var(--panel-bg)] text-[var(--foreground)] shadow-sm" : "text-[var(--text-muted)] hover:text-[var(--foreground)]"}`}
                    >
                        {t("auth.register")}
                    </button>
                </div>

                <AuthForm
                    mode={mode}
                    username={username}
                    setUsername={setUsername}
                    password={password}
                    setPassword={setPassword}
                    token={token}
                    setToken={setToken}
                    error={error}
                    loading={loading}
                    handleSubmit={handleSubmit}
                    t={t}
                />
            </div>
        </div>
    );
}
