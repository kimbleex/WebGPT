import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

function getDatabaseSslConfig(connectionString: string | undefined) {
    if (!connectionString) return undefined;

    try {
        const databaseUrl = new URL(connectionString);

        if (databaseUrl.searchParams.get("sslmode") === "disable") {
            return undefined;
        }

        const hostname = databaseUrl.hostname.toLowerCase();
        const isLocal =
            hostname === "localhost" ||
            hostname === "127.0.0.1" ||
            hostname === "::1" ||
            hostname === "[::1]";

        if (isLocal) return undefined;

        return { rejectUnauthorized: false };
    } catch {
        return undefined;
    }
}

const prismaClientSingleton = () => {
    // Prioritize DATABASE_URL for direct connection
    const connectionString =
        process.env.DATABASE_URL ||
        process.env.POSTGRES_URL ||
        process.env.POSTGRES_PRISMA_URL;

    if (!connectionString) {
        throw new Error("Database connection string not found. Please set DATABASE_URL, POSTGRES_URL, or POSTGRES_PRISMA_URL environment variable.");
    }

    const sslConfig = getDatabaseSslConfig(connectionString);

    // Configure pool with appropriate settings for serverless
    const pool = new pg.Pool({
        connectionString,
        ssl: sslConfig,
        max: 10, // Maximum pool size
        idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
        connectionTimeoutMillis: 10000, // Timeout after 10 seconds
    });

    const adapter = new PrismaPg(pool);

    return new PrismaClient({
        adapter,
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
};

declare global {
    var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const db = globalThis.prisma ?? prismaClientSingleton();

export default db;

if (process.env.NODE_ENV !== "production") globalThis.prisma = db;

