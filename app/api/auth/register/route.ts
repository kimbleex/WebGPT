import { NextRequest, NextResponse } from "next/server";
import sql, { initDb } from "@/lib/db";
import { hashPassword, signToken } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    try {
        await initDb();
        const { username, password, token: tokenCode } = await req.json();

        if (!username || !password || !tokenCode) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        // 1. Validate Token
        const { rows: tokenRows } = await sql`SELECT * FROM tokens WHERE code = ${tokenCode} AND is_used = 0`;
        const token = tokenRows[0];

        if (!token) {
            return NextResponse.json({ error: "Invalid or used token" }, { status: 400 });
        }

        // 2. Check if username exists
        const { rows: userRows } = await sql`SELECT * FROM users WHERE username = ${username}`;
        if (userRows.length > 0) {
            return NextResponse.json({ error: "Username already taken" }, { status: 400 });
        }

        // 3. Create User
        const hashedPassword = await hashPassword(password);
        const durationMs = token.duration_hours * 60 * 60 * 1000;
        const expiresAt = Date.now() + durationMs;

        const result = await sql`
        INSERT INTO users (username, password, role, expires_at, created_at)
        VALUES (${username}, ${hashedPassword}, 'user', ${expiresAt}, ${Date.now()})
        RETURNING id
    `;
        const userId = result.rows[0].id;

        // 4. Mark Token as Used
        await sql`UPDATE tokens SET is_used = 1 WHERE code = ${tokenCode}`;

        // 5. Auto Login
        const authToken = signToken({ id: Number(userId), username, role: "user" });
        const response = NextResponse.json({
            success: true,
            user: {
                id: Number(userId),
                username,
                role: "user",
                expires_at: expiresAt
            }
        });
        response.cookies.set("token", authToken, { httpOnly: true, path: "/" });

        return response;

    } catch (error) {
        console.error("Register error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
