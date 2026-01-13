"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/i18n";

interface AuthScreenProps {
    onLogin: (user: any) => void;
}

export default function AuthScreen({ onLogin }: AuthScreenProps) {
    const { t, language, setLanguage } = useLanguage();
    const [mode, setMode] = useState<"login" | "register">("login");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [token, setToken] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
            const body = mode === "login"
                ? { username, password }
                : { username, password, token };

            const res = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || t("auth.error"));
            }

            if (mode === "register") {
                window.location.reload();
            } else {
                onLogin(data.user);
            }

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

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

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-[var(--text-muted)] mb-1 uppercase tracking-wider">{t("auth.username")}</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-[var(--background)] border border-[var(--glass-border)] rounded-xl px-4 py-3 text-[var(--foreground)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all"
                            placeholder={t("auth.usernamePlaceholder")}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-[var(--text-muted)] mb-1 uppercase tracking-wider">{t("auth.password")}</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-[var(--background)] border border-[var(--glass-border)] rounded-xl px-4 py-3 text-[var(--foreground)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all"
                            placeholder={t("auth.passwordPlaceholder")}
                            required
                        />
                    </div>

                    {mode === "register" && (
                        <div>
                            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1 uppercase tracking-wider">{t("auth.token")}</label>
                            <input
                                type="text"
                                value={token}
                                onChange={(e) => setToken(e.target.value)}
                                className="w-full bg-[var(--background)] border border-[var(--glass-border)] rounded-xl px-4 py-3 text-[var(--foreground)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all font-mono"
                                placeholder={t("auth.tokenPlaceholder")}
                                required
                            />
                        </div>
                    )}

                    {error && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[var(--accent-primary)] hover:opacity-90 text-white font-medium py-3 rounded-xl transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                    >
                        {loading ? t("auth.processing") : (mode === "login" ? t("auth.unlock") : t("auth.createAccount"))}
                    </button>
                </form>
            </div>
        </div>
    );
}
