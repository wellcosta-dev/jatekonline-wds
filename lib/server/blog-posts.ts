import type { BlogPost } from "@/types";
import { blogPosts as baseBlogPosts } from "@/lib/mock-data";
import { readJsonFile, writeJsonFile } from "@/lib/server/storage";

const BLOG_POST_OVERRIDES_FILE = "blog-post-overrides.json";
const BLOG_POST_DELETED_FILE = "blog-post-deleted.json";

type StoredBlogPostMap = Record<string, BlogPost>;

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => String(entry ?? "").trim())
    .filter(Boolean);
}

function sanitizeBlogPostPatch(input: Record<string, unknown>): Partial<BlogPost> {
  const output: Partial<BlogPost> = {};
  if (typeof input.slug === "string") output.slug = input.slug.trim();
  if (typeof input.title === "string") output.title = input.title.trim();
  if (typeof input.content === "string") output.content = input.content;
  if (typeof input.excerpt === "string") output.excerpt = input.excerpt;
  if (typeof input.coverImage === "string") output.coverImage = input.coverImage.trim();
  if (typeof input.author === "string") output.author = input.author.trim();
  if (typeof input.metaTitle === "string") output.metaTitle = input.metaTitle;
  if (typeof input.metaDescription === "string") output.metaDescription = input.metaDescription;
  if (Array.isArray(input.tags)) output.tags = normalizeStringArray(input.tags);
  if (typeof input.isPublished === "boolean") output.isPublished = input.isPublished;
  if (typeof input.aiGenerated === "boolean") output.aiGenerated = input.aiGenerated;
  return output;
}

async function getBlogPostOverrides(): Promise<StoredBlogPostMap> {
  return readJsonFile<StoredBlogPostMap>(BLOG_POST_OVERRIDES_FILE, {});
}

async function saveBlogPostOverrides(value: StoredBlogPostMap): Promise<void> {
  await writeJsonFile(BLOG_POST_OVERRIDES_FILE, value);
}

async function getDeletedBlogPostIds(): Promise<string[]> {
  return readJsonFile<string[]>(BLOG_POST_DELETED_FILE, []);
}

async function saveDeletedBlogPostIds(ids: string[]): Promise<void> {
  await writeJsonFile(BLOG_POST_DELETED_FILE, ids);
}

export async function getEffectiveBlogPosts(): Promise<BlogPost[]> {
  const [overrides, deletedIds] = await Promise.all([
    getBlogPostOverrides(),
    getDeletedBlogPostIds(),
  ]);
  const deletedSet = new Set(deletedIds);
  const map = new Map<string, BlogPost>();

  for (const post of baseBlogPosts) {
    if (!deletedSet.has(post.id)) {
      map.set(post.id, post);
    }
  }

  for (const [id, post] of Object.entries(overrides)) {
    if (!deletedSet.has(id)) {
      map.set(id, post);
    }
  }

  return Array.from(map.values()).sort(
    (a, b) =>
      new Date(b.publishedAt ?? b.createdAt).getTime() -
      new Date(a.publishedAt ?? a.createdAt).getTime()
  );
}

export async function updateBlogPostById(
  id: string,
  patch: Record<string, unknown>
): Promise<BlogPost | null> {
  const all = await getEffectiveBlogPosts();
  const current = all.find((entry) => entry.id === id);
  if (!current) return null;

  const sanitized = sanitizeBlogPostPatch(patch);
  const nextIsPublished =
    typeof sanitized.isPublished === "boolean"
      ? sanitized.isPublished
      : current.isPublished;

  const next: BlogPost = {
    ...current,
    ...sanitized,
    id: current.id,
    createdAt: current.createdAt,
    publishedAt: nextIsPublished
      ? current.publishedAt ?? new Date().toISOString()
      : undefined,
    updatedAt: new Date().toISOString(),
  };

  const overrides = await getBlogPostOverrides();
  overrides[id] = next;
  await saveBlogPostOverrides(overrides);
  return next;
}

export async function deleteBlogPostById(id: string): Promise<boolean> {
  const all = await getEffectiveBlogPosts();
  const exists = all.some((entry) => entry.id === id);
  if (!exists) return false;

  const [overrides, deletedIds] = await Promise.all([
    getBlogPostOverrides(),
    getDeletedBlogPostIds(),
  ]);

  delete overrides[id];
  const nextDeleted = Array.from(new Set([...deletedIds, id]));
  await Promise.all([saveBlogPostOverrides(overrides), saveDeletedBlogPostIds(nextDeleted)]);
  return true;
}
