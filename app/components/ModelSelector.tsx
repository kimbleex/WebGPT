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

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-sm font-medium text-gray-200"
            >
                <span>{MODELS.find(m => m.id === selectedModel)?.name || selectedModel}</span>
                <svg
                    className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
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
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute top-full left-0 mt-2 w-48 py-1 rounded-xl bg-[#1a1a1a] border border-white/10 shadow-xl z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        {MODELS.map((model) => (
                            <button
                                key={model.id}
                                onClick={() => {
                                    onModelChange(model.id);
                                    setIsOpen(false);
                                }}
                                className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${selectedModel === model.id
                                    ? "bg-indigo-500/20 text-indigo-300"
                                    : "text-gray-300 hover:bg-white/5"
                                    }`}
                            >
                                {model.name}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
