import { useState, useCallback } from 'react';

interface User {
    id: number;
    username: string;
    role: string;
    created_at: number;
    expires_at: number;
    is_disabled: boolean;
}

interface UseUserManagementReturn {
    users: User[];
    loading: boolean;
    total: number;
    page: number;
    totalPages: number;
    fetchUsers: (page?: number, limit?: number) => Promise<void>;
    updateUserAccess: (userId: number, action: "disable" | "enable" | "extend", hours?: number) => Promise<boolean>;
    setPage: (page: number) => void;
}

export function useUserManagement(): UseUserManagementReturn {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);

    const fetchUsers = useCallback(async (pageNum: number = 1, limit: number = 10) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/users?page=${pageNum}&limit=${limit}`);
            if (res.ok) {
                const data = await res.json();
                setUsers(data.users);
                setTotal(data.total);
                setTotalPages(data.totalPages);
                setPage(data.page);
            }
        } catch {
            // Silently handle user fetch errors
        } finally {
            setLoading(false);
        }
    }, []);

    const updateUserAccess = useCallback(async (userId: number, action: "disable" | "enable" | "extend", hours?: number) => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/users", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, action, hours }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || "Failed to update user");
            }

            await fetchUsers(page, 10);
            return true;
        } catch (error) {
            alert(error instanceof Error ? error.message : "Failed to update user");
            return false;
        } finally {
            setLoading(false);
        }
    }, [fetchUsers, page]);

    return {
        users,
        loading,
        total,
        page,
        totalPages,
        fetchUsers,
        updateUserAccess,
        setPage
    };
}
