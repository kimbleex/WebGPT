"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n";
import { useTokenManagement } from "../components/Modules/hooks/useTokenManagement";
import TokenGenerator from "../components/Modules/TokenGenerator";
import TokenList from "../components/Modules/TokenList";
import UserList from "../components/Modules/UserList";
import Toast from "../components/Toast";

interface User {
    id: number;
    username: string;
    role: string;
    expires_at: number;
}

// 骨架屏组件
function SkeletonLoader() {
    return (
        <div className="animate-pulse space-y-4">
            <div className="h-32 bg-[var(--glass-bg)] rounded-xl"></div>
            <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-[var(--glass-bg)] rounded-lg"></div>
                ))}
            </div>
        </div>
    );
}

export default function ProfilePage() {
    const router = useRouter();
    const { t } = useLanguage();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'profile' | 'tokens' | 'users'>('profile');
    const [duration, setDuration] = useState(24);
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

    const {
        recentTokens,
        generatedToken,
        loading: tokenLoading,
        fetchTokens,
        generateToken,
        page,
        totalPages
    } = useTokenManagement();

    // 检查用户认证
    useEffect(() => {
        fetch("/api/auth/me")
            .then((res) => res.json())
            .then((data) => {
                if (data.user) {
                    setUser(data.user);
                } else {
                    router.push("/");
                }
            })
            .finally(() => setLoading(false));
    }, [router]);

    // 当切换到 tokens 或 users 标签时加载数据
    useEffect(() => {
        if (activeTab === 'tokens' && user?.role === 'admin') {
            fetchTokens();
        }
    }, [activeTab, user]);

    const handleGenerate = async () => {
        const success = await generateToken(duration);
        if (!success) {
            setToast({ message: t("admin.generateToken") + " failed", type: "error" });
        } else {
            setToast({ message: t("admin.generateToken") + " success", type: "success" });
        }
    };

    const handlePasswordChange = async () => {
        if (newPassword !== confirmPassword) {
            setToast({ message: t("profile.passwordMismatch"), type: "error" });
            return;
        }

        if (newPassword.length < 6) {
            setToast({ message: t("profile.passwordTooShort"), type: "error" });
            return;
        }

        setPasswordLoading(true);
        try {
            const res = await fetch("/api/auth/change-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ oldPassword, newPassword }),
            });

            const data = await res.json();

            if (res.ok) {
                setToast({ message: t("profile.passwordChangeSuccess"), type: "success" });
                setOldPassword("");
                setNewPassword("");
                setConfirmPassword("");
            } else {
                setToast({ message: data.error || t("profile.passwordChangeFail"), type: "error" });
            }
        } catch (error) {
            setToast({ message: t("profile.passwordChangeFail"), type: "error" });
        } finally {
            setPasswordLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--accent-primary)]"></div>
            </div>
        );
    }

    if (!user) return null;

    const isAdmin = user.role === 'admin';

    return (
        <div className="min-h-[100dvh] bg-[var(--background)] text-[var(--foreground)] flex flex-col">
            {/* Toast 通知 */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}

            {/* Header - 响应式优化 */}
            <header className="sticky top-0 z-10 border-b border-[var(--border-color)] bg-[var(--panel-bg)]/95 backdrop-blur-sm">
                <div className="w-full px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
                    <div className="flex items-center justify-between gap-2">
                        {/* 左侧：返回按钮和标题 */}
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                            <button
                                onClick={() => router.push("/")}
                                className="p-1.5 sm:p-2 hover:bg-[var(--hover-bg)] rounded-lg transition-colors flex-shrink-0"
                                aria-label="Back to home"
                            >
                                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                            </button>
                            <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-[var(--foreground)] truncate">
                                {t("profile.title")}
                            </h1>
                        </div>

                        {/* 右侧：用户信息 */}
                        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                            <div className="hidden sm:block text-right">
                                <p className="text-xs sm:text-sm font-medium truncate max-w-[120px]">{user.username}</p>
                                {isAdmin && (
                                    <span className="inline-block text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]">
                                        {t("profile.admin")}
                                    </span>
                                )}
                            </div>
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center text-xs sm:text-sm font-bold text-white shadow-lg">
                                {user.username.slice(0, 2).toUpperCase()}
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Tabs - 响应式优化 */}
            <div className="sticky top-[57px] sm:top-[65px] z-10 border-b border-[var(--border-color)] bg-[var(--sidebar-bg)]/95 backdrop-blur-sm overflow-x-auto scrollbar-none">
                <div className="flex gap-0 min-w-max sm:min-w-0 px-2 sm:px-4 lg:px-6">
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`px-3 sm:px-4 lg:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-medium transition-all whitespace-nowrap border-b-2 ${
                            activeTab === 'profile'
                                ? 'border-[var(--accent-primary)] text-[var(--accent-primary)]'
                                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--foreground)]'
                        }`}
                    >
                        {t("profile.personalInfo")}
                    </button>
                    {isAdmin && (
                        <>
                            <button
                                onClick={() => setActiveTab('tokens')}
                                className={`px-3 sm:px-4 lg:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-medium transition-all whitespace-nowrap border-b-2 ${
                                    activeTab === 'tokens'
                                        ? 'border-[var(--accent-primary)] text-[var(--accent-primary)]'
                                        : 'border-transparent text-[var(--text-muted)] hover:text-[var(--foreground)]'
                                }`}
                            >
                                {t("profile.tokenManagement")}
                            </button>
                            <button
                                onClick={() => setActiveTab('users')}
                                className={`px-3 sm:px-4 lg:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-medium transition-all whitespace-nowrap border-b-2 ${
                                    activeTab === 'users'
                                        ? 'border-[var(--accent-primary)] text-[var(--accent-primary)]'
                                        : 'border-transparent text-[var(--text-muted)] hover:text-[var(--foreground)]'
                                }`}
                            >
                                {t("profile.userManagement")}
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Content - 响应式优化，无需滚动 */}
            <div className="flex-1 overflow-hidden">
                <div className="h-full w-full px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
                    <div className="h-full max-w-7xl mx-auto">
                        {/* 个人信息 Tab - 左右两栏布局 */}
                        {activeTab === 'profile' && (
                            <div className="h-full grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                                {/* 左栏：账户信息 */}
                                <div className="bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-xl lg:rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col">
                                    <div className="flex items-center gap-2 mb-4 sm:mb-6">
                                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--accent-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        <h2 className="text-base sm:text-lg font-semibold text-[var(--foreground)]">
                                            {t("profile.accountInfo")}
                                        </h2>
                                    </div>
                                    <div className="flex-1 space-y-4 lg:space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-xs sm:text-sm text-[var(--text-muted)] font-medium">{t("auth.username")}</label>
                                            <div className="bg-[var(--input-bg)] border border-[var(--border-color)] rounded-lg px-3 sm:px-4 py-2.5 sm:py-3">
                                                <p className="text-sm sm:text-base font-medium text-[var(--foreground)]">{user.username}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs sm:text-sm text-[var(--text-muted)] font-medium">{t("profile.role")}</label>
                                            <div className="bg-[var(--input-bg)] border border-[var(--border-color)] rounded-lg px-3 sm:px-4 py-2.5 sm:py-3">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm sm:text-base font-medium text-[var(--foreground)] capitalize">{user.role}</p>
                                                    {isAdmin && (
                                                        <span className="px-2 py-0.5 rounded-full text-xs bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]">
                                                            {t("profile.admin")}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs sm:text-sm text-[var(--text-muted)] font-medium">{t("sidebar.expires")}</label>
                                            <div className="bg-[var(--input-bg)] border border-[var(--border-color)] rounded-lg px-3 sm:px-4 py-2.5 sm:py-3">
                                                <p className="text-sm sm:text-base font-medium text-[var(--foreground)]">
                                                    {(() => {
                                                        const date = new Date(user.expires_at);
                                                        return isNaN(date.getTime()) ? t("sidebar.forever") : date.toLocaleString();
                                                    })()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 右栏：修改密码 */}
                                <div className="bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-xl lg:rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col">
                                    <div className="flex items-center gap-2 mb-4 sm:mb-6">
                                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--accent-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                        <h2 className="text-base sm:text-lg font-semibold text-[var(--foreground)]">
                                            {t("profile.changePassword")}
                                        </h2>
                                    </div>
                                    <div className="flex-1 flex flex-col justify-between space-y-3 sm:space-y-4">
                                        <div className="space-y-3 sm:space-y-4">
                                            <div>
                                                <label className="block text-xs sm:text-sm text-[var(--text-muted)] font-medium mb-1.5 sm:mb-2">
                                                    {t("profile.oldPassword")}
                                                </label>
                                                <input
                                                    type="password"
                                                    value={oldPassword}
                                                    onChange={(e) => setOldPassword(e.target.value)}
                                                    className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/50 transition-all"
                                                    placeholder={t("profile.oldPasswordPlaceholder")}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs sm:text-sm text-[var(--text-muted)] font-medium mb-1.5 sm:mb-2">
                                                    {t("profile.newPassword")}
                                                </label>
                                                <input
                                                    type="password"
                                                    value={newPassword}
                                                    onChange={(e) => setNewPassword(e.target.value)}
                                                    className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/50 transition-all"
                                                    placeholder={t("profile.newPasswordPlaceholder")}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs sm:text-sm text-[var(--text-muted)] font-medium mb-1.5 sm:mb-2">
                                                    {t("profile.confirmPassword")}
                                                </label>
                                                <input
                                                    type="password"
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/50 transition-all"
                                                    placeholder={t("profile.confirmPasswordPlaceholder")}
                                                />
                                            </div>
                                        </div>
                                        <button
                                            onClick={handlePasswordChange}
                                            disabled={passwordLoading || !oldPassword || !newPassword || !confirmPassword}
                                            className="w-full bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 text-white py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-auto"
                                        >
                                            {passwordLoading ? (
                                                <>
                                                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    {t("admin.loading")}
                                                </>
                                            ) : (
                                                t("profile.changePassword")
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Token管理 Tab (仅管理员) - 左右两栏布局 */}
                        {activeTab === 'tokens' && isAdmin && (
                            <div className="h-full grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-6">
                                {/* 左栏：Token 生成器 (固定高度) */}
                                <div className="lg:col-span-2 bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-xl lg:rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col">
                                    {tokenLoading ? (
                                        <div className="flex items-center justify-center h-full">
                                            <svg className="animate-spin h-8 w-8" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                        </div>
                                    ) : (
                                        <TokenGenerator
                                            duration={duration}
                                            setDuration={setDuration}
                                            handleGenerate={handleGenerate}
                                            loading={tokenLoading}
                                            generatedToken={generatedToken}
                                            t={t}
                                        />
                                    )}
                                </div>

                                {/* 右栏：Token 列表 (可滚动) */}
                                <div className="lg:col-span-3 bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-xl lg:rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col overflow-hidden">
                                    {tokenLoading ? (
                                        <div className="flex items-center justify-center h-full">
                                            <svg className="animate-spin h-8 w-8" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col h-full overflow-hidden">
                                            <TokenList
                                                tokens={recentTokens}
                                                t={t}
                                                page={page}
                                                totalPages={totalPages}
                                                onPageChange={(newPage) => fetchTokens(newPage)}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* 用户管理 Tab (仅管理员) - 容器内滚动 */}
                        {activeTab === 'users' && isAdmin && (
                            <div className="h-full flex flex-col overflow-hidden">
                                <div className="flex-1 bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col overflow-hidden">
                                    {loading ? (
                                        <div className="flex items-center justify-center h-full">
                                            <svg className="animate-spin h-8 w-8" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                        </div>
                                    ) : (
                                        <UserList isActive={true} t={t} />
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
