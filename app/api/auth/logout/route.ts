export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, getExpiredAuthCookieOptions } from "@/lib/security";

export async function POST() {
    const response = NextResponse.json({ success: true });
    response.cookies.set(AUTH_COOKIE_NAME, "", getExpiredAuthCookieOptions());
    return response;
}
