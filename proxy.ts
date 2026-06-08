import { NextRequest, NextResponse } from "next/server";

const SECURITY_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-Frame-Options": "DENY",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};

const PRODUCTION_SECURITY_HEADERS = {
    "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
};

function withSecurityHeaders(response: NextResponse) {
    for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
        response.headers.set(name, value);
    }

    if (process.env.NODE_ENV === "production") {
        for (const [name, value] of Object.entries(PRODUCTION_SECURITY_HEADERS)) {
            response.headers.set(name, value);
        }
    }

    return response;
}

function isLocalHost(host: string | null) {
    if (!host) return false;

    const hostname = host.startsWith("[")
        ? host.slice(0, host.indexOf("]") + 1).toLowerCase()
        : host.split(":")[0].toLowerCase();

    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1" || hostname === "[::1]";
}

function isInsecureProductionRequest(req: NextRequest) {
    if (process.env.NODE_ENV !== "production" || isLocalHost(req.headers.get("host"))) {
        return false;
    }

    const forwardedProto = req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
    const protocol = forwardedProto || req.nextUrl.protocol.replace(":", "");

    return protocol === "http";
}

export function proxy(req: NextRequest) {
    if (isInsecureProductionRequest(req)) {
        const { pathname } = req.nextUrl;

        if (pathname.startsWith("/api/")) {
            return withSecurityHeaders(
                NextResponse.json({ error: "HTTPS required" }, { status: 403 }),
            );
        }

        const httpsUrl = req.nextUrl.clone();
        httpsUrl.protocol = "https:";
        return withSecurityHeaders(NextResponse.redirect(httpsUrl, 308));
    }

    return withSecurityHeaders(NextResponse.next());
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
