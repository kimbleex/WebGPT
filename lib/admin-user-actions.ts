export type AdminUserAction = "disable" | "enable" | "extend";

export interface AdminUserPayload {
    role: string;
    username: string;
}

export interface ExpiryUpdateInput {
    action: AdminUserAction;
    currentExpiry: number;
    now?: number;
    hours?: number;
}

const ONE_HOUR_MS = 60 * 60 * 1000;
const MAX_EXTENSION_HOURS = 87600;

export function isSuperAdmin(user: AdminUserPayload | null | undefined, adminUsername: string | undefined) {
    return Boolean(adminUsername && user?.role === "admin" && user.username === adminUsername);
}

export function parseAdminUserAction(action: unknown): AdminUserAction | null {
    if (action === "disable" || action === "enable" || action === "extend") {
        return action;
    }

    return null;
}

export function getUpdatedExpiry(input: ExpiryUpdateInput) {
    const now = input.now ?? Date.now();

    if (input.action === "disable") {
        return now - 1000;
    }

    if (input.action === "enable") {
        return input.currentExpiry > now ? input.currentExpiry : now + ONE_HOUR_MS;
    }

    const hours = input.hours;
    if (typeof hours !== "number" || !Number.isInteger(hours) || hours < 1 || hours > MAX_EXTENSION_HOURS) {
        throw new Error("Invalid hours");
    }

    return Math.max(input.currentExpiry, now) + hours * ONE_HOUR_MS;
}
