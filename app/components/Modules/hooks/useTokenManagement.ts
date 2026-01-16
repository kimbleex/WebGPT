import { useState, useEffect } from 'react';

export interface Token {
    code: string;
    duration_hours: number;
    is_used: number;
    created_at: number;
}

/**
 * useTokenManagement Hook
 * 
 * 功能 (What):
 * 管理令牌的获取和生成。
 * Manages token fetching and generation.
 * 
 * 生效范围 (Where):
 * AdminPanel 组件。
 * AdminPanel component.
 * 
 * 使用方法 (How):
 * const { recentTokens, generatedToken, loading, fetchTokens, generateToken } = useTokenManagement();
 */
export function useTokenManagement() {
    const [recentTokens, setRecentTokens] = useState<Token[]>([]);
    const [generatedToken, setGeneratedToken] = useState<string | null>(null);
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

    const generateToken = async (duration: number) => {
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
                return true;
            }
            return false;
        } catch (e) {
            console.error("Failed to generate token");
            return false;
        } finally {
            setLoading(false);
        }
    };

    return {
        recentTokens,
        generatedToken,
        setGeneratedToken,
        loading,
        fetchTokens,
        generateToken
    };
}
