import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

        const [users, total] = await Promise.all([
            db.user.findMany({
                skip,
                take: limit,
                orderBy: { id: "asc" },
                select: {
                    id: true,
                    username: true,
                    role: true,
                    created_at: true,
                    expires_at: true,
                }
            }),
            db.user.count()
        ]);

        return NextResponse.json({
            users: users.map((u: any) => ({
                ...u,
                created_at: Number(u.created_at),
                expires_at: Number(u.expires_at)
            })),
            total,
            page,
            totalPages: Math.ceil(total / limit)
        });

    } catch (error) {
        console.error("User fetch error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
