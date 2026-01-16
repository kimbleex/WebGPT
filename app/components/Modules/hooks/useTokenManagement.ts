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
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    const fetchTokens = async (pageNum: number = 1, limit: number = 3) => {
        try {
            const res = await fetch(`/api/admin/tokens?page=${pageNum}&limit=${limit}`);
            const data = await res.json();
            if (data.tokens) {
                setRecentTokens(data.tokens);
                setTotal(data.total);
                setTotalPages(data.totalPages);
                setPage(data.page);
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
                fetchTokens(page); // Refresh current page
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
        generateToken,
        page,
        setPage,
        totalPages,
        total
    };
}
