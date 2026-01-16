import { MODELS } from "../ModelSelector";
import SysPrompt from "./SysPrompt";

interface StatusBarProps {
    selectedModel: string;
    setSelectedModel: (model: string) => void;
    showModelMenu: boolean;
    setShowModelMenu: (show: boolean) => void;
    setShowActionMenu: (show: boolean) => void;
    sysPrompt: string;
    setSysPrompt: (prompt: string) => void;
    memoryUsage: { used: number; limit: number } | null;
    clearChatHistory: () => void;
    modelMenuRef: React.RefObject<HTMLDivElement | null>;
    t: (key: string) => string;
}

/**
 * StatusBar Component
 * 
 * 功能 (What):
 * 显示底部状态栏，包含模型选择、系统提示词设置、内存监控和清理功能。
 * Displays the bottom status bar, including model selection, system prompt settings, memory monitoring, and cleanup functionality.
 * 
 * 生效范围 (Where):
 * 位于 ChatInterface 底部，输入框上方。
 * Located at the bottom of ChatInterface, above the input area.
 * 
 * 使用方法 (How):
 * <StatusBar {...props} />
 */
export default function StatusBar({
    selectedModel,
    setSelectedModel,
    showModelMenu,
    setShowModelMenu,
    setShowActionMenu,
    sysPrompt,
    setSysPrompt,
    memoryUsage,
    clearChatHistory,
    modelMenuRef,
    t
}: StatusBarProps) {
    return (
        <div className="relative bg-[var(--panel-bg)]/60 backdrop-blur-xl border border-[var(--glass-border)]/60 rounded-xl px-2 sm:px-4 py-1.5 sm:py-1.5 shadow-lg flex items-center justify-between gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Left Section - Model Selection */}
            <div className="flex items-center min-w-0">
                {/* Model Selection - Clickable */}
                <div className="relative" ref={modelMenuRef}>
                    <button
                        type="button"
                        onClick={() => {
                            setShowModelMenu(!showModelMenu);
                            setShowActionMenu(false);
                        }}
                        className="flex items-center space-x-1 sm:space-x-2 hover:opacity-80 transition-opacity px-1.5 sm:px-2 py-1 rounded-lg border border-transparent hover:border-[var(--glass-border)]/30 active:scale-95"
                    >
                        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span className="hidden xs:inline text-[10px] sm:text-xs md:text-sm text-[var(--text-muted)] truncate">
                            {t("chat.modelSelection")}:
                        </span>
                        <span className="text-[10px] sm:text-xs md:text-sm font-medium text-[var(--foreground)] truncate opacity-90 max-w-[50px] sm:max-w-[100px]">
                            {MODELS.find(m => m.id === selectedModel)?.name || MODELS[0]?.name || selectedModel}
                        </span>
                        <svg className={`w-2.5 h-2.5 sm:w-3 sm:h-3 text-[var(--text-muted)] flex-shrink-0 transition-transform duration-200 ${showModelMenu ? 'rotate-180' : 'rotate-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    {/* Model Selection Dropdown */}
                    {showModelMenu && (
                        <div className="absolute bottom-full left-0 mb-3 w-64 max-w-[280px] rounded-xl sm:rounded-2xl bg-[var(--panel-bg)] border border-[var(--glass-border)] shadow-2xl z-[101] overflow-visible animate-in fade-in slide-in-from-bottom-2 duration-200">
                            <div className="px-3 sm:px-4 py-2 border-b border-[var(--glass-border)]/30">
                                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{t("chat.modelSelection")}</p>
                            </div>
                            <div className="max-h-[8rem] sm:max-h-[10rem] overflow-y-auto scrollbar-thin scrollbar-thumb-[var(--glass-border)]/60 scrollbar-track-transparent">
                                {MODELS.map((model) => (
                                    <button
                                        key={model.id}
                                        onClick={() => {
                                            setSelectedModel(model.id);
                                            setShowModelMenu(false);
                                        }}
                                        className={`w-full text-left px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm flex items-center justify-between transition-all duration-150 first:rounded-t-xl last:rounded-b-xl ${selectedModel === model.id
                                            ? "bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] font-semibold"
                                            : "text-[var(--foreground)] hover:bg-[var(--hover-bg)]/70"
                                            }`}
                                    >
                                        <span className="truncate">{model.name}</span>
                                        {selectedModel === model.id && (
                                            <svg className="w-3.5 h-3.5 flex-shrink-0 ml-2 text-[var(--accent-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* System Prompt */}
                <div className="h-4 w-px border-r border-[var(--glass-border)]/30 flex-shrink-0" />
                <SysPrompt sysPrompt={sysPrompt} onSysPromptChange={setSysPrompt} />
            </div>

            {/* Right Section - Memory Cleanup */}
            <div className="flex items-center gap-1 sm:gap-2 ml-auto">
                {/* Memory Usage Display - Hidden on very small screens */}
                {memoryUsage ? (
                    <div
                        className="hidden sm:flex items-center space-x-1 text-[10px] md:text-xs text-[var(--text-muted)] border-r border-[var(--glass-border)]/30 pr-2 sm:pr-3 cursor-pointer hover:text-[var(--foreground)] transition-colors group"
                        onClick={() => {
                            const memoryInfo = (performance as any).memory;
                            if (memoryInfo) {
                                // This is just for display update, the actual monitoring is in the hook
                                // We can't update the hook state from here directly unless we pass a refresh function
                                // For now, we just rely on the interval in the hook
                            }
                        }}
                        title="点击刷新内存状态"
                    >
                        <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-500 group-hover:rotate-180 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span className="font-medium transition-all">
                            {memoryUsage.used}MB
                        </span>
                        <span className={`px-1 py-0.5 rounded text-[7px] font-bold transition-colors ${memoryUsage.used / memoryUsage.limit > 0.8
                            ? 'bg-red-500/20 text-red-500'
                            : memoryUsage.used / memoryUsage.limit > 0.6
                                ? 'bg-yellow-500/20 text-yellow-500'
                                : 'bg-green-500/20 text-green-500'
                            }`}>
                            {Math.round((memoryUsage.used / memoryUsage.limit) * 100)}%
                        </span>
                    </div>
                ) : (
                    <div className="hidden sm:flex items-center space-x-1 text-[10px] md:text-xs text-[var(--text-muted)] border-r border-[var(--glass-border)]/30 pr-2 sm:pr-3">
                        <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>N/A</span>
                    </div>
                )}

                {/* Memory Cleanup Button */}
                <button
                    type="button"
                    onClick={clearChatHistory}
                    className="flex items-center justify-center p-1.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-xs bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg text-red-500 hover:text-red-600 transition-colors active:scale-95"
                    title={t("chat.cleanupMemory") || "Clear chat history"}
                >
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span className="hidden sm:inline ml-1">{t("chat.cleanupMemory") || "Clean"}</span>
                </button>
            </div>
        </div>
    );
}
