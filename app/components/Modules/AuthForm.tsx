interface AuthFormProps {
    mode: "login" | "register";
    username: string;
    setUsername: (value: string) => void;
    password: string;
    setPassword: (value: string) => void;
    token: string;
    setToken: (value: string) => void;
    error: string;
    loading: boolean;
    handleSubmit: (e: React.FormEvent) => void;
    t: (key: string) => string;
}

/**
 * AuthForm Component
 * 
 * 功能 (What):
 * 显示登录或注册表单。
 * Displays the login or registration form.
 * 
 * 生效范围 (Where):
 * AuthScreen 组件中。
 * Inside the AuthScreen component.
 * 
 * 使用方法 (How):
 * <AuthForm mode={...} ... />
 */
export default function AuthForm({
    mode,
    username,
    setUsername,
    password,
    setPassword,
    token,
    setToken,
    error,
    loading,
    handleSubmit,
    t
}: AuthFormProps) {
    return (
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
    );
}
