import { useState } from 'react';
import { useLanguage } from '@/lib/i18n';

/**
 * useRenewToken Hook
 * 
 * 功能 (What):
 * 处理用户 Token 续期逻辑。
 * Handles user token renewal logic.
 * 
 * 生效范围 (Where):
 * 主要用于 Sidebar 组件中的续期功能。
 * Mainly used in the Sidebar component for renewal functionality.
 * 
 * 使用方法 (How):
 * const { renewToken, setRenewToken, showRenew, setShowRenew, handleRenew } = useRenewToken();
 */
export function useRenewToken() {
    const { t } = useLanguage();
    const [renewToken, setRenewToken] = useState("");
    const [showRenew, setShowRenew] = useState(false);

    const handleRenew = async () => {
        try {
            const res = await fetch("/api/auth/renew", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token: renewToken })
            });
            const data = await res.json();
            if (data.success) {
                alert(t("sidebar.renewSuccess"));
                setShowRenew(false);
                setRenewToken("");
                window.location.reload();
            } else {
                alert(data.error || t("sidebar.renewFail"));
            }
        } catch (e) {
            alert(t("sidebar.renewFail"));
        }
    };

    return {
        renewToken,
        setRenewToken,
        showRenew,
        setShowRenew,
        handleRenew
    };
}
