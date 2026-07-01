import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { getUpdatedExpiry, isSuperAdmin, parseAdminUserAction } from "@/lib/admin-user-actions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function toUserResponse(user: {
    id: number;
    username: string;
    role: string;
    created_at: bigint | number;
    expires_at: bigint | number;
}) {
    const expiresAt = Number(user.expires_at);

    return {
        ...user,
        created_at: Number(user.created_at),
        expires_at: expiresAt,
        is_disabled: expiresAt < Date.now(),
    };
}

export async function GET(req: NextRequest) {
    try {
        const tokenCookie = req.cookies.get("token");
        if (!tokenCookie) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const userPayload = verifyToken(tokenCookie.value);
        if (!userPayload || !isSuperAdmin(userPayload, process.env.ADMIN_USERNAME)) {
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
            users: users.map(toUserResponse),
            total,
            page,
            totalPages: Math.ceil(total / limit)
        });

    } catch (error: unknown) {
        console.error("[ADMIN/USERS] Unhandled error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const tokenCookie = req.cookies.get("token");
        if (!tokenCookie) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const userPayload = verifyToken(tokenCookie.value);
        if (!userPayload || !isSuperAdmin(userPayload, process.env.ADMIN_USERNAME)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const { userId, action: rawAction, hours } = await req.json();
        const targetUserId = Number(userId);
        const action = parseAdminUserAction(rawAction);

        if (!Number.isInteger(targetUserId) || targetUserId < 1 || !action) {
            return NextResponse.json({ error: "Invalid request" }, { status: 400 });
        }

        if (targetUserId === userPayload.id) {
            return NextResponse.json({ error: "Cannot update yourself" }, { status: 400 });
        }

        const targetUser = await db.user.findUnique({
            where: { id: targetUserId },
            select: {
                id: true,
                username: true,
                role: true,
                created_at: true,
                expires_at: true,
            },
        });

        if (!targetUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        let updatedExpiry: number;
        try {
            updatedExpiry = getUpdatedExpiry({
                action,
                currentExpiry: Number(targetUser.expires_at),
                hours: hours === undefined ? undefined : Number(hours),
            });
        } catch {
            return NextResponse.json({ error: "Invalid hours" }, { status: 400 });
        }

        const updatedUser = await db.user.update({
            where: { id: targetUserId },
            data: { expires_at: BigInt(updatedExpiry) },
            select: {
                id: true,
                username: true,
                role: true,
                created_at: true,
                expires_at: true,
            },
        });

        return NextResponse.json({ user: toUserResponse(updatedUser) });
    } catch (error: unknown) {
        console.error("[ADMIN/USERS PATCH] Unhandled error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
