import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { Prisma } from "@prisma/client";
import { comparePassword, hashPassword, signToken } from "@/lib/auth";
import { AUTH_COOKIE_NAME, getAuthCookieOptions } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getErrorDetails(error: unknown) {
    const candidate = error as { code?: unknown; message?: unknown };

    return {
        code: String(candidate?.code ?? ""),
        message: String(candidate?.message ?? ""),
    };
}

async function ensureCoreTablesExist() {
    try {
        await db.user.findFirst({ select: { id: true } });
    } catch (error: unknown) {
        const { code, message } = getErrorDetails(error);
        const isMissingTable =
            code === "P2021" ||
            /relation\s+"?User"?\s+does\s+not\s+exist/i.test(message) ||
            /table\s+"?User"?\s+does\s+not\s+exist/i.test(message);

        if (!isMissingTable) throw error;

        await db.$executeRaw(
            Prisma.sql`
                CREATE TABLE IF NOT EXISTS "User" (
                    "id" SERIAL PRIMARY KEY,
                    "username" TEXT NOT NULL,
                    "password" TEXT NOT NULL,
                    "role" TEXT NOT NULL DEFAULT 'user',
                    "expires_at" BIGINT NOT NULL,
                    "created_at" BIGINT NOT NULL
                )
            `
        );
        await db.$executeRaw(
            Prisma.sql`CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User"("username")`
        );
    }

    try {
        await db.token.findFirst({ select: { code: true } });
    } catch (error: unknown) {
        const { code, message } = getErrorDetails(error);
        const isMissingTable =
            code === "P2021" ||
            /relation\s+"?Token"?\s+does\s+not\s+exist/i.test(message) ||
            /table\s+"?Token"?\s+does\s+not\s+exist/i.test(message);

        if (!isMissingTable) throw error;

        await db.$executeRaw(
            Prisma.sql`
                CREATE TABLE IF NOT EXISTS "Token" (
                    "code" TEXT PRIMARY KEY,
                    "duration_hours" INTEGER NOT NULL,
                    "is_used" INTEGER NOT NULL DEFAULT 0,
                    "created_by" TEXT NOT NULL,
                    "created_at" BIGINT NOT NULL
                )
            `
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const { username, password } = await req.json();

        if (!username || !password) {
            return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
        }

        // 1. Check if it's the Super Admin logging in via Env Vars
        const adminUser = process.env.ADMIN_USERNAME;
        const adminPass = process.env.ADMIN_PASSWORD;

        if (adminUser && adminPass && username === adminUser) {
            // Verify admin password
            if (password === adminPass) {
                await ensureCoreTablesExist();
                // Upsert admin into DB to ensure they exist
                const existingAdmin = await db.user.findUnique({ where: { username } });

                let adminId = existingAdmin?.id;
                const hashedPassword = await hashPassword(password);

                if (!existingAdmin) {
                    const newAdmin = await db.user.create({
                        data: {
                            username,
                            password: hashedPassword,
                            role: "admin",
                            expires_at: BigInt(253402300799999),
                            created_at: BigInt(Date.now()),
                        },
                    });
                    adminId = newAdmin.id;
                } else {
                    // Update the password in DB to match the Env Var
                    await db.user.update({
                        where: { id: existingAdmin.id },
                        data: { password: hashedPassword, role: "admin" },
                    });
                    adminId = existingAdmin.id;
                }

                const token = signToken({ id: Number(adminId), username, role: "admin" });
                const response = NextResponse.json({
                    success: true,
                    user: {
                        id: Number(adminId),
                        username,
                        role: "admin",
                        expires_at: 253402300799999
                    }
                });
                response.cookies.set(AUTH_COOKIE_NAME, token, getAuthCookieOptions());
                return response;
            }
        }

        // 2. Regular User Login
        const user = await db.user.findUnique({ where: { username } });

        if (!user) {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }

        const isValid = await comparePassword(password, user.password);
        if (!isValid) {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }

        // 3. Check Expiration
        if (Number(user.expires_at) < Date.now()) {
            return NextResponse.json({ error: "Account expired. Please renew." }, { status: 403 });
        }

        const token = signToken({ id: Number(user.id), username: user.username, role: user.role });
        const response = NextResponse.json({
            success: true,
            user: {
                id: Number(user.id),
                username: user.username,
                role: user.role,
                expires_at: Number(user.expires_at)
            }
        });
        response.cookies.set(AUTH_COOKIE_NAME, token, getAuthCookieOptions());

        return response;

    } catch (error: unknown) {
        // Log the actual error so it appears in Vercel Function Logs
        console.error("[LOGIN] Unhandled error:", error);
        const detail = error instanceof Error ? error.message : String(error);
        return NextResponse.json(
            { error: "Internal server error", detail },
            { status: 500 }
        );
    }
}
