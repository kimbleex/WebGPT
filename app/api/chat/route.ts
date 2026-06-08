import { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";
import db from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const normalizeApiBaseUrl = (rawBaseUrl: string) => {
    const baseUrl = rawBaseUrl.replace(/\/+$/, "");
    return baseUrl.endsWith("/v1") ? baseUrl : `${baseUrl}/v1`;
};

const isGptModel = (model: string) => model.toLowerCase().startsWith("gpt-");

const formatChatMessages = (messages: any[], sysPrompt?: string) => {
    let apiMessages = messages.map((m: any, idx: number) => {
        const message: any = {
            role: m.role,
            content: m.content,
        };

        if (idx !== messages.length - 1 && Array.isArray(m.content)) {
            message.content = m.content.map((item: any) => {
                if (item.type === "image_url") {
                    return { type: "text", text: "[Image]" };
                }
                return item;
            });
        }

        return message;
    });

    if (sysPrompt) {
        apiMessages = [{ role: "system", content: sysPrompt }, ...apiMessages];
    }

    return apiMessages;
};

const formatResponsesInput = (messages: any[], sysPrompt?: string) => {
    let input = messages.map((m: any, idx: number) => {
        const content = Array.isArray(m.content)
            ? m.content.map((item: any) => {
                if (item.type === "text") {
                    return { type: "input_text", text: item.text };
                }
                if (item.type === "image_url") {
                    if (idx !== messages.length - 1) {
                        return { type: "input_text", text: "[Image]" };
                    }
                    return {
                        type: "input_image",
                        image_url: item.image_url.url,
                        detail: item.image_url.detail || "auto",
                    };
                }
                if (item.type === "file") {
                    return { type: "input_text", text: `[Attached File: ${item.file.name}]` };
                }
                return { type: "input_text", text: String(item.text || "") };
            })
            : m.content;

        return {
            type: "message",
            role: m.role,
            content,
        };
    });

    if (sysPrompt) {
        input = [{ type: "message", role: "system", content: sysPrompt }, ...input];
    }

    return input;
};

const encodeStreamEvent = (event: Record<string, unknown>) => {
    return new TextEncoder().encode(`${JSON.stringify(event)}\n`);
};

const collectUrlSources = (value: any, seen = new Set<string>()): Array<{ url: string; title?: string }> => {
    if (!value || seen.size >= 8) return [];

    if (Array.isArray(value)) {
        return value.flatMap((item) => collectUrlSources(item, seen)).slice(0, 8);
    }

    if (typeof value !== "object") return [];

    const sources: Array<{ url: string; title?: string }> = [];
    const url = typeof value.url === "string" ? value.url : null;
    if (url && /^https?:\/\//i.test(url) && !seen.has(url)) {
        seen.add(url);
        sources.push({
            url,
            title: typeof value.title === "string" ? value.title : undefined,
        });
    }

    for (const nestedValue of Object.values(value)) {
        if (seen.size >= 8) break;
        sources.push(...collectUrlSources(nestedValue, seen));
    }

    return sources.slice(0, 8);
};

const collectSearchQueries = (value: any, seen = new Set<string>()): string[] => {
    if (!value || seen.size >= 6) return [];

    if (Array.isArray(value)) {
        return value.flatMap((item) => collectSearchQueries(item, seen)).slice(0, 6);
    }

    if (typeof value !== "object") return [];

    const queries: string[] = [];
    if (typeof value.query === "string" && value.query.trim() && !seen.has(value.query)) {
        seen.add(value.query);
        queries.push(value.query);
    }
    if (Array.isArray(value.queries)) {
        for (const query of value.queries) {
            if (typeof query === "string" && query.trim() && !seen.has(query)) {
                seen.add(query);
                queries.push(query);
            }
        }
    }

    for (const nestedValue of Object.values(value)) {
        if (seen.size >= 6) break;
        queries.push(...collectSearchQueries(nestedValue, seen));
    }

    return queries.slice(0, 6);
};

export async function POST(req: NextRequest) {
    try {
        const tokenCookie = req.cookies.get("token");
        if (!tokenCookie) {
            return new Response(
                JSON.stringify({ error: "Not authenticated" }),
                { status: 401, headers: { "Content-Type": "application/json" } }
            );
        }

        const userPayload = verifyToken(tokenCookie.value);
        if (!userPayload) {
            return new Response(
                JSON.stringify({ error: "Invalid session" }),
                { status: 401, headers: { "Content-Type": "application/json" } }
            );
        }

        // Check expiration from DB to be sure
        const user = await db.user.findUnique({
            where: { id: userPayload.id },
            select: { expires_at: true }
        });

        if (!user || Number(user.expires_at) < Date.now()) {
            return new Response(
                JSON.stringify({ error: "Account expired. Please renew." }),
                { status: 403, headers: { "Content-Type": "application/json" } }
            );
        }

        const { messages, model, sysPrompt } = await req.json();

        // Filter out error messages from history and format multimodal content
        const filteredMessages = messages
            .filter((m: any) => {
                if (typeof m.content === "string") {
                    return !m.content.startsWith("Error: ");
                }
                return true;
            })
            .map((m: any, index: number) => {
                const isLastMessage = index === messages.length - 1;

                if (Array.isArray(m.content)) {
                    return {
                        ...m,
                        content: m.content.map((item: any) => {
                            if (item.type === "text") return item;
                            if (item.type === "image_url") {
                                // Only keep actual image data for the last message
                                if (isLastMessage) return item;
                                return {
                                    type: "text",
                                    text: "[Image]"
                                };
                            }
                            if (item.type === "file") {
                                return {
                                    type: "text",
                                    text: `[Attached File: ${item.file.name}]`
                                };
                            }
                            return item;
                        })
                    };
                }
                return m;
            });

        const apiKey = process.env.API_KEY;
        const baseUrl = normalizeApiBaseUrl(process.env.BASE_URL || "https://api.openai.com/v1");

        if (!apiKey) {
            return new Response("API Key not configured", { status: 500 });
        }

        // 直接调用上游 API，绕过 AI SDK
        const modelId = typeof model === "string" ? model : "gpt-5.5";
        const useResponsesApi = isGptModel(modelId);
        const requestUrl = useResponsesApi
            ? `${baseUrl}/responses`
            : `${baseUrl}/chat/completions`;
        const requestBody = useResponsesApi
            ? {
                model: modelId,
                input: formatResponsesInput(filteredMessages, sysPrompt),
                stream: true,
                tools: [{ type: "web_search" }],
                tool_choice: "auto",
                include: ["web_search_call.action.sources"],
            }
            : {
                model: modelId,
                messages: formatChatMessages(filteredMessages, sysPrompt),
                stream: true,
                temperature: modelId.includes('gpt-5') || modelId.includes('o1') || modelId.includes('o3') ? undefined : 0.7,
            };

        const response = await fetch(requestUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`,
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorText = await response.text();
            return new Response(errorText || "API Error", { status: response.status });
        }

        // 解析 SSE 流并提取文本
        const decoder = new TextDecoder();
        const reader = response.body!.getReader();

        const stream = new ReadableStream({
            async start(controller) {
                try {
                    if (useResponsesApi) {
                        controller.enqueue(encodeStreamEvent({
                            type: "search_status",
                            phase: "checking",
                            message: "正在判断是否需要联网搜索...",
                        }));
                    }

                    let buffer = '';
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        buffer += decoder.decode(value, { stream: true });
                        const lines = buffer.split('\n');
                        buffer = lines.pop() || '';

                        for (const line of lines) {
                            if (line.startsWith('data: ')) {
                                const data = line.slice(6);
                                if (data === '[DONE]') continue;

                                try {
                                    const json = JSON.parse(data);
                                    if (useResponsesApi && (json.type === "response.failed" || json.type === "response.error" || json.type === "error")) {
                                        throw new Error(json.response?.error?.message || json.error?.message || "Responses API error");
                                    }
                                    if (useResponsesApi && typeof json.type === "string" && json.type.includes("web_search_call")) {
                                        const sources = collectUrlSources(json);
                                        const queries = collectSearchQueries(json);
                                        const isCompleted = json.type.endsWith(".completed") || json.type === "response.output_item.done";
                                        controller.enqueue(encodeStreamEvent({
                                            type: "search_status",
                                            phase: isCompleted ? "completed" : "searching",
                                            message: isCompleted ? "搜索完成，正在整理结果..." : "模型正在联网搜索...",
                                            sources,
                                            queries,
                                        }));
                                    }
                                    if (useResponsesApi && json.type === "response.output_item.done" && json.item?.type === "web_search_call") {
                                        controller.enqueue(encodeStreamEvent({
                                            type: "search_status",
                                            phase: "completed",
                                            message: "搜索完成，正在整理结果...",
                                            sources: collectUrlSources(json.item),
                                            queries: collectSearchQueries(json.item),
                                        }));
                                    }
                                    if (useResponsesApi && json.type === "response.output_text.annotation.added") {
                                        const sources = collectUrlSources(json.annotation);
                                        if (sources.length > 0) {
                                            controller.enqueue(encodeStreamEvent({
                                                type: "search_status",
                                                phase: "completed",
                                                message: "已找到可引用来源",
                                                sources,
                                            }));
                                        }
                                    }
                                    const content = useResponsesApi
                                        ? (json.type === "response.output_text.delta" ? json.delta : undefined)
                                        : json.choices?.[0]?.delta?.content;
                                    if (content) {
                                        controller.enqueue(encodeStreamEvent({
                                            type: "text",
                                            content,
                                        }));
                                    }
                                } catch (error) {
                                    if (error instanceof SyntaxError) {
                                        continue;
                                    }
                                    throw error;
                                    // 忽略解析错误
                                }
                            }
                        }
                    }
                    controller.close();
                } catch (error) {
                    controller.error(error);
                }
            }
        });

        return new Response(stream, {
            headers: {
                "Content-Type": "application/x-ndjson; charset=utf-8",
                "Cache-Control": "no-cache, no-transform",
                "X-Content-Type-Options": "nosniff",
            },
        });

    } catch (error: any) {
        return new Response(error.message || "Internal Server Error", { status: 500 });
    }
}
