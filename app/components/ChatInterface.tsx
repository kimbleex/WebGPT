"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MODELS } from "./ModelSelector";
import { useLanguage } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import MessageList from "./Modules/MessageList";
import InputArea from "./Modules/InputArea";
import StatusBar from "./Modules/StatusBar";
import { Message, SearchStatus } from "./Modules/types";
import { useChatExport } from "./Modules/hooks/useChatExport";
import { useMemoryMonitor } from "./Modules/hooks/useMemoryMonitor";
import { useFileHandler, fileToBase64 } from "./Modules/hooks/useFileHandler";
import StorageManager from "./Modules/StorageManager";

export type { Message } from "./Modules/types";

interface ChatInterfaceProps {
    accessPassword: string | null;
    initialMessages?: Message[];
    onMessagesChange?: (messages: Message[]) => void;
    onSessionsChange?: (sessions: any[]) => void;
    user: any;
}

/**
 * ChatInterface Component
 * 
 * 功能 (What):
 * 主聊天界面组件，协调消息列表、输入区域、状态栏以及各种聊天逻辑。
 * Main chat interface component, coordinating message list, input area, status bar, and various chat logics.
 * 
 * 生效范围 (Where):
 * 应用程序的核心聊天页面。
 * The core chat page of the application.
 * 
 * 使用方法 (How):
 * <ChatInterface accessPassword={...} user={...} />
 */
