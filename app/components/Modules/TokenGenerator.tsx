interface TokenGeneratorProps {
    duration: number;
    setDuration: (duration: number) => void;
    handleGenerate: () => void;
    loading: boolean;
    generatedToken: string | null;
    t: (key: string) => string;
}

/**
 * TokenGenerator Component
 * 
 * 功能 (What):
 * 提供生成新令牌的界面。
 * Provides an interface for generating new tokens.
 * 
 * 生效范围 (Where):
 * AdminPanel 组件的模态框中。
 * Inside the modal of the AdminPanel component.
 * 
 * 使用方法 (How):
 * <TokenGenerator duration={...} ... />
 */
export default function TokenGenerator({
    duration,
    setDuration,
    handleGenerate,
    loading,
    generatedToken,
    t
}: TokenGeneratorProps) {
    return (
        <div className="space-y-4 sm:space-y-5">
            <div className="flex items-center gap-2">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--accent-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <h3 className="text-base sm:text-lg font-semibold text-[var(--foreground)]">{t("admin.generateToken")}</h3>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                    <label className="block text-xs sm:text-sm text-[var(--text-muted)] font-medium mb-1.5 sm:mb-2">
                        {t("admin.duration")}
                    </label>
                    <input
                        type="number"
                        value={duration}
                        onChange={(e) => setDuration(Number(e.target.value))}
                        className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 text-[var(--foreground)] text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/50 transition-all"
                        min="1"
                        placeholder="24"
                    />
                </div>
                <div className="flex items-end">
                    <button
                        onClick={handleGenerate}
                        disabled={loading}
                        className="w-full sm:w-auto bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 text-white px-4 sm:px-6 py-2.5 sm:py-2.5 rounded-lg text-sm sm:text-base font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                {t("admin.loading")}
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                {t("admin.generate")}
                            </>
                        )}
                    </button>
                </div>
            </div>
            {generatedToken && (
                <div className="mt-4 p-3 sm:p-4 bg-green-500/10 border border-green-500/30 rounded-lg animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center gap-2 mb-2">
                        <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <p className="text-xs sm:text-sm text-green-500 font-medium">Token Generated Successfully</p>
                    </div>
                    <code className="block text-xs sm:text-sm font-mono text-[var(--foreground)] select-all break-all bg-[var(--input-bg)] px-3 py-2 rounded border border-[var(--border-color)]">
                        {generatedToken}
                    </code>
                </div>
            )}
        </div>
    );
}
