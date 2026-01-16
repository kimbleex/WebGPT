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
        <div className="flex-1 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            {sessions.length === 0 ? (
                <div className="text-center text-[var(--text-muted)] mt-10 text-sm">
                    {t("sidebar.noHistory")}
                </div>
            ) : (
                sessions.map((session) => (
                    <div
                        key={session.id}
                        className="group relative flex items-center"
                    >
                        <button
                            onClick={() => onSelectSession(session.id)}
                            className={`flex-1 text-left px-4 pr-10 sm:pr-12 py-3 rounded-xl text-sm transition-all truncate ${activeSessionId === session.id
                                ? "bg-[var(--hover-bg)] text-[var(--foreground)] font-medium"
                                : "text-[var(--text-muted)] hover:bg-[var(--hover-bg)] hover:text-[var(--foreground)]"
                                }`}
                        >
                            {session.title || t("sidebar.newConversation")}
                        </button>

                        {/* Delete Button (visible on hover or if active) */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDeleteSession(session.id);
                            }}
                            className={`absolute right-2 sm:right-3 p-1.5 rounded-lg text-[var(--text-muted)] hover:text-red-400 hover:bg-[var(--hover-bg)] transition-all opacity-0 group-hover:opacity-100 ${activeSessionId === session.id ? "opacity-100" : ""
                                }`}
                            title="Delete chat"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                ))
            )}
        </div>
    );
}