export default function ChatInterface({ accessPassword, initialMessages = [], onMessagesChange, onSessionsChange, user }: ChatInterfaceProps) {
    const { t } = useLanguage();
    const { theme } = useTheme();

    // 配置 (Config)
    // -------------------------------------------------------------------------
    const MAX_MESSAGES = 20; // 限制消息数量，防止无限增长 (Limit message count to prevent infinite growth)
    const MESSAGE_BATCH_SIZE = 5; // 分页加载的批次大小 (Batch size for pagination loading)

    // 状态 (State)
    // -------------------------------------------------------------------------
    const [messages, setMessages] = useState<Message[]>(initialMessages.slice(-MAX_MESSAGES));
    const [visibleMessages, setVisibleMessages] = useState<Message[]>([]);
    const [currentBatch, setCurrentBatch] = useState(0);
    const [hasMoreMessages, setHasMoreMessages] = useState(false);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [selectedModel, setSelectedModel] = useState(MODELS[0].id);
    const [showActionMenu, setShowActionMenu] = useState(false);
    const [showModelMenu, setShowModelMenu] = useState(false);
    const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
    const [isComposing, setIsComposing] = useState(false);
    const [sysPrompt, setSysPrompt] = useState("");
    const [cleanupFeedback, setCleanupFeedback] = useState<{ message: string; type: 'success' | 'info' } | null>(null);
    const [showStorageManager, setShowStorageManager] = useState(false);
    const [activeSearchStatus, setActiveSearchStatus] = useState<SearchStatus | null>(null);

    // 引用 (Refs)
    // -------------------------------------------------------------------------
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const chatContainerRef = useRef<HTMLDivElement | null>(null);
    const actionMenuRef = useRef<HTMLDivElement | null>(null);
    const modelMenuRef = useRef<HTMLDivElement | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const observerRef = useRef<IntersectionObserver | null>(null);
    const loadMoreRef = useRef<HTMLDivElement | null>(null);

    // 自定义 Hooks (Custom Hooks)
    // -------------------------------------------------------------------------

    // 文件处理 Hook
    const {
        files,
        setFiles,
        imageUrlMap,
        handleFileChange,
        removeFile,
        clearFiles
    } = useFileHandler();

    // 聊天导出 Hook
    const {
        isExporting,
        exportFeedback,
        handleExportImage
    } = useChatExport(chatContainerRef, messages);

    // 内存监控 Hook
    const memoryUsage = useMemoryMonitor({
        onHighMemory: () => {
            // 内存过高时清理文件缓存
            clearFiles();
        }
    });

    // 副作用 (Effects)
    // -------------------------------------------------------------------------

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // 初始化可见消息 (Initialize visible messages)
    useEffect(() => {
        const totalMessages = messages.length;
        const startIndex = Math.max(0, totalMessages - MESSAGE_BATCH_SIZE);
        const initialVisible = messages.slice(startIndex);
        setVisibleMessages(initialVisible);
        setCurrentBatch(1);
        setHasMoreMessages(totalMessages > MESSAGE_BATCH_SIZE);

        // 延迟滚动到底部，确保DOM已更新
        setTimeout(() => scrollToBottom(), 100);
    }, [messages]);

    // 懒加载更多消息 (Lazy load more messages)
    useEffect(() => {
        if (!loadMoreRef.current) return;

        // 清理之前的观察器
        if (observerRef.current) {
            observerRef.current.disconnect();
        }

        observerRef.current = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMoreMessages) {
                    loadMoreMessages();
                }
            },
            { threshold: 0.1 }
        );

        observerRef.current.observe(loadMoreRef.current);

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [hasMoreMessages, messages]);

    const loadMoreMessages = () => {
        const totalMessages = messages.length;
        const nextBatch = currentBatch + 1;
        const startIndex = Math.max(0, totalMessages - (nextBatch * MESSAGE_BATCH_SIZE));
        const endIndex = totalMessages - (currentBatch * MESSAGE_BATCH_SIZE);

        if (startIndex <= 0) {
            setVisibleMessages(messages);
            setHasMoreMessages(false);
        } else {
            const newVisible = messages.slice(startIndex, endIndex);
            setVisibleMessages(prev => [...newVisible, ...prev]);
            setCurrentBatch(nextBatch);
            setHasMoreMessages(startIndex > 0);
        }
    };

    // 自动调整文本框高度 (Auto-expand textarea)
    useEffect(() => {
        if (!textareaRef.current) return;

        const textarea = textareaRef.current;
        const updateHeight = () => {
            if (textarea) {
                textarea.style.height = "auto";
                textarea.style.height = `${textarea.scrollHeight}px`;
            }
        };

        const rafId = requestAnimationFrame(updateHeight);
        return () => cancelAnimationFrame(rafId);
    }, [input]);

    // 事件处理 (Handlers)
    // -------------------------------------------------------------------------

    // 清理会话历史，释放内存 (Clear chat history to free up memory)
    const clearChatHistory = () => {
        const beforeMemory = memoryUsage?.used || 0;

        // 清理文件和图片URL
        const fileCount = files.length;
        const imageCount = imageUrlMap.size;
        clearFiles();

        // 清理消息
        const messageCount = messages.length;
        setMessages([]);
        setVisibleMessages([]);
        setCurrentBatch(0);
        setHasMoreMessages(false);

        // 通知父组件
        onMessagesChange?.([]);

        // 显示清理反馈
        let feedbackMessage = t("chat.cleanupSuccess");

        // 如果翻译键不存在，使用默认消息
        if (feedbackMessage === "chat.cleanupSuccess") {
            feedbackMessage = `清理成功！释放了 ${messageCount} 条消息，${fileCount} 个文件，${imageCount} 张图片`;
        } else {
            // 替换占位符
            feedbackMessage = feedbackMessage
                .replace(/{messageCount}/g, messageCount.toString())
                .replace(/{fileCount}/g, fileCount.toString())
                .replace(/{imageCount}/g, imageCount.toString());
        }

        setCleanupFeedback({
            message: feedbackMessage,
            type: 'success'
        });

        // 3秒后自动隐藏反馈
        setTimeout(() => {
            setCleanupFeedback(null);
        }, 3000);
    };

    // 自动隐藏反馈消息 (Auto-hide feedback message)
    useEffect(() => {
        if (cleanupFeedback) {
            const timer = setTimeout(() => {
                setCleanupFeedback(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [cleanupFeedback]);

    // 处理粘贴事件 - 支持粘贴图片 (Handle paste event - support pasting images)
    const handlePaste = useCallback((e: React.ClipboardEvent<HTMLTextAreaElement>) => {
        const items = e.clipboardData?.items;
        if (!items) return;

        const imageFiles: File[] = [];
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.type.startsWith('image/')) {
                const file = item.getAsFile();
                if (file) {
                    imageFiles.push(file);
                }
            }
        }

        if (imageFiles.length > 0) {
            e.preventDefault(); // 阻止默认粘贴行为
            setFiles((prev) => [...prev, ...imageFiles]);
        }
    }, [setFiles]);

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();

        // 防止重复提交
        if ((!input.trim() && files.length === 0) || isLoading) return;

        // 立即设置加载状态，防止重复点击
        setIsLoading(true);
        setActiveSearchStatus(null);

        // 保存当前输入和文件信息
        const currentInput = input;
        const currentFiles = [...files];

        // 立即清空输入框，防止重复提交
        setInput("");
        setFiles([]);

        // Reset textarea height
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
        }

        // 提升变量到函数作用域，使其在catch块中可用
        let trimmedMessages: Message[] = [];

        try {
            let userContent: any = currentInput;

            if (currentFiles.length > 0) {
                const contentArray: any[] = [];
                if (currentInput.trim()) {
                    contentArray.push({ type: "text", text: currentInput });
                }

                for (const file of currentFiles) {
                    const base64 = await fileToBase64(file);
                    if (file.type.startsWith("image/")) {
                        contentArray.push({
                            type: "image_url",
                            image_url: { url: base64 }
                        });
                    }
                }
                userContent = contentArray;
            }

            const userMessage: Message = { role: "user", content: userContent, timestamp: Date.now() };

            // 优化：限制消息数量，防止内存无限增长
            const newMessages = [...messages, userMessage];
            trimmedMessages = newMessages.length > MAX_MESSAGES
                ? newMessages.slice(-MAX_MESSAGES)
                : newMessages;

            setMessages(trimmedMessages);
            onMessagesChange?.(trimmedMessages);

            const res = await fetch("/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-access-password": accessPassword || "",
                },
                body: JSON.stringify({
                    messages: (() => {
                        let apiMessages = trimmedMessages.map((m, idx) => {
                            if (idx === trimmedMessages.length - 1) return m;
                            if (Array.isArray(m.content)) {
                                return {
                                    ...m,
                                    content: m.content.map((item: any) => {
                                        if (item.type === "image_url") {
                                            return { type: "text", text: "[Image]" };
                                        }
                                        return item;
                                    })
                                };
                            }
                            return m;
                        });
                        if (sysPrompt) {
                            apiMessages = [{ role: "system", content: sysPrompt }, ...apiMessages];
                        }
                        return apiMessages;
                    })(),
                    model: selectedModel,
                }),
            });

            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(errorText || res.statusText);
            }

            if (!res.body) throw new Error("No response body");

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let assistantMessage = "";
            let lastUpdateTime = Date.now();
            const assistantTimestamp = Date.now();

            // 添加助手消息到临时变量，避免频繁更新状态
            const tempMessages = [...trimmedMessages, { role: "assistant" as const, content: "", timestamp: assistantTimestamp, model: selectedModel }];
            setMessages(tempMessages);

            let streamBuffer = "";
            let latestSearchStatus: SearchStatus | null = null;
            const isStructuredStream = res.headers.get("Content-Type")?.includes("application/x-ndjson");

            const updateAssistantMessage = () => {
                setMessages(prev => {
                    const updated = [...prev];
                    updated[updated.length - 1] = {
                        role: "assistant",
                        content: assistantMessage,
                        timestamp: assistantTimestamp,
                        model: selectedModel,
                        searchStatus: latestSearchStatus || undefined,
                    };
                    return updated;
                });
            };

            const appendAssistantText = (text: string) => {
                if (
                    latestSearchStatus?.phase === "checking" &&
                    !latestSearchStatus.sources?.length &&
                    !latestSearchStatus.queries?.length
                ) {
                    latestSearchStatus = null;
                    setActiveSearchStatus(null);
                }
                assistantMessage += text;
                const now = Date.now();
                if (now - lastUpdateTime > 100) {
                    updateAssistantMessage();
                    lastUpdateTime = now;
                }
            };

            const mergeSearchStatus = (incoming: SearchStatus) => {
                const existingSources = latestSearchStatus?.sources || [];
                const incomingSources = incoming.sources || [];
                const sourceMap = new Map(existingSources.map(source => [source.url, source]));
                for (const source of incomingSources) {
                    sourceMap.set(source.url, source);
                }

                const existingQueries = latestSearchStatus?.queries || [];
                const incomingQueries = incoming.queries || [];
                latestSearchStatus = {
                    ...latestSearchStatus,
                    ...incoming,
                    queries: Array.from(new Set([...existingQueries, ...incomingQueries])).slice(0, 6),
                    sources: Array.from(sourceMap.values()).slice(0, 8),
                };
                setActiveSearchStatus(latestSearchStatus);
                updateAssistantMessage();
            };

            const handleStreamEvent = (line: string) => {
                if (!line.trim()) return;

                const event = JSON.parse(line);
                if (event.type === "text") {
                    appendAssistantText(event.content || "");
                    return;
                }

                if (event.type === "search_status") {
                    mergeSearchStatus({
                        phase: event.phase || "searching",
                        message: event.message || "模型正在联网搜索...",
                        queries: event.queries || [],
                        sources: event.sources || [],
                    });
                }
            };

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true });

                if (!isStructuredStream) {
                    appendAssistantText(chunk);
                    continue;
                }

                streamBuffer += chunk;
                const lines = streamBuffer.split("\n");
                streamBuffer = lines.pop() || "";

                for (const line of lines) {
                    try {
                        handleStreamEvent(line);
                    } catch {
                        appendAssistantText(line);
                    }
                }
                continue;

                // 纯文本流，直接追加
                assistantMessage += chunk;

                // 优化：减少状态更新频率，每100ms更新一次
                const now = Date.now();
                if (now - lastUpdateTime > 100) {
                    setMessages(prev => {
                        const updated = [...prev];
                        updated[updated.length - 1] = { role: "assistant", content: assistantMessage, timestamp: assistantTimestamp, model: selectedModel };
                        return updated;
                    });
                    lastUpdateTime = now;
                }
            }

            // 最终更新一次完整消息
            const finalMessages = [...trimmedMessages, { role: "assistant" as const, content: assistantMessage, model: selectedModel }];
            if (isStructuredStream && streamBuffer.trim()) {
                try {
                    handleStreamEvent(streamBuffer);
                } catch {
                    appendAssistantText(streamBuffer);
                }
            }
            updateAssistantMessage();

            const finalTrimmedMessages = (finalMessages.length > MAX_MESSAGES
                ? finalMessages.slice(-MAX_MESSAGES)
                : finalMessages
            ).map((message, index, allMessages) => (
                index === allMessages.length - 1 && message.role === "assistant"
                    ? { ...message, searchStatus: latestSearchStatus || undefined }
                    : message
            ));

            setMessages(finalTrimmedMessages);
            onMessagesChange?.(finalTrimmedMessages);

        } catch (error: any) {
            const errorMsg = `Error: ${error.message || "Something went wrong."}`;

            // 优化：限制错误消息的数量
            const errorMessages = [...trimmedMessages, { role: "assistant" as const, content: errorMsg }];
            const finalErrorMessages = errorMessages.length > MAX_MESSAGES
                ? errorMessages.slice(-MAX_MESSAGES)
                : errorMessages;

            setMessages(finalErrorMessages);
            onMessagesChange?.(finalErrorMessages);
        } finally {
            setIsLoading(false);
            setActiveSearchStatus(null);
        }
    };

    // Close action menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (actionMenuRef.current && !actionMenuRef.current.contains(event.target as Node)) {
                setShowActionMenu(false);
            }
            if (modelMenuRef.current && !modelMenuRef.current.contains(event.target as Node)) {
                setShowModelMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="flex flex-col h-full w-full overflow-hidden">
            {/* Messages Area - Now using flex-1 to take up all available space */}
            <div
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto relative scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent flex flex-col"
            >
                {/* Header - Still absolute but scoped to the scrollable area or the main container */}
                <div className="sticky top-0 left-0 right-0 z-20 flex justify-center pointer-events-none px-4 pt-4 no-export">
                    {/* ModelSelector removed from here */}
                </div>

                <div className="flex-1 flex flex-col justify-start pt-4 pb-2">
                    <MessageList
                        messages={messages}
                        visibleMessages={visibleMessages}
                        hasMoreMessages={hasMoreMessages}
                        isLoading={isLoading}
                        loadMoreMessages={loadMoreMessages}
                        loadMoreRef={loadMoreRef}
                        messagesEndRef={messagesEndRef}
                        user={user}
                        selectedModel={selectedModel}
                        activeSearchStatus={activeSearchStatus}
                        theme={theme}
                        t={t}
                    />
                </div>
            </div>

            {/* Input Area - Now a regular flex child, naturally staying at the bottom */}
            <div className="flex-shrink-0 p-2 sm:p-2.5 pb-[env(safe-area-inset-bottom)] bg-[var(--background)] border-t border-[var(--glass-border)]/10 no-export">
                <div className="max-w-5xl mx-auto space-y-2">
                    {/* Cleanup Feedback */}
                    {cleanupFeedback && (
                        <div className={`flex items-center justify-center px-3 py-1.5 text-xs font-medium animate-in fade-in slide-in-from-bottom-2 duration-300 ${cleanupFeedback.type === 'success'
                            ? 'bg-green-500/20 text-green-600 border border-green-500/30'
                            : 'bg-blue-500/20 text-blue-600 border border-blue-500/30'
                            }`}>
                            <svg className="w-3 h-3 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                {cleanupFeedback.type === 'success' ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                )}
                            </svg>
                            {cleanupFeedback.message}
                        </div>
                    )}

                    {/* Export Feedback */}
                    {exportFeedback && (
                        <div className={`flex items-center justify-center px-3 py-1.5 text-xs font-medium animate-in fade-in slide-in-from-bottom-2 duration-300 ${exportFeedback.type === 'success'
                            ? 'bg-green-500/20 text-green-600 border border-green-500/30'
                            : 'bg-blue-500/20 text-blue-600 border border-blue-500/30'
                            }`}>
                            <svg className="w-3 h-3 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {exportFeedback.message}
                        </div>
                    )}

                    {/* Status Bar */}
                    <StatusBar
                        selectedModel={selectedModel}
                        setSelectedModel={setSelectedModel}
                        showModelMenu={showModelMenu}
                        setShowModelMenu={setShowModelMenu}
                        setShowActionMenu={setShowActionMenu}
                        sysPrompt={sysPrompt}
                        setSysPrompt={setSysPrompt}
                        memoryUsage={memoryUsage}
                        clearChatHistory={clearChatHistory}
                        onOpenStorage={() => setShowStorageManager(true)}
                        modelMenuRef={modelMenuRef}
                        t={t}
                    />

                    {/* Unified Input Container */}
                    <InputArea
                        input={input}
                        setInput={setInput}
                        isLoading={isLoading}
                        isComposing={isComposing}
                        setIsComposing={setIsComposing}
                        handleSubmit={handleSubmit}
                        handleFileChange={handleFileChange}
                        handlePaste={handlePaste}
                        removeFile={removeFile}
                        files={files}
                        imageUrlMap={imageUrlMap}
                        fileInputRef={fileInputRef}
                        textareaRef={textareaRef}
                        actionMenuRef={actionMenuRef}
                        showActionMenu={showActionMenu}
                        setShowActionMenu={setShowActionMenu}
                        setActiveSubmenu={setActiveSubmenu}
                        isExporting={isExporting}
                        handleExportImage={handleExportImage}
                        t={t}
                    />
                </div>
                <div className="text-center mt-2">
                    <p className="text-[10px] text-[var(--text-muted)] font-mono">
                        {t("chat.disclaimer")}
                    </p>
                </div>
            </div>

            {/* Storage Manager Modal */}
            <StorageManager
                isOpen={showStorageManager}
                onClose={() => setShowStorageManager(false)}
                onSessionsChange={onSessionsChange}
                t={t}
            />
        </div>
    );
}
