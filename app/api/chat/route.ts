import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import db from "@/lib/db";
import OpenAI from "openai";

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

        // Filter out error messages from history and format multimodal content for OpenAI
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
                                // Only keep actual image data for the last message to avoid confusion and save tokens
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
        const baseUrl = process.env.BASE_URL || "https://api.openai.com/v1";

        if (!apiKey) {
            return new NextResponse("API Key not configured", { status: 500 });
        }

        const openai = new OpenAI({
            apiKey: apiKey,
            baseURL: baseUrl,
        });

        console.log(`Chat request (SDK): model=${model}, messages=${filteredMessages.length}`);

        const response = await openai.chat.completions.create({
            model: model || "gpt-3.5-turbo",
            messages: filteredMessages,
            stream: true,
        });

        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                console.log(`Stream started for model: ${model}`);
                try {
                    for await (const chunk of response) {
                        const content = chunk.choices[0]?.delta?.content || "";
                        if (content) {
                            controller.enqueue(encoder.encode(content));
                        }
                    }
                    console.log(`Stream finished normally for model: ${model}`);
                    controller.close();
                } catch (err) {
                    console.error("Stream error:", err);
                    controller.error(err);
                }
            },
        });

        return new NextResponse(stream, {
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
                "Cache-Control": "no-cache, no-transform",
                "X-Content-Type-Options": "nosniff",
            },
        });
    } catch (error: any) {
        console.error("Error in chat API:", error);
        return new NextResponse(error.message || "Internal Server Error", { status: 500 });
    }
}
