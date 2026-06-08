export const AUTH_COOKIE_NAME = "token";
export const AUTH_TOKEN_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

export function getAuthCookieOptions() {
    return {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax" as const,
        path: "/",
        maxAge: AUTH_TOKEN_MAX_AGE_SECONDS,
    };
}

export function getExpiredAuthCookieOptions() {
    return {
        ...getAuthCookieOptions(),
        maxAge: 0,
        expires: new Date(0),
    };
}
