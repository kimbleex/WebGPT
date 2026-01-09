import { sql } from "@vercel/postgres";

// Initialize Schema
export const initDb = async () => {
    try {
        // Users table
        await sql`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'user',
          expires_at BIGINT NOT NULL,
          created_at BIGINT NOT NULL
        )
      `;

        // Tokens table
        await sql`
        CREATE TABLE IF NOT EXISTS tokens (
          code TEXT PRIMARY KEY,
          duration_hours INTEGER NOT NULL,
          is_used INTEGER NOT NULL DEFAULT 0,
          created_by TEXT NOT NULL,
          created_at BIGINT NOT NULL
        )
      `;
        console.log("Database initialized successfully");
    } catch (error) {
        console.error("Database initialization error:", error);
    }
};

export default sql;
