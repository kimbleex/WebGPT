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
        <form onSubmit={handleSubmit} className="space-y-3">
            {/* Username Field */}
            <div className="relative">
                <label className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-[var(--text-muted)] mb-1.5 uppercase tracking-widest">
                    <span className="text-[var(--accent-primary)]">&gt;</span>
                    {t("auth.username")}
                </label>
                <div className="relative group">
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full bg-[var(--input-bg)] border-2 border-[var(--border-color)] px-3 py-2 text-sm text-[var(--foreground)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] transition-all font-mono shadow-[inset_0_2px_8px_rgba(0,0,0,0.3)] group-hover:border-[var(--hover-border)]"
                        placeholder={t("auth.usernamePlaceholder")}
                        required
                    />
                    {/* Corner accents */}
                    <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t-2 border-l-2 border-[var(--accent-primary)] opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                    <div className="absolute top-0 right-0 w-1.5 h-1.5 border-t-2 border-r-2 border-[var(--accent-primary)] opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                    <div className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b-2 border-l-2 border-[var(--accent-primary)] opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                    <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b-2 border-r-2 border-[var(--accent-primary)] opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                </div>
            </div>

            {/* Password Field */}
            <div className="relative">
                <label className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-[var(--text-muted)] mb-1.5 uppercase tracking-widest">
                    <span className="text-[var(--accent-primary)]">&gt;</span>
                    {t("auth.password")}
                </label>
                <div className="relative group">
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-[var(--input-bg)] border-2 border-[var(--border-color)] px-3 py-2 text-sm text-[var(--foreground)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] transition-all font-mono shadow-[inset_0_2px_8px_rgba(0,0,0,0.3)] group-hover:border-[var(--hover-border)]"
                        placeholder={t("auth.passwordPlaceholder")}
                        required
                    />
                    {/* Corner accents */}
                    <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t-2 border-l-2 border-[var(--accent-primary)] opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                    <div className="absolute top-0 right-0 w-1.5 h-1.5 border-t-2 border-r-2 border-[var(--accent-primary)] opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                    <div className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b-2 border-l-2 border-[var(--accent-primary)] opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                    <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b-2 border-r-2 border-[var(--accent-primary)] opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                </div>
            </div>

            {/* Token Field (Register only) */}
            {mode === "register" && (
                <div className="relative">
                    <label className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-[var(--text-muted)] mb-1.5 uppercase tracking-widest">
                        <span className="text-[var(--accent-primary)]">&gt;</span>
                        {t("auth.token")}
                    </label>
                    <div className="relative group">
                        <input
                            type="text"
                            value={token}
                            onChange={(e) => setToken(e.target.value)}
                            className="w-full bg-[var(--input-bg)] border-2 border-[var(--border-color)] px-3 py-2 text-sm text-[var(--foreground)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] transition-all font-mono shadow-[inset_0_2px_8px_rgba(0,0,0,0.3)] group-hover:border-[var(--hover-border)] tracking-wider"
                            placeholder={t("auth.tokenPlaceholder")}
                            required
                        />
                        {/* Corner accents */}
                        <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t-2 border-l-2 border-[var(--accent-primary)] opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                        <div className="absolute top-0 right-0 w-1.5 h-1.5 border-t-2 border-r-2 border-[var(--accent-primary)] opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                        <div className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b-2 border-l-2 border-[var(--accent-primary)] opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                        <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b-2 border-r-2 border-[var(--accent-primary)] opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                    </div>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="relative border-2 border-[var(--error-color)] bg-[var(--error-color)]/10 p-2.5 animate-in slide-in-from-top duration-300">
                    <div className="flex items-start gap-2">
                        <svg className="w-4 h-4 text-[var(--error-color)] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <div className="flex-1">
                            <div className="text-xs text-[var(--error-color)] font-mono leading-tight">{error}</div>
                        </div>
                    </div>
                    {/* Corner accents */}
                    <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-[var(--error-color)]"></div>
                    <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-[var(--error-color)]"></div>
                    <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-[var(--error-color)]"></div>
                    <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-[var(--error-color)]"></div>
                </div>
            )}

            {/* Submit Button */}
            <div className="relative pt-1">
                <button
                    type="submit"
                    disabled={loading}
                    className="relative w-full bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-[var(--background)] font-mono font-bold py-2.5 text-sm uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group border-2 border-[var(--accent-primary)] hover:border-[var(--accent-secondary)] shadow-[0_0_20px_rgba(0,255,159,0.3)] hover:shadow-[0_0_30px_rgba(0,212,255,0.5)] disabled:shadow-none"
                >
                    {/* Button content */}
                    <span className="relative z-10 flex items-center justify-center gap-2">
                        {loading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-[var(--background)] border-t-transparent rounded-full animate-spin"></div>
                                <span>{t("auth.processing")}</span>
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                <span>{mode === "login" ? t("auth.unlock") : t("auth.createAccount")}</span>
                            </>
                        )}
                    </span>

                    {/* Hover effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent-primary)] via-[var(--accent-secondary)] to-[var(--accent-primary)] opacity-0 group-hover:opacity-100 transition-opacity bg-[length:200%_100%] animate-shimmer"></div>

                    {/* Corner accents */}
                    <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-[var(--background)] opacity-50"></div>
                    <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-[var(--background)] opacity-50"></div>
                    <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-[var(--background)] opacity-50"></div>
                    <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-[var(--background)] opacity-50"></div>
                </button>
            </div>
        </form>
    );
}
