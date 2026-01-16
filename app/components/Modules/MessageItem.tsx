import { memo } from "react";
import { Message } from "./types";
import MessageContent from "./MessageContent";
import { MODELS } from "../ModelSelector";

interface MessageItemProps {
    msg: Message;
    user: any;
    selectedModel: string;
    theme: string;
    t: (key: string) => string;
}

const MessageItem = memo(({ msg, user, selectedModel, theme, t }: MessageItemProps) => {
    return (
        <div
            className={`flex items-start space-x-2 sm:space-x-3 ${msg.role === "user" ? "flex-row-reverse space-x-reverse" : "flex-row"}`}
        >
            {/* Avatar */}
            <div className="flex-shrink-0 mt-1 min-w-[28px] sm:min-w-[32px]">
                {msg.role === "user" ? (
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-[10px] sm:text-xs font-bold text-white shadow-sm">
                        {user?.username?.slice(0, 2).toUpperCase() || "U"}
                    </div>
                ) : (
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[var(--hover-bg)] border border-[var(--glass-border)] flex items-center justify-center text-[10px] sm:text-xs font-bold text-[var(--accent-primary)] shadow-sm">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>
                )}
            </div>

            {/* Message Bubble */}
            <div className="flex flex-col max-w-[90%] sm:max-w-[85%] md:max-w-[80%]">
                <div className={`flex items-center mb-1 space-x-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <span className="text-[9px] sm:text-[10px] md:text-xs font-medium text-[var(--text-muted)]">
                        {msg.role === "user" ? user?.username : (MODELS.find(m => m.id === selectedModel)?.name || selectedModel)}
                    </span>
                </div>
                <div
                    className={`rounded-lg sm:rounded-2xl px-2.5 sm:px-4 py-2 sm:py-2.5 shadow-sm ${msg.role === "user"
                        ? "bg-[var(--chat-bubble-user)] text-white"
                        : "bg-[var(--chat-bubble-ai)] border border-[var(--glass-border)]"
                        }`}
                >
                    <div className={`prose prose-sm max-w-none leading-relaxed ${msg.role === "user"
                        ? "prose-invert text-white"
                        : "text-[var(--chat-bubble-ai-text)] prose-zinc dark:prose-invert"
                        }`}>
                        <MessageContent content={msg.content} theme={theme} t={t} />
                    </div>
                </div>
            </div>
        </div>
    );
});

MessageItem.displayName = "MessageItem";

export default MessageItem;
