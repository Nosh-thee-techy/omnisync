import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not set — add it to .env");
  }

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "warn", "error"]
        : ["error"],
  });
}

type Client = ReturnType<typeof createPrismaClient>;

// Next.js dev hot-reloads modules on every edit; without this the process
// accumulates a new pool per reload until Neon refuses connections.
const globalForPrisma = globalThis as unknown as { prisma?: Client };

let productionClient: Client | undefined;

function getClient(): Client {
  if (process.env.NODE_ENV === "production") {
    return (productionClient ??= createPrismaClient());
  }

  return (globalForPrisma.prisma ??= createPrismaClient());
}

/**
 * Lazy on purpose. `next build` imports every route module to collect page
 * data, so anything constructed at module scope runs at build time — and CI
 * builds with no DATABASE_URL. Deferring construction to the first property
 * access keeps importing this module free of side effects, while still failing
 * loudly the moment a query is actually attempted without configuration.
 */
export const prisma: Client = new Proxy({} as Client, {
  get(_target, property) {
    const client = getClient();
    const value = Reflect.get(client, property, client);

    return typeof value === "function" ? value.bind(client) : value;
  },
});
