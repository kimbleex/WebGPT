import { memo } from "react";
import { Message } from "./types";
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
    theme,
    t
}: MessageListProps) => {
    return (
        <div className="max-w-6xl mx-auto px-3 sm:px-6 md:px-10 space-y-3 sm:space-y-4 md:space-y-6">
            {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-[var(--text-muted)] space-y-3 sm:space-y-4 px-3 sm:px-4 text-center">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-[var(--hover-bg)] flex items-center justify-center">
                        <svg className="w-6 h-6 sm:w-8 sm:h-8 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                    </div>
                    <p className="text-base sm:text-lg font-medium">{t("chat.startChat")}</p>
                </div>
            ) : (
                <>
                    {/* 懒加载更多消息的触发点 */}
                    {hasMoreMessages && (
                        <div ref={loadMoreRef} className="flex justify-center py-3 sm:py-4">
                            <button
                                onClick={loadMoreMessages}
                                className="px-4 py-2 sm:py-2.5 text-xs sm:text-sm bg-[var(--panel-bg)] border border-[var(--glass-border)] rounded-lg hover:bg-[var(--hover-bg)] transition-colors active:scale-95 touch-manipulation"
                            >
                                {t("chat.loadMore") || "Load More Messages"}
                            </button>
                        </div>
                    )}

                    {/* 渲染可见消息 */}
                    {visibleMessages.map((msg, idx) => (
                        <MessageItem
                            key={idx}
                            msg={msg}
                            user={user}
                            selectedModel={selectedModel}
                            theme={theme}
                            t={t}
                        />
                    ))}
                </>
            )}
            {isLoading && messages[messages.length - 1]?.role === "user" && (
                <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2">
                    <div className="bg-[var(--chat-bubble-ai)] border border-[var(--glass-border)] rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2 sm:py-2.5 shadow-sm">
                        <div className="flex items-center space-x-2">
                            <div className="flex space-x-1">
                                <div className="w-1.5 h-1.5 bg-[var(--accent-primary)] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                <div className="w-1.5 h-1.5 bg-[var(--accent-primary)] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                <div className="w-1.5 h-1.5 bg-[var(--accent-primary)] rounded-full animate-bounce"></div>
                            </div>
                            <span className="text-xs sm:text-sm font-medium italic text-[var(--text-muted)]">{t("chat.thinking") || "Thinking..."}</span>
                        </div>
                    </div>
                </div>
            )}
            {/* Bottom Spacer to ensure last message is above the input area */}
            <div className="h-8 sm:h-12 md:h-16" />
            <div ref={messagesEndRef} />
        </div>
    );
});

MessageList.displayName = "MessageList";

export default MessageList;
