import { PrismaClient } from "@prisma/client";

// Singleton Prisma pour éviter d'ouvrir trop de connexions en développement
// (Next.js recharge les modules à chaque modification).
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
