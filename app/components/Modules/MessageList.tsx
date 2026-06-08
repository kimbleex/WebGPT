import { memo } from "react";
import { Message, SearchStatus } from "./types";
import MessageItem from "./MessageItem";

interface MessageListProps {
    messages: Message[];
    visibleMessages: Message[];
    hasMoreMessages: boolean;
    isLoading: boolean;
    loadMoreMessages: () => void;
    loadMoreRef: React.RefObject<HTMLDivElement | null>;
    messagesEndRef: React.RefObject<HTMLDivElement | null>;
    user: any;
    selectedModel: string;
    activeSearchStatus?: SearchStatus | null;
    theme: string;
    t: (key: string) => string;
}

const MessageList = memo(({
    messages,
    visibleMessages,
    hasMoreMessages,
    isLoading,
    loadMoreMessages,
    loadMoreRef,
    messagesEndRef,
    user,
    selectedModel,
    activeSearchStatus,
    theme,
    t
}: MessageListProps) => {
    return (
        <div className="w-full max-w-6xl mx-auto px-3 sm:px-6 md:px-10 space-y-3">
            {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-[var(--text-muted)] space-y-6 px-4 text-center py-20">
                    <div className="relative">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--accent-primary)]/20 to-[var(--accent-secondary)]/20 flex items-center justify-center border border-[var(--border-color)] backdrop-blur-sm">
                            <svg className="w-10 h-10 text-[var(--accent-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                        </div>
                        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[var(--accent-primary)] animate-pulse"></div>
                    </div>
                    <div>
                        <p className="text-lg font-semibold text-[var(--foreground)] mb-2">{t("chat.startChat")}</p>
                        <p className="text-sm text-[var(--text-muted)]">Ask me anything to get started</p>
                    </div>
                </div>
            ) : (
                <>
                    {/* 懒加载更多消息的触发点 */}
                    {hasMoreMessages && (
                        <div ref={loadMoreRef} className="flex justify-center py-3 sm:py-4">
                            <button
                                onClick={loadMoreMessages}
                                className="px-4 py-2 sm:py-2.5 text-xs sm:text-sm bg-[var(--panel-bg)] border border-[var(--glass-border)] rounded-lg hover:bg-[var(--hover-bg)] hover:border-[var(--accent-primary)]/40 transition-all active:scale-95 touch-manipulation"
                            >
                                {t("chat.loadMore") || "Load More Messages"}
                            </button>
                        </div>
                    )}

                    {/* 渲染可见消息 */}
                    {visibleMessages.map((msg, idx) => {
                        const isLastMessage = idx === visibleMessages.length - 1;
                        const isStreaming = isLoading && isLastMessage && msg.role === "assistant";
                        const searchStatus = msg.role === "assistant"
                            ? (msg.searchStatus || (isLastMessage ? activeSearchStatus : null))
                            : null;
                        return (
                            <MessageItem
                                key={idx}
                                msg={msg}
                                user={user}
                                selectedModel={selectedModel}
                                theme={theme}
                                t={t}
                                isStreaming={isStreaming}
                                searchStatus={searchStatus}
                            />
                        );
                    })}
                </>
            )}
            {isLoading && messages[messages.length - 1]?.role === "user" && (
                <div className="flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center shadow-lg">
                        <svg className="w-5 h-5 text-[var(--background)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <div className="bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-2xl px-4 py-3 backdrop-blur-sm">
                        <div className="flex items-center space-x-2">
                            <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-[var(--accent-primary)] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                <div className="w-2 h-2 bg-[var(--accent-primary)] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                <div className="w-2 h-2 bg-[var(--accent-primary)] rounded-full animate-bounce"></div>
                            </div>
                            <span className="text-sm font-medium text-[var(--text-muted)]">{t("chat.thinking") || "Thinking..."}</span>
                        </div>
                    </div>
                </div>
            )}
            {/* Anchor for scroll */}
            <div ref={messagesEndRef} />
        </div>
    );
});

MessageList.displayName = "MessageList";

export default MessageList;
