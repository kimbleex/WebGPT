"use client";

import { useEffect } from "react";

interface ToastProps {
    message: string;
    type: "success" | "error" | "info";
    onClose: () => void;
    duration?: number;
}

export default function Toast({ message, type, onClose, duration = 3000 }: ToastProps) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const bgColors = {
        success: "bg-green-500",
        error: "bg-red-500",
        info: "bg-blue-500",
    };

    const icons = {
        success: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
        ),
        error: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
        ),
        info: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
    };

    return (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
            <div className={`${bgColors[type]} text-white rounded-lg shadow-lg p-4 flex items-center gap-3 min-w-[300px] max-w-md`}>
                <div className="flex-shrink-0">
                    {icons[type]}
                </div>
                <p className="flex-1 text-sm font-medium">{message}</p>
                <button
                    onClick={onClose}
                    className="flex-shrink-0 hover:bg-white/20 rounded p-1 transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
