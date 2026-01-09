"use client";

import { useState, useRef, useEffect } from "react";
import { MODELS } from "./ModelSelector";
import ModelSelector from "./ModelSelector";
import { useLanguage } from "@/lib/i18n";

export interface Message {
    role: "user" | "assistant";
    content: string;
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
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: Message = { role: "user", content: input };
        const newMessages = [...messages, userMessage];

        setMessages(newMessages);
        onMessagesChange?.(newMessages);
        setInput("");
        setIsLoading(true);

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-access-password": accessPassword || "",
                },
                body: JSON.stringify({
                    messages: newMessages,
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

            // Final update to parent
            onMessagesChange?.([...newMessages, { role: "assistant", content: assistantMessage }]);

        } catch (error: any) {
            console.error("Chat error:", error);
            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: `Error: ${error.message || "Something went wrong."}` },
            ]);
            onMessagesChange?.([...newMessages, { role: "assistant", content: `Error: ${error.message || "Something went wrong."}` }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full w-full max-w-5xl mx-auto relative">
            {/* Header */}
            <div className="absolute top-4 left-0 right-0 z-10 flex justify-center pointer-events-none">
                <div className="pointer-events-auto">
                    <ModelSelector selectedModel={selectedModel} onModelChange={setSelectedModel} />
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 pt-20 pb-32 space-y-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-4">
                        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
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
                                className={`max-w-[85%] rounded-2xl px-6 py-4 shadow-sm ${msg.role === "user"
                                    ? "bg-indigo-600 text-white"
                                    : "bg-[#1a1a1c] border border-white/5 text-gray-100"
                                    }`}
                            >
                                <div className="prose prose-invert prose-sm max-w-none leading-relaxed whitespace-pre-wrap">
                                    {msg.content}
                                </div>
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#0a0a0c] via-[#0a0a0c] to-transparent">
                <form onSubmit={handleSubmit} className="relative max-w-4xl mx-auto">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={t("chat.placeholder")}
                        className="w-full bg-[#1a1a1c] border border-white/10 rounded-2xl pl-6 pr-14 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 shadow-2xl transition-all"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        className="absolute right-3 top-3 p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-500/20"
                    >
                        {isLoading ? (
                            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                        )}
                    </button>
                </form>
                <div className="text-center mt-3">
                    <p className="text-xs text-gray-600">
                        AI can make mistakes. Consider checking important information.
                    </p>
                </div>
            </div>
        </div>
    );
}
