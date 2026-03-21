import { PrismaClient } from "@prisma/client";

declare global {
  var __prismaClient__: PrismaClient | undefined;
}

function createClient() {
  return new PrismaClient();
}

export function getPrismaClient(): PrismaClient | null {
  if (!process.env.DATABASE_URL) return null;
  if (!global.__prismaClient__) {
    global.__prismaClient__ = createClient();
  }
  return global.__prismaClient__;
}

