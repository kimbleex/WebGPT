"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { getSetting, setSetting } from "./storage";

export type Language = "en" | "cn";

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
            users: "Users",
            tokens: "Tokens",
            table: {
                id: "ID",
                username: "Username",
                role: "Role",
                createdAt: "Created At",
                expiresAt: "Expires At",
                noUsers: "No users found",
                loading: "Loading...",
            },
            pagination: {
                previous: "Previous",
                next: "Next",
                page: "Page",
                of: "of",
                pages: "pages",
            }
        },
        storage: {
            title: "Storage Management",
            subtitle: "Manage your local chat sessions and data",
            sessionTitle: "Session Title",
            messages: "Messages",
            lastUpdated: "Last Updated",
            actions: "Actions",
            deleteSelected: "Delete Selected",
            clearAll: "Clear All",
            confirmClear: "Are you sure you want to clear all sessions? This cannot be undone.",
            confirmDelete: "Are you sure you want to delete the selected sessions?",
            noData: "No data found in local storage.",
            stats: "Storage Stats",
            totalSessions: "Total Sessions",
            totalMessages: "Total Messages",
            estimatedSize: "Estimated Size",
            close: "Close",
            delete: "Delete",
            tabs: {
                sessions: "Chat Sessions",
                settings: "System Settings",
            },
            settings: {
                theme: "Theme Mode",
                language: "System Language",
                unknown: "Unknown Setting",
            }
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
            users: "用户管理",
            tokens: "Token管理",
            table: {
                id: "ID",
                username: "用户名",
                role: "角色",
                createdAt: "创建时间",
                expiresAt: "过期时间",
                noUsers: "未找到用户",
                loading: "加载中...",
            },
            pagination: {
                previous: "上一页",
                next: "下一页",
                page: "第",
                of: "页，共",
                pages: "页",
            }
        },
        storage: {
            title: "存储管理",
            subtitle: "管理您的本地聊天会话和数据",
            sessionTitle: "会话标题",
            messages: "消息数",
            lastUpdated: "最后更新",
            actions: "操作",
            deleteSelected: "删除选中",
            clearAll: "清空所有",
            confirmClear: "您确定要清空所有会话吗？此操作无法撤销。",
            confirmDelete: "您确定要删除选中的会话吗？",
            noData: "本地存储中未发现数据。",
            stats: "存储统计",
            totalSessions: "总会话数",
            totalMessages: "总消息数",
            estimatedSize: "预估占用",
            close: "关闭",
            delete: "删除",
            tabs: {
                sessions: "聊天会话",
                settings: "系统设置",
            },
            settings: {
                theme: "主题模式",
                language: "系统语言",
                unknown: "未知设置",
            }
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
        const loadLang = async () => {
            const savedLang = await getSetting("webgpt_language") as Language;
            if (savedLang && (savedLang === "en" || savedLang === "cn")) {
                setLanguage(savedLang);
            }
        };
        loadLang();
    }, []);

    const handleSetLanguage = async (lang: Language) => {
        setLanguage(lang);
        await setSetting("webgpt_language", lang);
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
