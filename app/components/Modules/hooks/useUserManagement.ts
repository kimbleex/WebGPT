import { useState, useCallback } from 'react';

interface User {
    id: number;
    username: string;
    role: string;
    created_at: number;
    expires_at: number;
}

interface UseUserManagementReturn {
    users: User[];
    loading: boolean;
    total: number;
    page: number;
    totalPages: number;
    fetchUsers: (page?: number, limit?: number) => Promise<void>;
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
        } catch (error) {
            console.error("Failed to fetch users:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        users,
        loading,
        total,
        page,
        totalPages,
        fetchUsers,
        setPage
    };
}
