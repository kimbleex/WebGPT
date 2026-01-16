"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type Language = "en" | "cn";

const translations = {
    en: {
        auth: {
            login: "Login",
            register: "Register",
            username: "Username",
            password: "Password",
            token: "Registration Token",
            tokenPlaceholder: "Enter token code",
            usernamePlaceholder: "Enter username",
            passwordPlaceholder: "Enter password",
            unlock: "Unlock Access",
            createAccount: "Create Account",
            processing: "Processing...",
            error: "Authentication failed",
            defaultTitle: "WebGPT Access",
            defaultSubtitleLogin: "Enter your credentials to continue",
            defaultSubtitleRegister: "Register with a valid token",
        },
        sidebar: {
            newChat: "New Chat",
            noHistory: "No history yet.",
            newConversation: "New Conversation",
            expires: "Expires:",
            renew: "Renew Subscription",
            submit: "Submit",
            tokenPlaceholder: "Enter token",
            renewSuccess: "Subscription renewed!",
            renewFail: "Failed to renew",
            forever: "Forever",
            logout: "Logout",
            theme: {
                light: "Light Mode",
                dark: "Dark Mode",
            },
        },
        chat: {
            selectChat: "Select a chat or start a new one.",
            startChat: "Start New Chat",
            placeholder: "Type a message...",
            send: "Send",
            thinking: "Thinking...",
            imageOnly: "Currently only supports image analysis",
            disclaimer: "AI can make mistakes. Consider checking important information.",
            export: "Chat Export",
            saveAsImage: "Save as Long Image",
            exporting: "Exporting...",
            exportError: "Export failed. Please try again.",
            actions: "Actions",
            modelSelection: "Model Selection",
            uploadImage: "Upload Image",
            loadMore: "Load More Messages",
            cleanupMemory: "Clear History",
            cleanupSuccess: "Cleanup successful! Released {messageCount} messages, {fileCount} files, {imageCount} images",
            memoryUsage: "Memory Usage",
            file: "file",
            files: "files",
            exportNoMessages: "No chat messages to export",
            exportNoContainer: "Export failed: chat container not found",
            sysPrompt: "System Prompt",
            sysPromptPlaceholder: "You are a helpful assistant...",
            sysPromptSave: "Save",
            sysPromptClear: "Clear",
            sysPromptActive: "Active",
        },
        admin: {
            panel: "Admin Panel",
            generateToken: "Generate Token",
            duration: "Duration (hours)",
            generate: "Generate",
            recentTokens: "Recent Tokens",
            code: "Code",
            hours: "Hours",
            used: "Used",
            created: "Created",
            loading: "Loading...",
            yes: "Yes",
            no: "No",
        },
    },
    cn: {
        auth: {
            login: "登录",
            register: "注册",
            username: "用户名",
            password: "密码",
            token: "注册Token",
            tokenPlaceholder: "输入Token",
            usernamePlaceholder: "输入用户名",
            passwordPlaceholder: "输入密码",
            unlock: "登录系统",
            createAccount: "创建账户",
            processing: "处理中...",
            error: "认证失败",
            defaultTitle: "WebGPT 访问",
            defaultSubtitleLogin: "请输入您的凭证以继续",
            defaultSubtitleRegister: "使用有效邀请码注册",
        },
        sidebar: {
            newChat: "新对话",
            noHistory: "暂无历史记录",
            newConversation: "新对话",
            expires: "有效期至",
            renew: "延长使用期限",
            submit: "提交",
            tokenPlaceholder: "输入Token",
            renewSuccess: "已续期！",
            renewFail: "续期失败",
            forever: "永久",
            logout: "退出登录",
            theme: {
                light: "亮色模式",
                dark: "暗色模式",
            },
        },
        chat: {
            selectChat: "选择一个对话或开始新的对话",
            startChat: "开始新对话",
            placeholder: "输入消息...",
            send: "发送",
            thinking: "正在思考...",
            imageOnly: "当前仅支持图片分析",
            disclaimer: "AI 可能会犯错。请考虑核实重要信息。",
            export: "聊天导出",
            saveAsImage: "保存为长图",
            exporting: "正在导出...",
            exportError: "导出失败，请重试。",
            actions: "功能菜单",
            modelSelection: "模型选择",
            uploadImage: "上传图片",
            loadMore: "加载更多消息",
            cleanupMemory: "清除历史",
            cleanupSuccess: "清理成功！释放了 {messageCount} 条消息，{fileCount} 个文件，{imageCount} 张图片",
            memoryUsage: "内存使用",
            file: "个文件",
            files: "个文件",
            exportNoMessages: "暂无聊天记录可导出",
            exportNoContainer: "导出失败：未找到聊天容器",
            sysPrompt: "系统提示词",
            sysPromptPlaceholder: "你是一个有帮助的助手...",
            sysPromptSave: "保存",
            sysPromptClear: "清空",
            sysPromptActive: "已启用",
        },
        admin: {
            panel: "管理面板",
            generateToken: "生成Token",
            duration: "时长 (小时)",
            generate: "生成",
            recentTokens: "最近生成的Token",
            code: "Token",
            hours: "小时",
            used: "已使用",
            created: "创建时间",
            loading: "加载中...",
            yes: "是",
            no: "否",
        },
    },
};

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguage] = useState<Language>("en");

    useEffect(() => {
        const savedLang = localStorage.getItem("webgpt_language") as Language;
        if (savedLang && (savedLang === "en" || savedLang === "cn")) {
            setLanguage(savedLang);
        }
    }, []);

    const handleSetLanguage = (lang: Language) => {
        setLanguage(lang);
        localStorage.setItem("webgpt_language", lang);
    };

    const t = (path: string) => {
        const keys = path.split(".");
        let current: any = translations[language];
        for (const key of keys) {
            if (current[key] === undefined) return path;
            current = current[key];
        }
        return current;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }
        }>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error("useLanguage must be used within a LanguageProvider");
    }
    return context;
}
