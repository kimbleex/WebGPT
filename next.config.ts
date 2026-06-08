import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', '@prisma/adapter-pg'],
  },
};

export default nextConfig;
