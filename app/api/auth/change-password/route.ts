import { NextRequest, NextResponse } from "next/server";
import { verifyToken, hashPassword, comparePassword } from "@/lib/auth";
import db from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { oldPassword, newPassword } = await req.json();

    if (!oldPassword || !newPassword) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // 获取当前用户信息
    const user = await db.user.findUnique({
      where: { id: payload.id },
      select: { id: true, password: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 验证旧密码
    const isValid = await comparePassword(oldPassword, user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 }
      );
    }

    // 更新密码
    const hashedPassword = await hashPassword(newPassword);
    await db.user.update({
      where: { id: payload.id },
      data: { password: hashedPassword },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("[CHANGE-PASSWORD] Unhandled error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
