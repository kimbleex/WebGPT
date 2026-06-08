import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
    const diagnostics: Record<string, unknown> = {
        timestamp: new Date().toISOString(),
        nodeEnv: process.env.NODE_ENV,
        hasDbUrl: !!process.env.DATABASE_URL,
        hasPostgresUrl: !!process.env.POSTGRES_URL,
        hasJwtSecret: !!process.env.JWT_SECRET,
        jwtSecretLength: process.env.JWT_SECRET?.length ?? 0,
        hasAdminUsername: !!process.env.ADMIN_USERNAME,
        hasAdminPassword: !!process.env.ADMIN_PASSWORD,
    };

    // Try to parse DB URL to show host (without password)
    const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    if (dbUrl) {
        try {
            const parsed = new URL(dbUrl);
            diagnostics.dbHost = parsed.hostname;
            diagnostics.dbPort = parsed.port;
            diagnostics.dbName = parsed.pathname;
            diagnostics.dbProtocol = parsed.protocol;
            diagnostics.dbSslMode = parsed.searchParams.get("sslmode");
        } catch (e) {
            diagnostics.dbUrlParseError = String(e);
        }
    }

    // Try to connect to DB
    try {
        const { PrismaClient } = await import("@prisma/client");
        const { PrismaPg } = await import("@prisma/adapter-pg");
        const pg = await import("pg");

        if (!dbUrl) {
            diagnostics.dbConnection = "NO_URL";
            return NextResponse.json(diagnostics);
        }

        const pool = new pg.default.Pool({
            connectionString: dbUrl,
            ssl: { rejectUnauthorized: false },
            connectionTimeoutMillis: 5000,
            max: 1,
        });

        // Test raw pg connection first
        try {
            const client = await pool.connect();
            const result = await client.query("SELECT 1 as test");
            diagnostics.pgRawConnection = "OK";
            diagnostics.pgTestResult = result.rows[0];
            client.release();
        } catch (pgErr) {
            diagnostics.pgRawConnection = "FAILED";
            diagnostics.pgRawError = pgErr instanceof Error ? pgErr.message : String(pgErr);
        }

        // Test Prisma connection
        try {
            const adapter = new PrismaPg(pool);
            const prisma = new PrismaClient({ adapter });
            await prisma.$executeRaw`SELECT 1`;
            diagnostics.prismaConnection = "OK";
            await prisma.$disconnect();
        } catch (prismaErr) {
            diagnostics.prismaConnection = "FAILED";
            diagnostics.prismaError = prismaErr instanceof Error ? prismaErr.message : String(prismaErr);
        }

        await pool.end();
    } catch (importErr) {
        diagnostics.importError = importErr instanceof Error ? importErr.message : String(importErr);
    }

    return NextResponse.json(diagnostics, { status: 200 });
}
