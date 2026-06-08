// Prisma 7 Configuration
import { config } from "dotenv";
import path from "path";
import fs from "fs";

const envPath = path.join(process.cwd(), ".env.local");

// Only load .env.local if it exists
if (fs.existsSync(envPath)) {
  config({ path: envPath });
}

import { defineConfig } from "prisma/config";

// Get the database URL from environment variables
const databaseUrl =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL;

if (!databaseUrl) {
  console.warn("Warning: No database URL found in environment variables.");
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: databaseUrl,
  },
});
