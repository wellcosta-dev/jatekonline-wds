import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { getPrismaClient } from "@/lib/server/db";

function getDataFilePath(fileName: string): string {
  return path.join(process.cwd(), "data", fileName);
}

export async function readJsonFile<T>(fileName: string, fallback: T): Promise<T> {
  const prisma = getPrismaClient();
  if (prisma) {
    try {
      const row = await prisma.appState.findUnique({ where: { key: fileName } });
      if (row) {
        return row.value as T;
      }
    } catch (error) {
      console.error(`Prisma readJsonFile fallback to filesystem (${fileName}):`, error);
    }
  }

  const filePath = getDataFilePath(fileName);
  try {
    const raw = await readFile(filePath, "utf-8");
    const parsed = JSON.parse(raw) as T;
    if (prisma) {
      try {
        await prisma.appState.upsert({
          where: { key: fileName },
          create: { key: fileName, value: parsed as any },
          update: { value: parsed as any },
        });
      } catch (error) {
        console.error(`Prisma cache write failed for ${fileName}:`, error);
      }
    }
    return parsed;
  } catch {
    return fallback;
  }
}

export async function writeJsonFile<T>(fileName: string, value: T): Promise<void> {
  const prisma = getPrismaClient();
  if (prisma) {
    try {
      await prisma.appState.upsert({
        where: { key: fileName },
        create: { key: fileName, value: value as any },
        update: { value: value as any },
      });
      return;
    } catch (error) {
      console.error(`Prisma writeJsonFile fallback to filesystem (${fileName}):`, error);
    }
  }

  const dirPath = path.join(process.cwd(), "data");
  const filePath = getDataFilePath(fileName);
  await mkdir(dirPath, { recursive: true });
  await writeFile(filePath, JSON.stringify(value, null, 2), "utf-8");
}
