import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { AUTH_TOKEN_MAX_AGE_SECONDS } from "@/lib/security";

const DEFAULT_DEV_JWT_SECRET = "default-secret-change-me";
const MIN_PRODUCTION_JWT_SECRET_LENGTH = 32;

export interface UserPayload {
    id: number;
    username: string;
    role: string;
}

function getJwtSecret() {
    const secret = process.env.JWT_SECRET;

    if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is required in production");
    }

    if (process.env.NODE_ENV === "production" && secret === DEFAULT_DEV_JWT_SECRET) {
        throw new Error("JWT_SECRET must not use the development default in production");
    }

    if (process.env.NODE_ENV === "production" && secret && secret.length < MIN_PRODUCTION_JWT_SECRET_LENGTH) {
        // Warn but don't crash — allow short secrets while user migrates
        console.warn(`[AUTH] JWT_SECRET is only ${secret.length} chars; recommend at least ${MIN_PRODUCTION_JWT_SECRET_LENGTH} for production security.`);
    }

    return secret || DEFAULT_DEV_JWT_SECRET;
}

export const signToken = (payload: UserPayload) => {
    return jwt.sign(payload, getJwtSecret(), { expiresIn: AUTH_TOKEN_MAX_AGE_SECONDS });
};

export const verifyToken = (token: string): UserPayload | null => {
    try {
        return jwt.verify(token, getJwtSecret()) as UserPayload;
    } catch {
        return null;
    }
};

export const hashPassword = async (password: string) => {
    return await bcrypt.hash(password, 10);
};

export const isBcryptPasswordHash = (hash: string) => {
    return /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(hash);
};

export const comparePassword = async (password: string, hash: string) => {
    if (!isBcryptPasswordHash(hash)) return false;

    return await bcrypt.compare(password, hash);
};
