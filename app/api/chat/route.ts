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
const isClaudeModel = (model: string) => model.toLowerCase().startsWith("claude-");
const isDeepSeekModel = (model: string) => model.toLowerCase().startsWith("deepseek-");

type ChatMessage = {
    role: string;
    content: unknown;
} & Record<string, unknown>;

const isRecord = (value: unknown): value is Record<string, unknown> => {
    return typeof value === "object" && value !== null;
};

const toChatMessage = (value: unknown): ChatMessage | null => {
    if (!isRecord(value) || typeof value.role !== "string") return null;
    return {
        ...value,
        role: value.role,
        content: value.content,
    };
};

const getContentType = (item: unknown) => {
    return isRecord(item) && typeof item.type === "string" ? item.type : "";
};

const getImageUrl = (item: Record<string, unknown>) => {
    const imageUrl = item.image_url;
    if (!isRecord(imageUrl) || typeof imageUrl.url !== "string") return undefined;
    return imageUrl.url;
};

const getImageDetail = (item: Record<string, unknown>) => {
    const imageUrl = item.image_url;
    if (!isRecord(imageUrl) || typeof imageUrl.detail !== "string") return "auto";
    return imageUrl.detail;
};

const getFileName = (item: Record<string, unknown>) => {
    const file = item.file;
    if (!isRecord(file) || typeof file.name !== "string") return "unknown";
    return file.name;
};

