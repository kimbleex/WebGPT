"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/lib/i18n";
import { useTokenManagement } from "./Modules/hooks/useTokenManagement";
import TokenGenerator from "./Modules/TokenGenerator";
import TokenList from "./Modules/TokenList";

/**
 * AdminPanel Component
 * 
 * 功能 (What):
 * 管理员面板，提供令牌生成和查看功能。
 * Admin panel, providing token generation and viewing functionality.
 * 
 * 生效范围 (Where):
 * 作为一个浮动按钮存在于页面右下角，点击展开模态框。
 * Exists as a floating button in the bottom right corner of the page, expands to a modal on click.
 * 
 * 使用方法 (How):
 * <AdminPanel />
 */
export default function AdminPanel() {
    const { t } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const [duration, setDuration] = useState(24);

    const {
        recentTokens,
        generatedToken,
        loading,
        fetchTokens,
        generateToken
    } = useTokenManagement();

    useEffect(() => {
        if (isOpen) {
            fetchTokens();
        }
    }, [isOpen]);

    const handleGenerate = async () => {
        const success = await generateToken(duration);
        if (!success) {
            alert("Failed to generate token");
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
                        <TokenGenerator
                            duration={duration}
                            setDuration={setDuration}
                            handleGenerate={handleGenerate}
                            loading={loading}
                            generatedToken={generatedToken}
                            t={t}
                        />

                        {/* Recent Tokens */}
                        <TokenList tokens={recentTokens} t={t} />
                    </div>
                </div>
            )}
        </>
    );
}
