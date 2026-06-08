import { memo } from "react";

interface InputAreaProps {
    input: string;
    setInput: (value: string) => void;
    isLoading: boolean;
    isComposing: boolean;
    setIsComposing: (value: boolean) => void;
    handleSubmit: (e?: React.FormEvent) => void;
    handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handlePaste: (e: React.ClipboardEvent<HTMLTextAreaElement>) => void;
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
    handlePaste,
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
        <div className="bg-[var(--panel-bg)] backdrop-blur-xl border-2 border-[var(--border-color)] shadow-[var(--shadow-terminal)] overflow-visible relative">
            {/* Terminal prompt line */}
            <div className="absolute top-0 left-0 right-0 h-px bg-[var(--accent-gradient)]"></div>

            {/* Input Section */}
            <form onSubmit={handleSubmit} className="relative bg-transparent flex items-center p-2 gap-2">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    multiple
                    accept="image/*"
                />

                {/* Terminal prompt indicator */}
                <div className="flex-shrink-0 flex items-center">
                    <span className="text-[var(--accent-primary)] font-mono font-bold text-base">&gt;</span>
                </div>

                {/* Consolidated Action Button - Terminal Style */}
                <div className="relative" ref={actionMenuRef}>
                    <button
                        type="button"
                        onClick={() => {
                            setShowActionMenu(!showActionMenu);
                            setActiveSubmenu(null);
                        }}
                        className={`p-1.5 text-[var(--text-muted)] hover:text-[var(--accent-primary)] border border-[var(--border-color)] hover:border-[var(--hover-border)] transition-all flex items-center justify-center active:scale-95 touch-manipulation ${showActionMenu ? 'border-[var(--accent-primary)] text-[var(--accent-primary)]' : ''}`}
                        title={t("chat.actions")}
                    >
                        <svg className={`w-4 h-4 transition-transform duration-300 ${showActionMenu ? 'rotate-45' : 'rotate-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                    </button>

                    {showActionMenu && (
                        <div className="absolute bottom-full left-0 mb-3 w-[calc(100vw-2rem)] sm:w-64 max-w-[280px] py-2 bg-[var(--panel-bg)] border-2 border-[var(--border-color)] shadow-[var(--shadow-terminal)] z-[101] animate-slide-in">
                            <div className="px-4 py-2 border-b-2 border-[var(--border-color)] bg-[var(--code-header-bg)]">
                                <p className="text-[10px] font-bold font-mono text-[var(--accent-primary)] uppercase tracking-widest flex items-center gap-2">
                                    <span>&gt;</span>
                                    {t("chat.actions")}
                                </p>
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
                    onPaste={handlePaste}
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
                    className="flex-1 bg-transparent border-none px-2 py-1.5 text-sm text-[var(--foreground)] placeholder-[var(--text-muted)] focus:outline-none resize-none max-h-[100px] overflow-y-auto scrollbar-thin font-mono leading-relaxed"
                    disabled={isLoading}
                    style={{ minHeight: '32px' }}
                />

                <button
                    type="submit"
                    disabled={isLoading || (!input.trim() && files.length === 0)}
                    className="flex-shrink-0 p-2 border-2 border-[var(--border-color)] hover:border-[var(--accent-primary)] disabled:border-[var(--border-color)] disabled:opacity-40 bg-transparent hover:bg-[var(--accent-primary)] disabled:bg-transparent text-[var(--accent-primary)] hover:text-[var(--background)] disabled:text-[var(--text-muted)] transition-all active:scale-95 touch-manipulation group relative overflow-hidden"
                    title={isLoading ? t("chat.sending") : t("chat.send")}
                >
                    {isLoading ? (
                        <div className="w-4 h-4 border-2 border-[var(--text-muted)] border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                        <svg className="w-4 h-4 transform rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                    )}
                    <div className="absolute inset-0 bg-[var(--accent-gradient)] opacity-0 group-hover:opacity-100 transition-opacity -z-10"></div>
                </button>
            </form>
        </div>
    );
});

InputArea.displayName = "InputArea";

export default InputArea;
