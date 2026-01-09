"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/lib/i18n";

interface Token {
    code: string;
    duration_hours: number;
    is_used: number;
    created_at: number;
}

export default function AdminPanel() {
    const { t } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const [duration, setDuration] = useState(24);
    const [generatedToken, setGeneratedToken] = useState<string | null>(null);
    const [recentTokens, setRecentTokens] = useState<Token[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchTokens = async () => {
        try {
            const res = await fetch("/api/admin/tokens");
            const data = await res.json();
            if (data.tokens) {
                setRecentTokens(data.tokens);
            }
        } catch (e) {
            console.error("Failed to fetch tokens");
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchTokens();
        }
    }, [isOpen]);

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/tokens", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ duration_hours: duration }),
            });
            const data = await res.json();
            if (data.code) {
                setGeneratedToken(data.code);
                fetchTokens();
            }
        } catch (e) {
            alert("Failed to generate token");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Floating Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-4 right-4 bg-indigo-600 hover:bg-indigo-500 text-white p-3 rounded-full shadow-lg z-40 transition-transform hover:scale-105"
            >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            </button>

            {/* Modal */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-[#1a1a1c] border border-white/10 rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white">{t("admin.panel")}</h2>
                            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Generator */}
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

                        {/* Recent Tokens */}
                        <div>
                            <h3 className="text-sm font-medium text-gray-300 mb-3">{t("admin.recentTokens")}</h3>
                            <div className="max-h-60 overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-white/10">
                                {recentTokens.map((token) => (
                                    <div key={token.code} className="bg-white/5 rounded-lg p-3 flex justify-between items-center">
                                        <div>
                                            <p className="font-mono text-sm text-white">{token.code}</p>
                                            <p className="text-xs text-gray-500">
                                                {token.duration_hours} {t("admin.hours")} • {new Date(token.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className={`px-2 py-1 rounded text-xs ${token.is_used ? "bg-red-500/10 text-red-400" : "bg-green-500/10 text-green-400"}`}>
                                            {token.is_used ? t("admin.used") : "Active"}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
