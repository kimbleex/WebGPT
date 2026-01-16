import { useState } from 'react';

interface UseAuthProps {
    onLogin: (user: any) => void;
    t: (key: string) => string;
}

/**
 * useAuth Hook
 * 
 * 功能 (What):
 * 处理用户登录和注册逻辑。
 * Handles user login and registration logic.
 * 
 * 生效范围 (Where):
 * AuthScreen 组件。
 * AuthScreen component.
 * 
 * 使用方法 (How):
 * const { mode, setMode, username, setUsername, password, setPassword, token, setToken, error, loading, handleSubmit } = useAuth({ onLogin, t });
 */
export function useAuth({ onLogin, t }: UseAuthProps) {
    const [mode, setMode] = useState<"login" | "register">("login");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [token, setToken] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
            const body = mode === "login"
                ? { username, password }
                : { username, password, token };

            const res = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || t("auth.error"));
            }

            if (mode === "register") {
                window.location.reload();
            } else {
                onLogin(data.user);
            }

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return {
        mode,
        setMode,
        username,
        setUsername,
        password,
        setPassword,
        token,
        setToken,
        error,
        loading,
        handleSubmit
    };
}
