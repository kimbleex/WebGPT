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
        <div>
            <h3 className="text-sm font-medium text-[var(--text-muted)] mb-3">{t("admin.recentTokens")}</h3>
            <div className="space-y-2 mb-4">
                {tokens.map((token) => (
                    <div key={token.code} className="bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-lg p-3 flex justify-between items-center">
                        <div>
                            <p className="font-mono text-sm font-bold text-[var(--foreground)]">{token.code}</p>
                            <p className="text-xs text-[var(--foreground)] opacity-70">
                                {token.duration_hours} {t("admin.hours")} • {new Date(token.created_at).toLocaleDateString()}
                            </p>
                        </div>
                        <div className={`px-2 py-1 rounded text-xs font-medium ${token.is_used ? "bg-red-500/10 text-red-500" : "bg-green-500/10 text-green-500"}`}>
                            {token.is_used ? t("admin.used") : "Active"}
                        </div>
                    </div>
                ))}
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center pt-2 border-t border-[var(--glass-border)]">
                <button
                    onClick={() => onPageChange(page - 1)}
                    disabled={page === 1}
                    className="px-3 py-1 bg-[var(--glass-bg)] hover:bg-[var(--hover-bg)] text-[var(--foreground)] rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {t("admin.pagination.previous")}
                </button>
                <span className="text-sm text-[var(--text-muted)]">
                    {t("admin.pagination.page")} {page} {t("admin.pagination.of")} {totalPages || 1} {t("admin.pagination.pages")}
                </span>
                <button
                    onClick={() => onPageChange(page + 1)}
                    disabled={page === totalPages}
                    className="px-3 py-1 bg-[var(--glass-bg)] hover:bg-[var(--hover-bg)] text-[var(--foreground)] rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {t("admin.pagination.next")}
                </button>
            </div>
        </div>
    );
}
