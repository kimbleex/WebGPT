import { NextRequest, NextResponse } from "next/server";
import sql, { initDb } from "@/lib/db";
import { comparePassword, hashPassword, signToken } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    try {
        await initDb();
        const { username, password } = await req.json();

        if (!username || !password) {
            return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
        }

        console.log(`Login attempt for username: ${username}`);

        // 1. Check if it's the Super Admin logging in via Env Vars
        const adminUser = process.env.ADMIN_USERNAME;
        const adminPass = process.env.ADMIN_PASSWORD;

        if (adminUser && adminPass && username === adminUser) {
            // Verify admin password
            if (password === adminPass) {
                // Upsert admin into DB to ensure they exist
                const { rows } = await sql`SELECT * FROM users WHERE username = ${username}`;
                const existingAdmin = rows[0];

                let adminId = existingAdmin?.id;

                const hashedPassword = await hashPassword(password);

                if (!existingAdmin) {
                    const result = await sql`
                    INSERT INTO users (username, password, role, expires_at, created_at)
                    VALUES (${username}, ${hashedPassword}, 'admin', 253402300799999, ${Date.now()})
                    RETURNING id
                `;
                    adminId = result.rows[0].id;
                } else {
                    // Update the password in DB to match the Env Var
                    await sql`UPDATE users SET password = ${hashedPassword} WHERE id = ${existingAdmin.id}`;
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
                response.cookies.set("token", token, { httpOnly: true, path: "/" });
                return response;
            }
        }

        // 2. Regular User Login
        const { rows } = await sql`SELECT * FROM users WHERE username = ${username}`;
        const user = rows[0];

        if (!user) {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }

        const isValid = await comparePassword(password, user.password);
        if (!isValid) {
            console.log(`Invalid password for user: ${username}`);
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
        response.cookies.set("token", token, { httpOnly: true, path: "/" });

        return response;

    } catch (error) {
        console.error("Login error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
