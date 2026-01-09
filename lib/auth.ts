import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET || "default-secret-change-me";

export interface UserPayload {
    id: number;
    username: string;
    role: string;
}

export const signToken = (payload: UserPayload) => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
};

export const verifyToken = (token: string): UserPayload | null => {
    try {
        return jwt.verify(token, JWT_SECRET) as UserPayload;
    } catch (e) {
        return null;
    }
};

export const hashPassword = async (password: string) => {
    return await bcrypt.hash(password, 10);
};

export const comparePassword = async (password: string, hash: string) => {
    return await bcrypt.compare(password, hash);
};
