import { PrismaClient } from "@prisma/client";

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "file:./dev.db";
}

let prisma: PrismaClient | null = null;

export function getPrisma() {
  prisma ??= new PrismaClient();
  return prisma;
}
