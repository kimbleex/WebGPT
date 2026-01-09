import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import db from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    try {
        const tokenCookie = req.cookies.get("token");
        if (!tokenCookie) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const userPayload = verifyToken(tokenCookie.value);
        if (!userPayload) {
            return NextResponse.json({ error: "Invalid session" }, { status: 401 });
        }

        // Check expiration from DB to be sure
        const user = await db.user.findUnique({
            where: { id: userPayload.id },
            select: { expires_at: true }
        });

        if (!user || Number(user.expires_at) < Date.now()) {
            return NextResponse.json({ error: "Account expired. Please renew." }, { status: 403 });
        }

        const { messages, model } = await req.json();

        // Filter out error messages from history to avoid confusing the AI
        const filteredMessages = messages.filter((m: any) => !m.content.startsWith("Error: "));

        const apiKey = process.env.API_KEY;
        const baseUrl = process.env.BASE_URL || "https://api.openai.com/v1";

        if (!apiKey) {
            return new NextResponse("API Key not configured", { status: 500 });
        }

        console.log(`Chat request: model=${model}, messages=${filteredMessages.length}`);

        const res = await fetch(`${baseUrl}/chat/completions`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: model || "gpt-3.5-turbo",
                messages: filteredMessages,
                stream: true,
            }),
        });

        if (!res.ok) {
            const error = await res.text();
            console.error("LLM API Error:", error);
            return new NextResponse(error, { status: res.status });
        }

        const encoder = new TextEncoder();
        const decoder = new TextDecoder();

        // Create a stream to pass through the chunks
        const stream = new ReadableStream({
            async start(controller) {
                const reader = res.body?.getReader();
                if (!reader) {
                    controller.close();
                    return;
                }

                let buffer = "";

                try {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) {
                            controller.close();
                            break;
                        }

                        buffer += decoder.decode(value, { stream: true });
                        const lines = buffer.split("\n");
                        buffer = lines.pop() || "";

                        for (const line of lines) {
                            const trimmedLine = line.trim();
                            if (!trimmedLine || trimmedLine === "data: [DONE]") continue;

                            if (trimmedLine.startsWith("data: ")) {
                                try {
                                    const json = JSON.parse(trimmedLine.slice(6));
                                    const content = json.choices[0]?.delta?.content || "";
                                    if (content) {
                                        controller.enqueue(encoder.encode(content));
                                    }
                                } catch (e) {
                                    console.error("Error parsing SSE JSON:", e, trimmedLine);
                                }
                            }
                        }
                    }
                } catch (err) {
                    console.error("Stream error:", err);
                    controller.error(err);
                }
            },
        });

        return new NextResponse(stream, {
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
                "Cache-Control": "no-cache",
                Connection: "keep-alive",
            },
        });
    } catch (error) {
        console.error("Error in chat API:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
