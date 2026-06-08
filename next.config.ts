import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3", "@prisma/client", "@prisma/adapter-pg"],
};

export default nextConfig;
