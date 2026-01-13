"use client";

import { useState, useRef, useEffect } from "react";
import { MODELS } from "./ModelSelector";
import ModelSelector from "./ModelSelector";
import { useLanguage } from "@/lib/i18n";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toPng } from "html-to-image";

export interface Message {
    role: "user" | "assistant";
    content: any; // Can be string or array for multimodal
}

interface ChatInterfaceProps {
    accessPassword: string | null;
    initialMessages?: Message[];
    onMessagesChange?: (messages: Message[]) => void;
}

export default function ChatInterface({ accessPassword, initialMessages = [], onMessagesChange }: ChatInterfaceProps) {
    const { t } = useLanguage();
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [selectedModel, setSelectedModel] = useState(MODELS[0].id);
    const [files, setFiles] = useState<File[]>([]);
    const [isExporting, setIsExporting] = useState(false);
    const [showExportMenu, setShowExportMenu] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const exportMenuRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            setFiles((prev) => [...prev, ...newFiles]);
        }
    };

    const removeFile = (index: number) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (error) => reject(error);
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!input.trim() && files.length === 0) || isLoading) return;

        setIsLoading(true);
        const currentInput = input;
        const currentFiles = [...files];
        setInput("");
        setFiles([]);

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

            const userMessage: Message = { role: "user", content: userContent };
            const newMessages = [...messages, userMessage];

            setMessages(newMessages);
            onMessagesChange?.(newMessages);

            const res = await fetch("/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-access-password": accessPassword || "",
                },
                body: JSON.stringify({
                    messages: newMessages.map((m, idx) => {
                        // Only send Base64 for the current message (the last one)
                        if (idx === newMessages.length - 1) return m;

                        // For previous messages, if content is an array, strip image data
                        if (Array.isArray(m.content)) {
                            return {
                                ...m,
                                content: m.content.map(item => {
                                    if (item.type === "image_url") {
                                        return { type: "text", text: "[Image]" };
                                    }
                                    return item;
                                })
                            };
                        }
                        return m;
                    }),
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

            setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true });
                assistantMessage += chunk;

                setMessages((prev) => {
                    const updated = [...prev];
                    updated[updated.length - 1] = { role: "assistant", content: assistantMessage };
                    return updated;
                });
            }

            onMessagesChange?.([...newMessages, { role: "assistant", content: assistantMessage }]);

        } catch (error: any) {
            console.error("Chat error:", error);
            const errorMsg = `Error: ${error.message || "Something went wrong."}`;
            setMessages((prev) => [...prev, { role: "assistant", content: errorMsg }]);
            onMessagesChange?.([...messages, { role: "assistant", content: errorMsg }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleExportImage = async () => {
        if (!chatContainerRef.current || messages.length === 0) return;

        setIsExporting(true);
        setShowExportMenu(false);

        try {
            const node = chatContainerRef.current;

            // Store original styles
            const originalHeight = node.style.height;
            const originalOverflow = node.style.overflow;

            // Temporarily set height to auto and overflow to visible to capture full content
            node.style.height = 'auto';
            node.style.overflow = 'visible';

            // Wait a bit for layout to settle
            await new Promise(resolve => setTimeout(resolve, 100));

            const dataUrl = await toPng(node, {
                backgroundColor: 'var(--background)',
                style: {
                    height: 'auto',
                    overflow: 'visible',
                    padding: '40px',
                    borderRadius: '0'
                },
                filter: (node) => {
                    if (node instanceof HTMLElement) {
                        if (node.classList.contains('no-export')) return false;
                        // Filter out the bottom spacer and messagesEndRef if needed
                        if (node.classList.contains('h-12') || node.classList.contains('sm:h-16')) return false;
                    }
                    return true;
                }
            });

            // Restore original styles
            node.style.height = originalHeight;
            node.style.overflow = originalOverflow;

            const link = document.createElement('a');
            link.download = `chat-export-${Date.now()}.png`;
            link.href = dataUrl;
            link.click();
        } catch (error) {
            console.error('Export failed:', error);
        } finally {
            setIsExporting(false);
        }
    };

    // Close export menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
                setShowExportMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const renderMessageContent = (content: any) => {
        if (typeof content === "string") {
            return (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {content}
                </ReactMarkdown>
            );
        }

        if (Array.isArray(content)) {
            return content.map((item, i) => {
                if (item.type === "text") {
                    return (
                        <ReactMarkdown key={i} remarkPlugins={[remarkGfm]}>
                            {item.text}
                        </ReactMarkdown>
                    );
                }
                if (item.type === "image_url") {
                    return (
                        <img
                            key={i}
                            src={item.image_url.url}
                            alt="Uploaded content"
                            className="max-w-full rounded-lg my-2 border border-[var(--glass-border)]"
                        />
                    );
                }
                return null;
            });
        }

        return null;
    };

    return (
        <div className="flex flex-col h-full w-full max-w-6xl mx-auto relative px-2 sm:px-6">
            {/* Header - Cleaned up */}
            <div className="absolute top-4 left-0 right-0 z-10 flex justify-center pointer-events-none px-4 no-export">
                {/* ModelSelector removed from here */}
            </div>

            {/* Messages Area */}
            <div
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto p-2 sm:p-4 pt-20 pb-40 sm:pb-48 space-y-4 sm:space-y-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
            >
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-[var(--text-muted)] space-y-4 px-4 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-[var(--hover-bg)] flex items-center justify-center">
                            <svg className="w-8 h-8 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                        </div>
                        <p className="text-lg font-medium">{t("chat.startChat")}</p>
                    </div>
                ) : (
                    messages.map((msg, idx) => (
                        <div
                            key={idx}
                            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                            <div
                                className={`max-w-[92%] sm:max-w-[85%] rounded-2xl px-3 sm:px-4 py-2 sm:py-2.5 shadow-sm ${msg.role === "user"
                                    ? "bg-[var(--chat-bubble-user)] text-white"
                                    : "bg-[var(--chat-bubble-ai)] border border-[var(--glass-border)] text-[var(--foreground)]"
                                    }`}
                            >
                                <div className={`prose prose-sm max-w-none leading-relaxed text-[var(--foreground)] ${msg.role === "user" ? "prose-invert" : "prose-zinc dark:prose-invert"}`}>
                                    {renderMessageContent(msg.content)}
                                </div>
                            </div>
                        </div>
                    ))
                )}
                {isLoading && messages[messages.length - 1]?.role === "user" && (
                    <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2">
                        <div className="bg-[var(--chat-bubble-ai)] border border-[var(--glass-border)] rounded-2xl px-3 sm:px-4 py-2 sm:py-2.5 shadow-sm">
                            <div className="flex items-center space-x-2 text-[var(--text-muted)]">
                                <div className="flex space-x-1">
                                    <div className="w-1.5 h-1.5 bg-[var(--accent-primary)] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                    <div className="w-1.5 h-1.5 bg-[var(--accent-primary)] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                    <div className="w-1.5 h-1.5 bg-[var(--accent-primary)] rounded-full animate-bounce"></div>
                                </div>
                                <span className="text-sm font-medium italic">{t("chat.thinking") || "Thinking..."}</span>
                            </div>
                        </div>
                    </div>
                )}
                {/* Bottom Spacer to ensure last message is above the input area */}
                <div className="h-12 sm:h-16" />
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-4 lg:p-6 bg-gradient-to-t from-[var(--background)] via-[var(--background)] to-transparent no-export">
                <div className="max-w-4xl mx-auto">
                    {/* Unified Input Container with Menu Bar */}
                    <div className="bg-[var(--panel-bg)]/80 backdrop-blur-xl border border-[var(--glass-border)] rounded-[1.5rem] sm:rounded-[2rem] shadow-2xl overflow-visible animate-in fade-in slide-in-from-bottom-4">
                        {/* Menu Bar Section */}
                        <div className="flex flex-wrap items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 border-b border-[var(--glass-border)]/30 bg-[var(--foreground)]/[0.03]">
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 flex-1 min-w-0">
                                <div className="flex-shrink-0">
                                    <ModelSelector selectedModel={selectedModel} onModelChange={setSelectedModel} />
                                </div>

                                <div className="h-4 w-[1px] bg-[var(--glass-border)]/50 hidden sm:block" />

                                <div className="relative" ref={exportMenuRef}>
                                    <button
                                        type="button"
                                        onClick={() => setShowExportMenu(!showExportMenu)}
                                        className="flex items-center space-x-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-[var(--hover-bg)] border border-[var(--glass-border)] hover:border-[var(--accent-primary)]/30 hover:bg-[var(--hover-bg)]/80 transition-all text-xs sm:text-sm font-medium text-[var(--foreground)] shadow-sm"
                                        title={t("chat.export")}
                                    >
                                        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                        <span className="truncate max-w-[100px] sm:max-w-none">{t("chat.export")}</span>
                                        <svg
                                            className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform ${showExportMenu ? "rotate-0" : "rotate-180"}`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>

                                    {showExportMenu && (
                                        <>
                                            <div
                                                className="fixed inset-0 z-[100]"
                                                onClick={() => setShowExportMenu(false)}
                                            />
                                            <div className="absolute bottom-full left-0 mb-2 w-56 sm:w-64 py-2 rounded-2xl bg-[var(--panel-bg)] border border-[var(--glass-border)] shadow-2xl z-[101] overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
                                                <div className="px-3 py-2 border-b border-[var(--glass-border)]/30">
                                                    <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">{t("chat.export")}</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleExportImage();
                                                    }}
                                                    disabled={isExporting}
                                                    className={`w-full text-left px-4 py-3 text-sm transition-all flex items-center justify-between group text-[var(--foreground)] hover:bg-[var(--hover-bg)] hover:pl-5 disabled:opacity-50`}
                                                >
                                                    <div className="flex items-center space-x-2">
                                                        <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h14a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                        <span>{isExporting ? t("chat.exporting") : t("chat.saveAsImage")}</span>
                                                    </div>
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div className="sm:hidden">
                                    {files.length > 0 && (
                                        <span className="text-[10px] font-medium text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 px-2 py-0.5 rounded-full">
                                            {files.length} {files.length === 1 ? 'file' : 'files'}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {files.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 sm:gap-2 px-1 sm:px-0">
                                    {files.map((file, idx) => (
                                        <div key={idx} className="flex items-center space-x-1 bg-[var(--hover-bg)] border border-[var(--glass-border)] rounded-lg px-2 py-1 text-[10px] sm:text-xs text-[var(--foreground)]">
                                            <span className="truncate max-w-[80px] sm:max-w-[120px]">{file.name}</span>
                                            <button
                                                onClick={() => removeFile(idx)}
                                                className="text-[var(--text-muted)] hover:text-red-400 transition-colors"
                                            >
                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {files.length === 0 && (
                                <div className="hidden sm:flex items-center text-[10px] text-[var(--text-muted)]/60 italic">
                                    {t("chat.imageOnly")}
                                </div>
                            )}
                        </div>

                        {/* Input Section */}
                        <form onSubmit={handleSubmit} className="relative bg-transparent">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                                multiple
                                accept="image/*"
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--hover-bg)] rounded-xl transition-all"
                                title="Upload images"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h14a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </button>
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder={t("chat.placeholder")}
                                className="w-full bg-transparent border-none pl-12 pr-14 py-4 sm:py-5 text-sm sm:text-base text-[var(--foreground)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-0"
                                disabled={isLoading}
                            />
                            <button
                                type="submit"
                                disabled={(!input.trim() && files.length === 0) || isLoading}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-indigo-600 text-white rounded-xl sm:rounded-2xl hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-500/20"
                            >
                                {isLoading ? (
                                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M12 5l7 7-7 7" />
                                    </svg>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
                <div className="text-center mt-3">
                    <p className="text-xs text-[var(--text-muted)]">
                        {t("chat.disclaimer")}
                    </p>
                </div>
            </div>
        </div>
    );
}
