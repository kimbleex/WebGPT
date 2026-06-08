import { Token } from "./hooks/useTokenManagement";

interface TokenListProps {
    tokens: Token[];
    t: (key: string) => string;
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

/**
 * TokenList Component
 * 
 * 功能 (What):
 * 显示最近生成的令牌列表。
 * Displays a list of recently generated tokens.
 * 
 * 生效范围 (Where):
 * AdminPanel 组件的模态框中。
 * Inside the modal of the AdminPanel component.
 * 
 * 使用方法 (How):
 * <TokenList tokens={...} t={...} />
 */
export default function TokenList({ tokens, t, page, totalPages, onPageChange }: TokenListProps) {
    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* 标题 - 固定 */}
            <div className="flex-shrink-0 flex items-center gap-2 mb-4 sm:mb-5">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--accent-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-base sm:text-lg font-semibold text-[var(--foreground)]">{t("admin.recentTokens")}</h3>
            </div>

            {/* Token 列表 - 可滚动 */}
            <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-[var(--border-color)] scrollbar-track-transparent">
                {tokens.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-8 text-[var(--text-muted)] text-sm">
                        <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                        <p>No tokens generated yet</p>
                    </div>
                ) : (
                    <div className="space-y-2 sm:space-y-3">
                        {tokens.map((token) => (
                            <div key={token.code} className="bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 hover:bg-[var(--hover-bg)] transition-colors">
                                <div className="flex-1 min-w-0">
                                    <p className="font-mono text-xs sm:text-sm font-bold text-[var(--foreground)] break-all">{token.code}</p>
                                    <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-[var(--text-muted)]">
                                        <span className="flex items-center gap-1">
                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            {token.duration_hours} {t("admin.hours")}
                                        </span>
                                        <span>•</span>
                                        <span className="flex items-center gap-1">
                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            {new Date(token.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                                <div className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-medium self-start sm:self-center ${token.is_used ? "bg-red-500/10 text-red-500" : "bg-green-500/10 text-green-500"}`}>
                                    {token.is_used ? t("admin.used") : "Active"}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Pagination - 固定在底部 */}
            {totalPages > 1 && (
                <div className="flex-shrink-0 flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 mt-4 border-t border-[var(--glass-border)]">
                    <button
                        onClick={() => onPageChange(page - 1)}
                        disabled={page === 1}
                        className="w-full sm:w-auto px-4 py-2 bg-[var(--glass-bg)] hover:bg-[var(--hover-bg)] text-[var(--foreground)] rounded-lg text-xs sm:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        {t("admin.pagination.previous")}
                    </button>
                    <span className="text-xs sm:text-sm text-[var(--text-muted)] whitespace-nowrap">
                        {t("admin.pagination.page")} {page} {t("admin.pagination.of")} {totalPages || 1}
                    </span>
                    <button
                        onClick={() => onPageChange(page + 1)}
                        disabled={page === totalPages}
                        className="w-full sm:w-auto px-4 py-2 bg-[var(--glass-bg)] hover:bg-[var(--hover-bg)] text-[var(--foreground)] rounded-lg text-xs sm:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                        {t("admin.pagination.next")}
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>
            )}
        </div>
    );
}
