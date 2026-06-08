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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--background)]">
            {/* Animated background particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[var(--terminal-cyan)] opacity-10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[var(--terminal-purple)] opacity-10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-[var(--terminal-green)] opacity-5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            {/* Language Switcher */}
            <div className="absolute top-6 right-6 flex gap-2 z-10">
                <button
                    onClick={() => setLanguage("en")}
                    className={`px-4 py-1.5 text-xs font-mono font-bold uppercase tracking-wider transition-all border ${
                        language === "en"
                            ? "bg-[var(--accent-primary)] border-[var(--accent-primary)] text-[var(--background)] shadow-[0_0_20px_var(--accent-primary)]"
                            : "bg-transparent border-[var(--border-color)] text-[var(--text-muted)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]"
                    }`}
                >
                    EN
                </button>
                <button
                    onClick={() => setLanguage("cn")}
                    className={`px-4 py-1.5 text-xs font-mono font-bold uppercase tracking-wider transition-all border ${
                        language === "cn"
                            ? "bg-[var(--accent-primary)] border-[var(--accent-primary)] text-[var(--background)] shadow-[0_0_20px_var(--accent-primary)]"
                            : "bg-transparent border-[var(--border-color)] text-[var(--text-muted)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]"
                    }`}
                >
                    中文
                </button>
            </div>

            {/* Main Auth Container */}
            <div className="relative w-full max-w-md mx-4 animate-in fade-in zoom-in duration-500">
                {/* Terminal Window Frame */}
                <div className="relative bg-[var(--panel-bg)] border-2 border-[var(--border-color)] shadow-[0_0_40px_rgba(0,255,159,0.15)]">
                    {/* Top Terminal Bar */}
                    <div className="relative h-7 bg-[var(--code-header-bg)] border-b-2 border-[var(--border-color)] flex items-center px-3 gap-2">
                        {/* Terminal Buttons */}
                        <div className="flex gap-1.5">
                            <div className="w-2.5 h-2.5 bg-[var(--error-color)] shadow-[0_0_6px_var(--error-color)]"></div>
                            <div className="w-2.5 h-2.5 bg-[var(--warning-color)] shadow-[0_0_6px_var(--warning-color)]"></div>
                            <div className="w-2.5 h-2.5 bg-[var(--success-color)] shadow-[0_0_6px_var(--success-color)]"></div>
                        </div>
                        {/* Glow effect at top */}
                        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--accent-primary)] to-transparent opacity-60"></div>
                    </div>

                    {/* Content Area */}
                    <div className="p-5">
                        {/* Logo and Title Section */}
                        <div className="text-center mb-4">
                            {/* Animated Lock Icon */}
                            <div className="relative w-12 h-12 mx-auto mb-3">
                                {/* Outer rotating ring */}
                                <div className="absolute inset-0 border-2 border-[var(--accent-primary)] opacity-30 animate-spin" style={{ animationDuration: '3s' }}></div>
                                {/* Inner rotating ring */}
                                <div className="absolute inset-1 border-2 border-[var(--accent-secondary)] opacity-40 animate-spin" style={{ animationDuration: '2s', animationDirection: 'reverse' }}></div>
                                {/* Center icon container */}
                                <div className="absolute inset-2.5 bg-gradient-to-br from-[var(--terminal-purple)] to-[var(--terminal-cyan)] flex items-center justify-center shadow-[0_0_20px_var(--accent-primary)]">
                                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                {/* Corner accents */}
                                <div className="absolute -top-0.5 -left-0.5 w-2 h-2 border-t-2 border-l-2 border-[var(--accent-primary)]"></div>
                                <div className="absolute -top-0.5 -right-0.5 w-2 h-2 border-t-2 border-r-2 border-[var(--accent-primary)]"></div>
                                <div className="absolute -bottom-0.5 -left-0.5 w-2 h-2 border-b-2 border-l-2 border-[var(--accent-primary)]"></div>
                                <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 border-b-2 border-r-2 border-[var(--accent-primary)]"></div>
                            </div>

                            {/* Title */}
                            <h2 className="text-xl font-bold font-mono mb-1.5 gradient-text">
                                {process.env.NEXT_PUBLIC_AUTH_TITLE || t("auth.defaultTitle")}
                            </h2>

                            {/* Subtitle with terminal prompt */}
                            <div className="flex items-center justify-center gap-1.5 text-xs text-[var(--text-muted)] font-mono">
                                <span className="text-[var(--accent-primary)]">&gt;</span>
                                <span className="truncate max-w-[280px]">
                                    {mode === "login"
                                        ? (process.env.NEXT_PUBLIC_AUTH_SUBTITLE || t("auth.defaultSubtitleLogin"))
                                        : t("auth.defaultSubtitleRegister")}
                                </span>
                            </div>
                        </div>

                        {/* Tab Switcher - Terminal Style */}
                        <div className="relative flex border border-[var(--border-color)] mb-4">
                            <button
                                onClick={() => setMode("login")}
                                className={`relative flex-1 py-2 text-xs font-mono font-bold uppercase tracking-wider transition-all ${
                                    mode === "login"
                                        ? "bg-[var(--accent-primary)] text-[var(--background)] shadow-[0_0_15px_var(--accent-primary)]"
                                        : "bg-transparent text-[var(--text-muted)] hover:text-[var(--accent-primary)] hover:bg-[var(--hover-bg)]"
                                }`}
                            >
                                {t("auth.login")}
                                {mode === "login" && (
                                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--accent-secondary)] shadow-[0_0_8px_var(--accent-secondary)]"></div>
                                )}
                            </button>
                            <div className="w-[2px] bg-[var(--border-color)]"></div>
                            <button
                                onClick={() => setMode("register")}
                                className={`relative flex-1 py-2 text-xs font-mono font-bold uppercase tracking-wider transition-all ${
                                    mode === "register"
                                        ? "bg-[var(--accent-primary)] text-[var(--background)] shadow-[0_0_15px_var(--accent-primary)]"
                                        : "bg-transparent text-[var(--text-muted)] hover:text-[var(--accent-primary)] hover:bg-[var(--hover-bg)]"
                                }`}
                            >
                                {t("auth.register")}
                                {mode === "register" && (
                                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--accent-secondary)] shadow-[0_0_8px_var(--accent-secondary)]"></div>
                                )}
                            </button>
                        </div>

                        {/* Form */}
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

                    {/* Bottom accent line */}
                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--accent-primary)] to-transparent opacity-60"></div>

                    {/* Corner decorations */}
                    <div className="absolute -top-1.5 -left-1.5 w-3 h-3 border-t-2 border-l-2 border-[var(--accent-primary)]"></div>
                    <div className="absolute -top-1.5 -right-1.5 w-3 h-3 border-t-2 border-r-2 border-[var(--accent-primary)]"></div>
                    <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 border-b-2 border-l-2 border-[var(--accent-primary)]"></div>
                    <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 border-b-2 border-r-2 border-[var(--accent-primary)]"></div>
                </div>
            </div>
        </div>
    );
}
