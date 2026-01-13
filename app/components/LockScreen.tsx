"use client";

import { useState, useEffect } from "react";

interface LockScreenProps {
    onUnlock: (password: string) => void;
}

export default function LockScreen({ onUnlock }: LockScreenProps) {
    const [password, setPassword] = useState("");
    const [error, setError] = useState(false);
    const [isLocked, setIsLocked] = useState(true);

    useEffect(() => {
        const storedAuth = sessionStorage.getItem("is_authenticated");
        if (storedAuth === "true") {
            setIsLocked(false);
            // We might need to retrieve the password from storage if we need it for API calls,
            // but for security, we might just rely on the user re-entering it if session expires?
            // For this simple app, let's assume we store the password in session too or just the auth state.
            // Actually, we need the password to send to the API.
            // So let's store the password in sessionStorage as well.
            const storedPassword = sessionStorage.getItem("access_password");
            if (storedPassword) {
                onUnlock(storedPassword);
            }
        }
    }, [onUnlock]);

    const handleUnlock = (e: React.FormEvent) => {
        e.preventDefault();
        // In a real app, we might verify against a hash here, 
        // but the real security is the API rejecting requests without the right password.
        // So we just "unlock" the UI and let the API handle the rejection if wrong.
        // However, to give immediate feedback, we can do a simple check if we want, 
        // but the user said "password is configured in the config", implying server-side env var.
        // We can't check server-side env var from client without an API call.
        // So we'll just pass it through and let the first API call fail if it's wrong?
        // Or we can add a specific /api/verify route.
        // Let's add a simple verify step or just unlock.
        // For better UX, let's just unlock and store it.

        if (password.trim().length > 0) {
            sessionStorage.setItem("is_authenticated", "true");
            sessionStorage.setItem("access_password", password);
            setIsLocked(false);
            onUnlock(password);
        } else {
            setError(true);
        }
    };

    if (!isLocked) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--background)] bg-opacity-60 backdrop-blur-md transition-all duration-500 p-4">
            <div className="glass-panel w-full max-w-md p-6 sm:p-8 rounded-2xl flex flex-col items-center space-y-6 animate-in fade-in zoom-in duration-300">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                        WebGPT
                    </h1>
                    <p className="text-[var(--text-muted)] text-sm">Enter access key to continue</p>
                </div>

                <form onSubmit={handleUnlock} className="w-full space-y-4">
                    <div className="relative">
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                setError(false);
                            }}
                            placeholder="Access Key"
                            className={`w-full bg-[var(--hover-bg)] border ${error ? "border-red-500/50" : "border-[var(--glass-border)]"
                                } rounded-xl px-4 py-3 text-[var(--foreground)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)]/50 focus:ring-1 focus:ring-[var(--accent-primary)]/50 transition-all`}
                            autoFocus
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium py-3 rounded-xl transition-all shadow-lg shadow-indigo-500/20 active:scale-[0.98]"
                    >
                        Unlock System
                    </button>
                </form>
            </div>
        </div>
    );
}
