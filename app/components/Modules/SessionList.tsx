interface Session {
    id: string;
    title: string;
    updatedAt: number;
}

interface SessionListProps {
    sessions: Session[];
    activeSessionId: string | null;
    onSelectSession: (id: string) => void;
    onDeleteSession: (id: string) => void;
    t: (key: string) => string;
}

/**
 * SessionList Component
 * 
 * 功能 (What):
 * 显示聊天会话列表，支持选择和删除会话。
 * Displays the list of chat sessions, supporting selection and deletion.
 * 
 * 生效范围 (Where):
 * Sidebar 组件的中间部分。
 * The middle part of the Sidebar component.
 * 
 * 使用方法 (How):
 * <SessionList sessions={...} activeSessionId={...} ... />
 */
export default function SessionList({
    sessions,
    activeSessionId,
    onSelectSession,
    onDeleteSession,
    t
}: SessionListProps) {
    return (
        <div className="flex-1 overflow-y-auto space-y-1 p-2 scrollbar-thin">
            {sessions.length === 0 ? (
                <div className="text-center text-[var(--text-muted)] mt-10 text-sm">
                    {t("sidebar.noSessions")}
                </div>
            ) : (
                sessions.map((session) => (
                    <div
                        key={session.id}
                        className="group relative"
                    >
                        <button
                            onClick={() => onSelectSession(session.id)}
                            className={`w-full text-left px-3 py-2.5 pr-8 text-xs font-mono transition-all truncate border flex items-center gap-2 ${
                                activeSessionId === session.id
                                    ? "bg-[var(--hover-bg)] text-[var(--accent-primary)] border-[var(--accent-primary)] shadow-[0_0_10px_rgba(0,255,159,0.2)]"
                                    : "text-[var(--text-muted)] hover:bg-[var(--hover-bg)] hover:text-[var(--foreground)] border-transparent hover:border-[var(--border-color)]"
                            }`}
                        >
                            <span className={activeSessionId === session.id ? "text-[var(--accent-primary)]" : "text-[var(--text-muted)]"}>&gt;</span>
                            <span className="truncate flex-1">{session.title || t("sidebar.newConversation")}</span>
                        </button>

                        {/* Active indicator yields the action slot to the delete button on hover/focus. */}
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                            {activeSessionId === session.id && (
                                <span className="w-1.5 h-1.5 bg-[var(--accent-primary)] rounded-full animate-pulse block group-hover:hidden group-focus-within:hidden"></span>
                            )}
                        </div>

                        {/* Delete Button */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDeleteSession(session.id);
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[var(--text-muted)] hover:text-[var(--error-color)] hover:bg-[var(--hover-bg)] border border-transparent hover:border-[var(--error-color)] transition-all opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto"
                            title="Delete chat"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                ))
            )}
        </div>
    );
}
