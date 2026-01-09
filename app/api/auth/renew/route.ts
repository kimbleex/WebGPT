import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { verifyToken } from "@/lib/auth";

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

        const { token: tokenCode } = await req.json();
        if (!tokenCode) {
            return NextResponse.json({ error: "Missing token" }, { status: 400 });
        }

        // 1. Validate Token
        const token = await db.token.findUnique({
            where: { code: tokenCode }
        });

        if (!token || token.is_used === 1) {
            return NextResponse.json({ error: "Invalid or used token" }, { status: 400 });
        }

        // 2. Get Current User Expiration
        const user = await db.user.findUnique({
            where: { id: userPayload.id }
        });
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // 3. Extend Expiration
        const userExpiresAt = Number(user.expires_at);
        const currentExpiry = userExpiresAt > Date.now() ? userExpiresAt : Date.now();
        const durationMs = token.duration_hours * 60 * 60 * 1000;
        const newExpiry = currentExpiry + durationMs;

        await db.user.update({
            where: { id: user.id },
            data: { expires_at: BigInt(newExpiry) }
        });

        // 4. Mark Token as Used
        await db.token.update({
            where: { code: tokenCode },
            data: { is_used: 1 }
        });

        return NextResponse.json({ success: true, expires_at: newExpiry });

    } catch (error) {
        console.error("Renew error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
