import { memo } from "react";
import { Message, SearchStatus } from "./types";
import MessageContent from "./MessageContent";
import { MODELS } from "../ModelSelector";
import ThinkingStep from "./ThinkingStep";

interface MessageItemProps {
    msg: Message;
    user: any;
    selectedModel: string;
    theme: string;
    t: (key: string) => string;
    isStreaming?: boolean;
    searchStatus?: SearchStatus | null;
}

const formatSourceLabel = (url: string, title?: string) => {
    if (title) return title;

    try {
        return new URL(url).hostname.replace(/^www\./, "");
    } catch {
        return url;
    }
};

const MessageItem = memo(({ msg, user, selectedModel, theme, t, isStreaming = false, searchStatus }: MessageItemProps) => {
    const isUser = msg.role === "user";
    const showSearchStatus = !isUser && searchStatus;

    return (
        <div className={`group relative animate-slide-in mb-2 flex ${isUser ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex items-start gap-2 ${isUser ? 'max-w-[85%]' : 'max-w-[90%]'}`}>
                {/* Avatar */}
                {!isUser && (
                    <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center shadow-lg">
                        <svg className="w-4 h-4 text-[var(--background)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                )}

                <div className="flex-1 min-w-0">
                    {/* Header with role and timestamp */}
                    <div className={`flex items-center gap-2 mb-1.5 ${isUser ? 'justify-end' : 'justify-start'}`}>
                        <span className={`text-xs font-semibold ${isUser ? 'text-[var(--terminal-cyan)]' : 'text-[var(--accent-primary)]'}`}>
                            {isUser ? (user?.username || 'You') : (MODELS.find(m => m.id === (msg.model || selectedModel))?.name || 'AI Assistant')}
                        </span>
                        <span className="text-[10px] text-[var(--text-muted)]">
                            {new Date(msg.timestamp || Date.now()).toLocaleString('zh-CN', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false
                            })}
                        </span>
                    </div>

                    {/* Message content */}
                    <div
                        className={`relative rounded-xl px-3 py-2 transition-all ${
                            isUser
                                ? 'bg-gradient-to-br from-[var(--terminal-cyan)]/20 to-[var(--terminal-purple)]/20 border border-[var(--terminal-cyan)]/30 backdrop-blur-sm'
                                : 'bg-[var(--panel-bg)] border border-[var(--border-color)] backdrop-blur-sm hover:border-[var(--accent-primary)]/40'
                        }`}
                    >
                        {/* Search status for Responses API web_search */}
                        {showSearchStatus && (
                            <div className="mb-2 pb-2 border-b border-[var(--border-color)]/50 space-y-2">
                                <ThinkingStep
                                    title={
                                        searchStatus.phase === "completed"
                                            ? "搜索完成"
                                            : searchStatus.phase === "checking"
                                                ? "检查联网"
                                                : "联网搜索"
                                    }
                                    status={searchStatus.phase === "completed" ? "completed" : "running"}
                                    description={searchStatus.message}
                                />
                                {searchStatus.queries && searchStatus.queries.length > 0 && (
                                    <div className="px-3 py-2 border border-[var(--border-color)] bg-[var(--code-bg)]/70">
                                        <p className="text-[10px] font-mono text-[var(--text-muted)] mb-1">搜索关键词</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {searchStatus.queries.slice(0, 3).map((query) => (
                                                <span key={query} className="max-w-full truncate px-2 py-1 text-[10px] font-mono border border-[var(--border-color)] text-[var(--terminal-cyan)] bg-[var(--hover-bg)]/40">
                                                    {query}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {searchStatus.sources && searchStatus.sources.length > 0 && (
                                    <div className="px-3 py-2 border border-[var(--border-color)] bg-[var(--code-bg)]/70">
                                        <p className="text-[10px] font-mono text-[var(--text-muted)] mb-1">已查看来源</p>
                                        <div className="space-y-1">
                                            {searchStatus.sources.slice(0, 4).map((source) => (
                                                <a
                                                    key={source.url}
                                                    href={source.url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="block truncate text-[10px] font-mono text-[var(--terminal-cyan)] hover:text-[var(--accent-primary)]"
                                                    title={source.url}
                                                >
                                                    {formatSourceLabel(source.url, source.title)}
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Thinking steps for AI messages */}
                        {msg.role === "assistant" && isStreaming && !showSearchStatus && (
                            <div className="mb-3 pb-3 border-b border-[var(--border-color)]/50">
                                <ThinkingStep title="Processing..." status="running" description="Analyzing query" />
                            </div>
                        )}

                        <div className={`prose prose-sm max-w-none leading-normal ${isUser ? 'text-[var(--foreground)]' : 'text-[var(--foreground)]'}`}>
                            <MessageContent content={msg.content} theme={theme} t={t} />
                        </div>

                        {/* Streaming cursor */}
                        {msg.role === "assistant" && isStreaming && (
                            <span className="inline-block w-1.5 h-4 bg-[var(--accent-primary)] ml-1 animate-pulse rounded-sm" />
                        )}
                    </div>
                </div>

                {/* User Avatar on the right */}
                {isUser && (
                    <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-gradient-to-br from-[var(--terminal-cyan)] to-[var(--terminal-purple)] flex items-center justify-center shadow-lg">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </div>
                )}
            </div>
        </div>
    );
});

MessageItem.displayName = "MessageItem";

export default MessageItem;
