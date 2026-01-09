import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    try {
        const tokenCookie = req.cookies.get("token");
        if (!tokenCookie) {
            return NextResponse.json({ user: null });
        }

        const userPayload = verifyToken(tokenCookie.value);
        if (!userPayload) {
            return NextResponse.json({ user: null });
        }

        const { rows } = await sql`SELECT id, username, role, expires_at FROM users WHERE id = ${userPayload.id}`;
        const user = rows[0];

        if (!user) {
            return NextResponse.json({ user: null });
        }

        return NextResponse.json({
            user: {
                ...user,
                expires_at: Number(user.expires_at)
            }
        });

    } catch (error) {
        console.error("Me error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
