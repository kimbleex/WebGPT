import { Token } from "./hooks/useTokenManagement";

interface TokenListProps {
    tokens: Token[];
    t: (key: string) => string;
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
export default function TokenList({ tokens, t }: TokenListProps) {
    return (
        <div>
            <h3 className="text-sm font-medium text-gray-300 mb-3">{t("admin.recentTokens")}</h3>
            <div className="max-h-60 overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-white/10">
                {tokens.map((token) => (
                    <div key={token.code} className="bg-white/5 rounded-lg p-3 flex justify-between items-center">
                        <div>
                            <p className="font-mono text-sm text-white">{token.code}</p>
                            <p className="text-xs text-gray-500">
                                {token.duration_hours} {t("admin.hours")} • {new Date(token.created_at).toLocaleDateString()}
                            </p>
                        </div>
                        <div className={`px-2 py-1 rounded text-xs ${token.is_used ? "bg-red-500/10 text-red-400" : "bg-green-500/10 text-green-400"}`}>
                            {token.is_used ? t("admin.used") : "Active"}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
