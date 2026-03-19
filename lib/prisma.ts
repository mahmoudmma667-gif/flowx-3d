import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
const databaseUrl = process.env.DATABASE_URL ?? "file:./dev.db";

export const getPrisma = () => {
    if (globalForPrisma.prisma) return globalForPrisma.prisma;

    const prisma = new PrismaClient({
        adapter: new PrismaBetterSqlite3(
            { url: databaseUrl },
            // Preserve compatibility with the existing SQLite file.
            { timestampFormat: "unixepoch-ms" },
        ),
        log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    });

    if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
    return prisma;
};

// Lazy proxy to prevent top-level initialization during build probes
export const prisma = new Proxy({} as PrismaClient, {
    get(target, prop) {
        const client = getPrisma();
        const value = Reflect.get(client, prop);

        if (typeof value === 'function') {
            return value.bind(client);
        }

        return value;
    }
});
