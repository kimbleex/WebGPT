"use client";

import { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/lib/i18n";

interface SysPromptProps {
    sysPrompt: string;
    onSysPromptChange: (prompt: string) => void;
}

export default function SysPrompt({ sysPrompt, onSysPromptChange }: SysPromptProps) {
    const { t } = useLanguage();
    const [showPanel, setShowPanel] = useState(false);
    const [inputValue, setInputValue] = useState("");
    const panelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
                setShowPanel(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleOpen = () => {
        setShowPanel(!showPanel);
        if (!showPanel) {
            setInputValue(sysPrompt);
        }
    };

    const handleSave = () => {
        onSysPromptChange(inputValue);
        setShowPanel(false);
    };

    const handleClear = () => {
        setInputValue("");
        onSysPromptChange("");
        setShowPanel(false);
    };

    return (
        <div className="static sm:relative" ref={panelRef}>
            <button
                type="button"
                onClick={handleOpen}
                className={`flex items-center space-x-1 sm:space-x-1.5 hover:opacity-80 transition-opacity px-1.5 sm:px-2 py-1 rounded-lg border border-transparent hover:border-[var(--glass-border)]/30 active:scale-95 ${sysPrompt ? "text-[var(--accent-primary)]" : "text-[var(--text-muted)]"}`}
                title={t("chat.sysPrompt")}
            >
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="hidden xs:inline text-[10px] sm:text-xs md:text-sm truncate">
                    {t("chat.sysPrompt")}
                </span>
                {sysPrompt && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] flex-shrink-0" />
                )}
            </button>

            {showPanel && (
                <div className="absolute bottom-full left-0 mb-3 w-full sm:w-64 sm:max-w-[280px] rounded-xl sm:rounded-2xl bg-[var(--panel-bg)] border border-[var(--glass-border)] shadow-2xl z-[101] overflow-visible animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <div className="px-3 sm:px-4 py-2 border-b border-[var(--glass-border)]/30">
                        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{t("chat.sysPrompt")}</p>
                    </div>
                    <div className="p-3 space-y-2">
                        <textarea
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder={t("chat.sysPromptPlaceholder")}
                            className="w-full h-28 sm:h-32 px-3 py-2 text-xs sm:text-sm bg-[var(--hover-bg)]/50 border border-[var(--glass-border)]/50 rounded-lg resize-none focus:outline-none focus:border-[var(--accent-primary)]/50 focus:ring-1 focus:ring-[var(--accent-primary)]/50 transition-all placeholder-[var(--text-muted)]/50"
                        />
                        <div className="flex items-center justify-end gap-2">
                            <button
                                type="button"
                                onClick={handleClear}
                                className="px-3 py-1.5 text-[10px] sm:text-xs text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                            >
                                {t("chat.sysPromptClear")}
                            </button>
                            <button
                                type="button"
                                onClick={handleSave}
                                className="px-3 py-1.5 text-[10px] sm:text-xs bg-[var(--accent-primary)]/20 hover:bg-[var(--accent-primary)]/30 text-[var(--accent-primary)] rounded-lg transition-colors"
                            >
                                {t("chat.sysPromptSave")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
