export interface Message {
    role: "user" | "assistant" | "system";
    content: any;
    timestamp?: number;
    model?: string;  // 保存消息生成时使用的模型ID
    searchStatus?: SearchStatus;
}

export interface SearchSource {
    url: string;
    title?: string;
}

export interface SearchStatus {
    phase: "checking" | "searching" | "completed" | "error";
    message: string;
    queries?: string[];
    sources?: SearchSource[];
}
