"use client";

import { useState } from "react";

interface ModelSelectorProps {
    selectedModel: string;
    onModelChange: (model: string) => void;
}

export const MODELS = [
    // { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo" },
    { id: "gpt-4", name: "GPT-4" },
    { id: "grok-4.1", name: "Grok-4.1" },
    { id: "claude-opus-4-5-20251101", name: "Claude Opus 4.5" },
    // { id: "claude-3-sonnet", name: "Claude 3 Sonnet" },
];

export default function ModelSelector({ selectedModel, onModelChange }: ModelSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);

    const toggleDropdown = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsOpen(!isOpen);
    };

    return (
        <div className="relative">
            <button
                onClick={toggleDropdown}
                className="flex items-center space-x-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-[var(--hover-bg)] border border-[var(--glass-border)] hover:border-[var(--accent-primary)]/30 hover:bg-[var(--hover-bg)]/80 transition-all text-xs sm:text-sm font-medium text-[var(--foreground)] shadow-sm"
            >
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--accent-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="truncate max-w-[100px] sm:max-w-none">{MODELS.find(m => m.id === selectedModel)?.name || selectedModel}</span>
                <svg
                    className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform ${isOpen ? "rotate-0" : "rotate-180"}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-[100]"
                        onClick={() => setIsOpen(false)}
                    />
                    <div
                        className="absolute bottom-full left-0 mb-2 w-[calc(100vw-2rem)] sm:w-64 max-w-[280px] py-2 rounded-2xl bg-[var(--panel-bg)] border border-[var(--glass-border)] shadow-2xl z-[101] overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200"
                    >
                        <div className="px-3 py-2 border-b border-[var(--glass-border)]/30">
                            <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Select Model</p>
                        </div>
                        {MODELS.map((model) => (
                            <button
                                key={model.id}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onModelChange(model.id);
                                    setIsOpen(false);
                                }}
                                className={`w-full text-left px-4 py-3 text-sm transition-all flex items-center justify-between group ${selectedModel === model.id
                                    ? "bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] font-medium"
                                    : "text-[var(--foreground)] hover:bg-[var(--hover-bg)] hover:pl-5"
                                    }`}
                            >
                                <span>{model.name}</span>
                                {selectedModel === model.id && (
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
