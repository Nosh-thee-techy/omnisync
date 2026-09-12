import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// This file configures the Prisma CLI only (generate / migrate / studio / seed).
// The app's own connection lives in src/lib/prisma.ts.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Migrations go over Neon's direct endpoint — PgBouncer can't hold the
    // advisory locks the schema engine takes. Runtime traffic uses the pooled
    // DATABASE_URL instead.
    url: process.env.DIRECT_URL ? env("DIRECT_URL") : env("DATABASE_URL"),
  },
});
