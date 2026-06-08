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
    const connectionString =
        process.env.DATABASE_URL ||
        process.env.POSTGRES_URL ||
        process.env.POSTGRES_PRISMA_URL;
    const pool = new pg.Pool({ connectionString, ssl: getDatabaseSslConfig(connectionString) });
    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter });
};

declare global {
    var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const db = globalThis.prisma ?? prismaClientSingleton();

export default db;

if (process.env.NODE_ENV !== "production") globalThis.prisma = db;

