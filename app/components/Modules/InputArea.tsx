import { memo } from "react";

interface InputAreaProps {
    input: string;
    setInput: (value: string) => void;
    isLoading: boolean;
    isComposing: boolean;
    setIsComposing: (value: boolean) => void;
    handleSubmit: (e?: React.FormEvent) => void;
    handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    removeFile: (index: number) => void;
    files: File[];
    imageUrlMap: Map<number, string>;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    textareaRef: React.RefObject<HTMLTextAreaElement | null>;
    actionMenuRef: React.RefObject<HTMLDivElement | null>;
    showActionMenu: boolean;
    setShowActionMenu: (value: boolean) => void;
    setActiveSubmenu: (value: string | null) => void;
    isExporting: boolean;
    handleExportImage: () => void;
    t: (key: string) => string;
}

const InputArea = memo(({
    input,
    setInput,
    isLoading,
    isComposing,
    setIsComposing,
    handleSubmit,
    handleFileChange,
    removeFile,
    files,
    imageUrlMap,
    fileInputRef,
    textareaRef,
    actionMenuRef,
    showActionMenu,
    setShowActionMenu,
    setActiveSubmenu,
    isExporting,
    handleExportImage,
    t
}: InputAreaProps) => {
    return (
        <div className="bg-[var(--panel-bg)]/70 backdrop-blur-2xl border border-[var(--glass-border)] rounded-xl sm:rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-visible animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Input Section */}
            <form onSubmit={handleSubmit} className="relative bg-transparent flex items-center p-2 sm:p-3 md:p-4 gap-1 sm:gap-2">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    multiple
                    accept="image/*"
                />

                {/* Consolidated Action Button */}
                <div className="relative" ref={actionMenuRef}>
                    <button
                        type="button"
                        onClick={() => {
                            setShowActionMenu(!showActionMenu);
                            setActiveSubmenu(null);
                        }}
                        className={`p-2.5 sm:p-3 text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--hover-bg)] rounded-xl transition-all mb-1 flex items-center justify-center active:scale-90 touch-manipulation ${showActionMenu ? 'bg-[var(--hover-bg)] text-[var(--foreground)]' : ''}`}
                        title={t("chat.actions")}
                    >
                        <svg className={`w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-300 ${showActionMenu ? 'rotate-45' : 'rotate-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                    </button>

                    {showActionMenu && (
                        <div className="absolute bottom-full left-0 mb-2 sm:mb-4 w-[calc(100vw-2rem)] sm:w-64 max-w-[280px] py-2 rounded-xl sm:rounded-2xl bg-[var(--panel-bg)] border border-[var(--glass-border)] shadow-2xl z-[101] overflow-visible animate-in fade-in slide-in-from-bottom-2 duration-200">
                            <div className="px-4 py-2 border-b border-[var(--glass-border)]/10">
                                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{t("chat.actions")}</p>
                            </div>

                            {/* Upload Image - Single Action */}
                            <button
                                type="button"
                                onClick={() => {
                                    fileInputRef.current?.click();
                                    setShowActionMenu(false);
                                    setActiveSubmenu(null);
                                }}
                                className="w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm transition-all flex items-center space-x-2 sm:space-x-3 group text-[var(--foreground)] hover:bg-[var(--hover-bg)]"
                            >
                                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h14a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span>{t("chat.uploadImage")}</span>
                            </button>

                            {/* Export Chat - Single Action */}
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleExportImage();
                                    setActiveSubmenu(null);
                                }}
                                disabled={isExporting}
                                className="w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm transition-all flex items-center space-x-2 sm:space-x-3 group text-[var(--foreground)] hover:bg-[var(--hover-bg)] disabled:opacity-50"
                            >
                                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                <span>{isExporting ? t("chat.exporting") : t("chat.saveAsImage")}</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Image Preview between Action Button and Textarea */}
                {files.length > 0 && (
                    <div className="flex items-center gap-0.5 px-0 py-2 bg-[var(--hover-bg)]/50 rounded-xl max-w-[280px] sm:max-w-[380px] md:max-w-[480px] overflow-visible flex-shrink-0 max-h-[150px] sm:max-h-[200px] md:max-h-[300px]">
                        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none h-full">
                            {files.slice(0, 4).map((file, displayIdx) => {
                                const originalIdx = displayIdx;
                                return (
                                    <div key={originalIdx} className="relative group flex-shrink-0 p-2">
                                        <div className="relative">
                                            {file.type.startsWith("image/") && imageUrlMap.has(originalIdx) ? (
                                                <img
                                                    src={imageUrlMap.get(originalIdx)!}
                                                    alt={file.name}
                                                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg object-cover border border-[var(--glass-border)]"
                                                />
                                            ) : (
                                                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[var(--panel-bg)] border border-[var(--glass-border)] flex items-center justify-center">
                                                    <svg className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                </div>
                                            )}
                                            <button
                                                onClick={() => removeFile(originalIdx)}
                                                className="absolute -top-2 -right-2 w-4.5 h-4.5 sm:w-5 sm:h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-100 transition-all text-[10px] sm:text-xs hover:bg-red-600 shadow-md hover:scale-110 z-20"
                                                title="Remove"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                            {files.length > 4 && (
                                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[var(--panel-bg)] border border-[var(--glass-border)] flex items-center justify-center text-[9px] sm:text-[10px] font-medium text-[var(--text-muted)] flex-shrink-0">
                                    +{files.length - 4}
                                </div>
                            )}
                        </div>
                        <span className="text-[10px] sm:text-[11px] text-[var(--text-muted)] whitespace-nowrap">
                            {files.length}
                        </span>
                    </div>
                )}

                <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => {
                        const newValue = e.target.value;
                        setInput(newValue);
                    }}
                    onCompositionStart={() => setIsComposing(true)}
                    onCompositionEnd={() => setIsComposing(false)}
                    onKeyDown={(e) => {
                        if (isComposing) return;

                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            if (!isLoading) {
                                handleSubmit();
                            }
                        }
                    }}
                    rows={1}
                    placeholder={t("chat.placeholder")}
                    className="w-full bg-transparent border-none px-2 sm:px-3 py-2.5 text-sm sm:text-base text-[var(--foreground)] placeholder-[var(--text-muted)]/70 focus:outline-none focus:ring-0 resize-none max-h-[150px] sm:max-h-[200px] md:max-h-[300px] overflow-y-auto scrollbar-none leading-relaxed"
                    disabled={isLoading}
                />

                <button
                    type="submit"
                    disabled={(!input.trim() && files.length === 0) || isLoading}
                    onClick={(e) => {
                        // 防止重复点击
                        if (isLoading) {
                            e.preventDefault();
                            return;
                        }
                    }}
                    className="p-2.5 sm:p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-500/20 ml-1 sm:ml-2 flex-shrink-0 self-center active:scale-90 touch-manipulation"
                >
                    {isLoading ? (
                        <svg className="animate-spin w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                    ) : (
                        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                    )}
                </button>
            </form>
        </div>
    );
});

InputArea.displayName = "InputArea";

export default InputArea;
