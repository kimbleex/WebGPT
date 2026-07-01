import { useEffect, useState } from "react";
import { useUserManagement } from "./hooks/useUserManagement";

interface UserListProps {
    isActive: boolean;
    t: (key: string) => string;
}

export default function UserList({ isActive, t }: UserListProps) {
    const { users, loading, page, totalPages, fetchUsers, updateUserAccess, setPage } = useUserManagement();
    const [extensionHours, setExtensionHours] = useState<Record<number, string>>({});

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

    const formatDate = (value: number) => new Date(value).toLocaleString();

    const handleExtend = async (userId: number) => {
        const hours = Number(extensionHours[userId]);
        if (!Number.isInteger(hours) || hours < 1) {
            alert(t("admin.actions.invalidHours"));
            return;
        }

        const success = await updateUserAccess(userId, "extend", hours);
        if (success) {
            setExtensionHours((prev) => ({ ...prev, [userId]: "" }));
        }
    };

    if (!isActive) return null;

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <div className="flex-shrink-0 flex items-center gap-2 mb-4 sm:mb-5">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--accent-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <h3 className="text-base sm:text-lg font-semibold text-[var(--foreground)]">{t("profile.userManagement")}</h3>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-[var(--border-color)] scrollbar-track-transparent">
                <div className="block sm:hidden space-y-3">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 text-[var(--text-muted)]">
                            <svg className="animate-spin h-8 w-8 mb-3" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <p className="text-sm">{t("admin.table.loading")}</p>
                        </div>
                    ) : users.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center text-[var(--text-muted)] text-sm">
                            <svg className="w-16 h-16 mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <p>{t("admin.table.noUsers")}</p>
                        </div>
                    ) : (
                        users.map((user) => (
                            <div key={user.id} className="bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-lg p-4 space-y-3">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-[var(--foreground)] truncate">{user.username}</p>
                                        <p className="text-xs text-[var(--text-muted)]">ID: {user.id}</p>
                                    </div>
                                    <span className={`flex-shrink-0 px-2 py-1 rounded-full text-xs font-medium ${user.role === "admin" ? "bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]" : "bg-blue-500/10 text-blue-400"}`}>
                                        {user.role}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.is_disabled ? "bg-red-500/10 text-red-400" : "bg-emerald-500/10 text-emerald-400"}`}>
                                        {user.is_disabled ? t("admin.actions.disabled") : t("admin.actions.active")}
                                    </span>
                                    <button
                                        onClick={() => updateUserAccess(user.id, user.is_disabled ? "enable" : "disable")}
                                        disabled={loading}
                                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors disabled:opacity-50 ${user.is_disabled ? "bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20" : "bg-red-500/10 text-red-300 hover:bg-red-500/20"}`}
                                    >
                                        {user.is_disabled ? t("admin.actions.enable") : t("admin.actions.disable")}
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div>
                                        <p className="text-[var(--text-muted)] mb-0.5">{t("admin.table.createdAt")}</p>
                                        <p className="text-[var(--foreground)]">{formatDate(user.created_at)}</p>
                                    </div>
                                    <div>
                                        <p className="text-[var(--text-muted)] mb-0.5">{t("admin.table.expiresAt")}</p>
                                        <p className="text-[var(--foreground)]">{formatDate(user.expires_at)}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        min={1}
                                        value={extensionHours[user.id] ?? ""}
                                        onChange={(event) => setExtensionHours((prev) => ({ ...prev, [user.id]: event.target.value }))}
                                        placeholder={t("admin.actions.extendHours")}
                                        className="min-w-0 flex-1 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md px-3 py-2 text-xs text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/40"
                                    />
                                    <button
                                        onClick={() => handleExtend(user.id)}
                                        disabled={loading}
                                        className="px-3 py-2 rounded-md bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/20 text-xs font-medium transition-colors disabled:opacity-50"
                                    >
                                        {t("admin.actions.extend")}
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="hidden sm:block rounded-lg border border-[var(--border-color)] overflow-x-auto">
                    <table className="w-full min-w-[1040px] text-left text-sm text-[var(--foreground)]">
                        <thead className="text-xs uppercase bg-[var(--glass-bg)] text-[var(--foreground)] font-semibold border-b border-[var(--border-color)] sticky top-0">
                            <tr>
                                <th scope="col" className="px-4 py-3">{t("admin.table.id")}</th>
                                <th scope="col" className="px-4 py-3">{t("admin.table.username")}</th>
                                <th scope="col" className="px-4 py-3">{t("admin.table.role")}</th>
                                <th scope="col" className="px-4 py-3">{t("admin.table.status")}</th>
                                <th scope="col" className="px-4 py-3">{t("admin.table.createdAt")}</th>
                                <th scope="col" className="px-4 py-3">{t("admin.table.expiresAt")}</th>
                                <th scope="col" className="px-4 py-3">{t("admin.table.actions")}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-color)]">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-12 text-center text-[var(--text-muted)]">
                                        <svg className="animate-spin h-8 w-8 mx-auto mb-3" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        {t("admin.table.loading")}
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-12 text-center text-[var(--text-muted)]">
                                        <svg className="w-16 h-16 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                        {t("admin.table.noUsers")}
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user.id} className="hover:bg-[var(--hover-bg)] transition-colors">
                                        <td className="px-4 py-3 font-medium text-[var(--text-muted)]">{user.id}</td>
                                        <td className="px-4 py-3 font-semibold">{user.username}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${user.role === "admin" ? "bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]" : "bg-blue-500/10 text-blue-400"}`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${user.is_disabled ? "bg-red-500/10 text-red-400" : "bg-emerald-500/10 text-emerald-400"}`}>
                                                {user.is_disabled ? t("admin.actions.disabled") : t("admin.actions.active")}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-[var(--text-muted)] whitespace-nowrap">{formatDate(user.created_at)}</td>
                                        <td className="px-4 py-3 text-[var(--text-muted)] whitespace-nowrap">{formatDate(user.expires_at)}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => updateUserAccess(user.id, user.is_disabled ? "enable" : "disable")}
                                                    disabled={loading}
                                                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors disabled:opacity-50 ${user.is_disabled ? "bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20" : "bg-red-500/10 text-red-300 hover:bg-red-500/20"}`}
                                                >
                                                    {user.is_disabled ? t("admin.actions.enable") : t("admin.actions.disable")}
                                                </button>
                                                <input
                                                    type="number"
                                                    min={1}
                                                    value={extensionHours[user.id] ?? ""}
                                                    onChange={(event) => setExtensionHours((prev) => ({ ...prev, [user.id]: event.target.value }))}
                                                    placeholder={t("admin.actions.extendHours")}
                                                    className="w-24 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-md px-2 py-1.5 text-xs text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/40"
                                                />
                                                <button
                                                    onClick={() => handleExtend(user.id)}
                                                    disabled={loading}
                                                    className="px-3 py-1.5 rounded-md bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/20 text-xs font-medium transition-colors disabled:opacity-50"
                                                >
                                                    {t("admin.actions.extend")}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {totalPages > 1 && (
                <div className="flex-shrink-0 flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 mt-4 border-t border-[var(--border-color)]">
                    <button
                        onClick={() => handlePageChange(page - 1)}
                        disabled={page === 1 || loading}
                        className="w-full sm:w-auto px-4 py-2 bg-[var(--glass-bg)] hover:bg-[var(--hover-bg)] text-[var(--foreground)] rounded-lg text-xs sm:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        {t("admin.pagination.previous")}
                    </button>
                    <span className="text-xs sm:text-sm text-[var(--text-muted)] whitespace-nowrap">
                        {t("admin.pagination.page")} {page} {t("admin.pagination.of")} {totalPages || 1}
                    </span>
                    <button
                        onClick={() => handlePageChange(page + 1)}
                        disabled={page === totalPages || loading}
                        className="w-full sm:w-auto px-4 py-2 bg-[var(--glass-bg)] hover:bg-[var(--hover-bg)] text-[var(--foreground)] rounded-lg text-xs sm:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                        {t("admin.pagination.next")}
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>
            )}
        </div>
    );
}
