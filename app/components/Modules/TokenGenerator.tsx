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
        <div className="bg-white/5 rounded-xl p-4 mb-6">
            <h3 className="text-sm font-medium text-gray-300 mb-3">{t("admin.generateToken")}</h3>
            <div className="flex gap-3">
                <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">{t("admin.duration")}</label>
                    <input
                        type="number"
                        value={duration}
                        onChange={(e) => setDuration(Number(e.target.value))}
                        className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                    />
                </div>
                <div className="flex items-end">
                    <button
                        onClick={handleGenerate}
                        disabled={loading}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                    >
                        {loading ? t("admin.loading") : t("admin.generate")}
                    </button>
                </div>
            </div>
            {generatedToken && (
                <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <p className="text-xs text-green-400 mb-1">Token Generated:</p>
                    <code className="text-lg font-mono text-white select-all">{generatedToken}</code>
                </div>
            )}
        </div>
    );
}
