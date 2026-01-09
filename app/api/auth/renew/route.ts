import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
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
        const { rows: tokenRows } = await sql`SELECT * FROM tokens WHERE code = ${tokenCode} AND is_used = 0`;
        const token = tokenRows[0];

        if (!token) {
            return NextResponse.json({ error: "Invalid or used token" }, { status: 400 });
        }

        // 2. Get Current User Expiration
        const { rows: userRows } = await sql`SELECT * FROM users WHERE id = ${userPayload.id}`;
        const user = userRows[0];
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // 3. Extend Expiration
        // If currently expired, start from now. If not, add to existing.
        const userExpiresAt = Number(user.expires_at);
        const currentExpiry = userExpiresAt > Date.now() ? userExpiresAt : Date.now();
        const durationMs = token.duration_hours * 60 * 60 * 1000;
        const newExpiry = currentExpiry + durationMs;

        await sql`UPDATE users SET expires_at = ${newExpiry} WHERE id = ${user.id}`;

        // 4. Mark Token as Used
        await sql`UPDATE tokens SET is_used = 1 WHERE code = ${tokenCode}`;

        return NextResponse.json({ success: true, expires_at: newExpiry });

    } catch (error) {
        console.error("Renew error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
