import { NextRequest, NextResponse } from "next/server";
import sql, { initDb } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    try {
        await initDb();
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

        await sql`
        INSERT INTO tokens (code, duration_hours, is_used, created_by, created_at)
        VALUES (${code}, ${duration_hours}, 0, ${userPayload.username}, ${Date.now()})
    `;

        return NextResponse.json({ code });

    } catch (error) {
        console.error("Token generation error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        await initDb();
        const tokenCookie = req.cookies.get("token");
        if (!tokenCookie) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const userPayload = verifyToken(tokenCookie.value);
        if (!userPayload || userPayload.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const { rows } = await sql`SELECT * FROM tokens ORDER BY created_at DESC`;

        return NextResponse.json({
            tokens: rows.map(t => ({
                ...t,
                created_at: Number(t.created_at)
            }))
        });

    } catch (error) {
        console.error("Token fetch error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
