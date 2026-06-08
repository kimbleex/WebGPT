"use client";

import { memo } from "react";

interface ThinkingStepProps {
    title: string;
    status: "pending" | "running" | "completed" | "error";
    description?: string;
    duration?: number;
}

const ThinkingStep = memo(({ title, status, description, duration }: ThinkingStepProps) => {
    return (
        <div className="flex items-start gap-3 py-2 px-3 bg-[var(--code-bg)] border border-[var(--border-color)] transition-all duration-300">
            {/* Status Icon - Terminal Style */}
            <div className="flex-shrink-0 mt-0.5">
                {status === "pending" && (
                    <div className="w-5 h-5 border-2 border-[var(--text-muted)] opacity-40"></div>
                )}
                {status === "running" && (
                    <div className="w-5 h-5 border-2 border-[var(--accent-primary)] border-t-transparent animate-spin"></div>
                )}
                {status === "completed" && (
                    <div className="w-5 h-5 bg-[var(--success-color)]/20 border-2 border-[var(--success-color)] flex items-center justify-center">
                        <svg className="w-3 h-3 text-[var(--success-color)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                )}
                {status === "error" && (
                    <div className="w-5 h-5 bg-[var(--error-color)]/20 border-2 border-[var(--error-color)] flex items-center justify-center">
                        <svg className="w-3 h-3 text-[var(--error-color)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-mono font-bold text-[var(--accent-primary)] flex items-center gap-2">
                        <span>&gt;</span>
                        <span>{title}</span>
                    </h4>
                    {duration && status === "completed" && (
                        <span className="text-[10px] text-[var(--text-muted)] font-mono whitespace-nowrap">{duration}ms</span>
                    )}
                </div>
                {description && (
                    <p className="text-[10px] text-[var(--text-muted)] mt-1 leading-relaxed font-mono ml-4">{description}</p>
                )}
            </div>
        </div>
    );
});

ThinkingStep.displayName = "ThinkingStep";

export default ThinkingStep;
