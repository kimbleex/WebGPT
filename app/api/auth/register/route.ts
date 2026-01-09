import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { hashPassword, signToken } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    try {
        const { username, password, token: tokenCode } = await req.json();

        if (!username || !password || !tokenCode) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        // 1. Validate Token
        const token = await db.token.findUnique({
            where: { code: tokenCode }
        });

        if (!token || token.is_used === 1) {
            return NextResponse.json({ error: "Invalid or used token" }, { status: 400 });
        }

        // 2. Check if username exists
        const existingUser = await db.user.findUnique({
            where: { username }
        });
        if (existingUser) {
            return NextResponse.json({ error: "Username already taken" }, { status: 400 });
        }

        // 3. Create User
        const hashedPassword = await hashPassword(password);
        const durationMs = token.duration_hours * 60 * 60 * 1000;
        const expiresAt = Date.now() + durationMs;

        const newUser = await db.user.create({
            data: {
                username,
                password: hashedPassword,
                role: "user",
                expires_at: BigInt(expiresAt),
                created_at: BigInt(Date.now()),
            }
        });

        // 4. Mark Token as Used
        await db.token.update({
            where: { code: tokenCode },
            data: { is_used: 1 }
        });

        // 5. Auto Login
        const authToken = signToken({ id: Number(newUser.id), username, role: "user" });
        const response = NextResponse.json({
            success: true,
            user: {
                id: Number(newUser.id),
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
