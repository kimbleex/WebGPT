import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    try {
        const tokenCookie = req.cookies.get("token");
        if (!tokenCookie) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const userPayload = verifyToken(tokenCookie.value);
        if (!userPayload || userPayload.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const { duration_hours } = await req.json();
        const code = crypto.randomBytes(8).toString("hex").toUpperCase();

        await db.token.create({
            data: {
                code,
                duration_hours,
                is_used: 0,
                created_by: userPayload.username,
                created_at: BigInt(Date.now()),
            }
        });

        return NextResponse.json({ code });

    } catch (error) {
        console.error("Token generation error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        const tokenCookie = req.cookies.get("token");
        if (!tokenCookie) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const userPayload = verifyToken(tokenCookie.value);
        if (!userPayload || userPayload.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const skip = (page - 1) * limit;

        const [tokens, total] = await Promise.all([
            db.token.findMany({
                skip,
                take: limit,
                orderBy: { created_at: "desc" }
            }),
            db.token.count()
        ]);

        return NextResponse.json({
            tokens: tokens.map((t: any) => ({
                ...t,
                created_at: Number(t.created_at)
            })),
            total,
            page,
            totalPages: Math.ceil(total / limit)
        });

    } catch (error) {
        console.error("Token fetch error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
