import { readJsonFile, writeJsonFile } from "@/lib/server/storage";
import { getPrismaClient } from "@/lib/server/db";

export interface NewsletterSubscriber {
  id: string;
  email: string;
  name?: string;
  source: string;
  isActive: boolean;
  createdAt: string;
}

const NEWSLETTER_FILE = "newsletter-subscribers.json";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function getNewsletterSubscribers(): Promise<NewsletterSubscriber[]> {
  const prisma = getPrismaClient();
  if (prisma) {
    try {
      const rows = await prisma.newsletterSubscriber.findMany({ orderBy: { createdAt: "desc" } });
      return rows.map((entry) => ({
        id: entry.id,
        email: entry.email,
        source: "web",
        isActive: entry.isActive,
        createdAt: entry.createdAt.toISOString(),
      }));
    } catch (error) {
      console.error("Prisma getNewsletterSubscribers fallback to JSON:", error);
    }
  }
  const subscribers = await readJsonFile<NewsletterSubscriber[]>(NEWSLETTER_FILE, []);
  return [...subscribers].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function addNewsletterSubscriber(input: {
  email: string;
  name?: string;
  source?: string;
}): Promise<NewsletterSubscriber> {
  const email = normalizeEmail(input.email);
  const prisma = getPrismaClient();
  if (prisma) {
    try {
      const subscriber = await prisma.newsletterSubscriber.upsert({
        where: { email },
        create: {
          email,
          isActive: true,
        },
        update: { isActive: true },
      });
      return {
        id: subscriber.id,
        email: subscriber.email,
        name: input.name?.trim() || undefined,
        source: input.source?.trim() || "web",
        isActive: subscriber.isActive,
        createdAt: subscriber.createdAt.toISOString(),
      };
    } catch (error) {
      console.error("Prisma addNewsletterSubscriber fallback to JSON:", error);
    }
  }
  const all = await getNewsletterSubscribers();
  const existing = all.find((entry) => normalizeEmail(entry.email) === email);
  if (existing) {
    if (!existing.isActive) {
      const reactivated = { ...existing, isActive: true };
      const next = all.map((entry) => (entry.id === existing.id ? reactivated : entry));
      await writeJsonFile(NEWSLETTER_FILE, next);
      return reactivated;
    }
    return existing;
  }

  const subscriber: NewsletterSubscriber = {
    id: `nl-${Date.now()}`,
    email,
    name: input.name?.trim() || undefined,
    source: input.source?.trim() || "web",
    isActive: true,
    createdAt: new Date().toISOString(),
  };
  await writeJsonFile(NEWSLETTER_FILE, [subscriber, ...all]);
  return subscriber;
}

