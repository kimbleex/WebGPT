import { useEffect } from "react";
import { useUserManagement } from "./hooks/useUserManagement";

interface UserListProps {
    isActive: boolean;
    t: (key: string) => string;
}

export default function UserList({ isActive, t }: UserListProps) {
    const { users, loading, page, totalPages, fetchUsers, setPage } = useUserManagement();

    useEffect(() => {
        if (isActive) {
            fetchUsers(page, 10);
        }
    }, [isActive, page, fetchUsers]);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setPage(newPage);
        }
    };

    if (!isActive) return null;

    return (
        <div className="space-y-4">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-[var(--foreground)]">
                    <thead className="text-xs uppercase bg-[var(--glass-bg)] text-[var(--foreground)] font-bold tracking-wider border-b border-[var(--glass-border)]">
                        <tr>
                            <th scope="col" className="px-4 py-3 rounded-tl-lg">{t("admin.table.id")}</th>
                            <th scope="col" className="px-4 py-3">{t("admin.table.username")}</th>
                            <th scope="col" className="px-4 py-3">{t("admin.table.role")}</th>
                            <th scope="col" className="px-4 py-3">{t("admin.table.createdAt")}</th>
                            <th scope="col" className="px-4 py-3 rounded-tr-lg">{t("admin.table.expiresAt")}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--glass-border)]">
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="px-4 py-3 text-center text-[var(--text-muted)]">{t("admin.table.loading")}</td>
                            </tr>
                        ) : users.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-4 py-3 text-center text-[var(--text-muted)]">{t("admin.table.noUsers")}</td>
                            </tr>
                        ) : (
                            users.map((user) => (
                                <tr key={user.id} className="hover:bg-[var(--hover-bg)] transition-colors">
                                    <td className="px-4 py-3 font-medium">{user.id}</td>
                                    <td className="px-4 py-3 font-bold">{user.username}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded text-xs ${user.role === 'admin' ? 'bg-purple-500/10 text-purple-400' : 'bg-blue-500/10 text-blue-400'}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">{new Date(user.created_at).toLocaleDateString()}</td>
                                    <td className="px-4 py-3">{new Date(user.expires_at).toLocaleDateString()}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center pt-2 border-t border-[var(--glass-border)]">
                <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1 || loading}
                    className="px-3 py-1 bg-[var(--glass-bg)] hover:bg-[var(--hover-bg)] text-[var(--foreground)] rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {t("admin.pagination.previous")}
                </button>
                <span className="text-sm text-[var(--text-muted)]">
                    {t("admin.pagination.page")} {page} {t("admin.pagination.of")} {totalPages || 1} {t("admin.pagination.pages")}
                </span>
                <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page === totalPages || loading}
                    className="px-3 py-1 bg-[var(--glass-bg)] hover:bg-[var(--hover-bg)] text-[var(--foreground)] rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {t("admin.pagination.next")}
                </button>
            </div>
        </div>
    );
}