const getModelProviderConfig = (model: string) => {
    if (isGptModel(model)) {
        return {
            provider: "openai" as const,
            apiKey: process.env.OPENAI_API_KEY,
            baseUrl: normalizeApiBaseUrl(process.env.OPENAI_BASE_URL || "https://api.openai.com/v1"),
            missingKeyMessage: "OPENAI_API_KEY not configured",
        };
    }

    if (isClaudeModel(model)) {
        return {
            provider: "anthropic" as const,
            apiKey: process.env.ANTHROPIC_API_KEY,
            baseUrl: normalizeApiBaseUrl(process.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com/v1"),
            missingKeyMessage: "ANTHROPIC_API_KEY not configured",
        };
    }

    if (isDeepSeekModel(model)) {
        return {
            provider: "deepseek" as const,
            apiKey: process.env.DPSK_API_KEY,
            baseUrl: normalizeApiBaseUrl(process.env.DPSK_BASE_URL || "https://api.deepseek.com/v1"),
            missingKeyMessage: "DPSK_API_KEY not configured",
        };
    }

    return null;
};

const formatResponsesInput = (messages: ChatMessage[], sysPrompt?: string) => {
    let input = messages.map((m, idx) => {
        const content = Array.isArray(m.content)
            ? m.content.map((item) => {
                if (!isRecord(item)) {
                    return { type: "input_text", text: "" };
                }
                if (getContentType(item) === "text") {
                    return { type: "input_text", text: item.text };
                }
                if (getContentType(item) === "image_url") {
                    if (idx !== messages.length - 1) {
                        return { type: "input_text", text: "[Image]" };
                    }
                    return {
                        type: "input_image",
                        image_url: getImageUrl(item),
                        detail: getImageDetail(item),
                    };
                }
                if (getContentType(item) === "file") {
                    return { type: "input_text", text: `[Attached File: ${getFileName(item)}]` };
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

const formatAnthropicMessages = (messages: ChatMessage[]) => {
    return messages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => {
            const content = Array.isArray(m.content)
                ? m.content.map((item) => {
                    if (!isRecord(item)) {
                        return { type: "text", text: "" };
                    }
                    if (getContentType(item) === "text") {
                        return { type: "text", text: item.text };
                    }
                    if (getContentType(item) === "image_url") {
                        const imageUrl = getImageUrl(item);
                        const dataUrlMatch = typeof imageUrl === "string"
                            ? imageUrl.match(/^data:(.+?);base64,(.+)$/)
                            : null;

                        if (dataUrlMatch) {
                            return {
                                type: "image",
                                source: {
                                    type: "base64",
                                    media_type: dataUrlMatch[1],
                                    data: dataUrlMatch[2],
                                },
                            };
                        }

                        return { type: "text", text: "[Image]" };
                    }
                    if (getContentType(item) === "file") {
                        return { type: "text", text: `[Attached File: ${getFileName(item)}]` };
                    }
                    return { type: "text", text: String(item.text || "") };
                })
                : m.content;

            return {
                role: m.role === "assistant" ? "assistant" : "user",
                content,
            };
        });
};

const formatChatCompletionMessages = (messages: ChatMessage[], sysPrompt?: string) => {
    let apiMessages = messages.map((m) => {
        const content = Array.isArray(m.content)
            ? m.content.map((item) => {
                if (!isRecord(item)) return { type: "text", text: "" };
                if (getContentType(item) === "text") {
                    return { type: "text", text: String(item.text || "") };
                }
                if (getContentType(item) === "image_url") {
                    return { type: "text", text: "[Image]" };
                }
                if (getContentType(item) === "file") {
                    return { type: "text", text: `[Attached File: ${getFileName(item)}]` };
                }
                return { type: "text", text: String(item.text || "") };
            })
            : m.content;

        return {
            role: m.role,
            content,
        };
    });

    if (sysPrompt) {
        apiMessages = [{ role: "system", content: sysPrompt }, ...apiMessages];
    }

    return apiMessages;
};

const encodeStreamEvent = (event: Record<string, unknown>) => {
    return new TextEncoder().encode(`${JSON.stringify(event)}\n`);
};

const collectUrlSources = (value: unknown, seen = new Set<string>()): Array<{ url: string; title?: string }> => {
    if (!value || seen.size >= 8) return [];

    if (Array.isArray(value)) {
        return value.flatMap((item) => collectUrlSources(item, seen)).slice(0, 8);
    }

    if (!isRecord(value)) return [];

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

const collectSearchQueries = (value: unknown, seen = new Set<string>()): string[] => {
    if (!value || seen.size >= 6) return [];

    if (Array.isArray(value)) {
        return value.flatMap((item) => collectSearchQueries(item, seen)).slice(0, 6);
    }

    if (!isRecord(value)) return [];

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

        const body = await req.json();
        const bodyRecord = isRecord(body) ? body : {};
        const messages = Array.isArray(bodyRecord.messages)
            ? bodyRecord.messages.map(toChatMessage).filter((m): m is ChatMessage => m !== null)
            : [];
        const model = bodyRecord.model;
        const sysPrompt = typeof bodyRecord.sysPrompt === "string" ? bodyRecord.sysPrompt : undefined;

        // Filter out error messages from history and format multimodal content
        const filteredMessages = messages
            .filter((m) => {
                if (typeof m.content === "string") {
                    return !m.content.startsWith("Error: ");
                }
                return true;
            })
            .map((m, index) => {
                const isLastMessage = index === messages.length - 1;

                if (Array.isArray(m.content)) {
                    return {
                        ...m,
                        content: m.content.map((item) => {
                            if (!isRecord(item)) return item;
                            if (getContentType(item) === "text") return item;
                            if (getContentType(item) === "image_url") {
                                // Only keep actual image data for the last message
                                if (isLastMessage) return item;
                                return {
                                    type: "text",
                                    text: "[Image]"
                                };
                            }
                            if (getContentType(item) === "file") {
                                return {
                                    type: "text",
                                    text: `[Attached File: ${getFileName(item)}]`
                                };
                            }
                            return item;
                        })
                    };
                }
                return m;
            });

        // 直接调用上游 API，绕过 AI SDK
        const modelId = typeof model === "string" ? model : "gpt-5.5";
        const providerConfig = getModelProviderConfig(modelId);

        if (!providerConfig) {
            return new Response(`Unsupported model: ${modelId}`, { status: 400 });
        }

        if (!providerConfig.apiKey) {
            return new Response(providerConfig.missingKeyMessage, { status: 500 });
        }

        const apiKey = providerConfig.apiKey;
        const useResponsesApi = providerConfig.provider === "openai";
        const useAnthropicApi = providerConfig.provider === "anthropic";
        const requestUrl = useResponsesApi
            ? `${providerConfig.baseUrl}/responses`
            : useAnthropicApi
                ? `${providerConfig.baseUrl}/messages`
                : `${providerConfig.baseUrl}/chat/completions`;
        const requestBody = useResponsesApi
            ? {
                model: modelId,
                input: formatResponsesInput(filteredMessages, sysPrompt),
                stream: true,
                tools: [{ type: "web_search" }],
                tool_choice: "auto",
                include: ["web_search_call.action.sources"],
            }
            : useAnthropicApi
                ? {
                model: modelId,
                system: sysPrompt || undefined,
                messages: formatAnthropicMessages(filteredMessages),
                max_tokens: 4096,
                stream: true,
                temperature: 0.7,
            }
                : {
                model: modelId,
                messages: formatChatCompletionMessages(filteredMessages, sysPrompt),
                stream: true,
                temperature: 0.7,
            };
        const requestHeaders: Record<string, string> = {
            "Content-Type": "application/json",
        };

        if (useAnthropicApi) {
            requestHeaders["x-api-key"] = apiKey;
            requestHeaders["anthropic-version"] = "2023-06-01";
        } else {
            requestHeaders.Authorization = `Bearer ${apiKey}`;
        }

        const response = await fetch(requestUrl, {
            method: "POST",
            headers: requestHeaders,
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
                                    if (useAnthropicApi && json.type === "error") {
                                        throw new Error(json.error?.message || "Anthropic API error");
                                    }
                                    if (!useResponsesApi && !useAnthropicApi && json.error?.message) {
                                        throw new Error(json.error.message);
                                    }
                                    const content = useResponsesApi
                                        ? (json.type === "response.output_text.delta" ? json.delta : undefined)
                                        : useAnthropicApi
                                            ? (json.type === "content_block_delta" && json.delta?.type === "text_delta" ? json.delta.text : undefined)
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

    } catch (error: unknown) {
        return new Response(error instanceof Error ? error.message : "Internal Server Error", { status: 500 });
    }
}
