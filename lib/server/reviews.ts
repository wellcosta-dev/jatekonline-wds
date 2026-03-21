import { readJsonFile, writeJsonFile } from "@/lib/server/storage";

const REVIEWS_FILE = "reviews.json";
const REVIEW_COOLDOWN_MS = 24 * 60 * 60 * 1000;

export type ReviewStatus = "PENDING" | "APPROVED";

export interface StoredReview {
  id: string;
  productId: string;
  userId: string;
  userEmail: string;
  authorName: string;
  rating: number;
  content: string;
  status: ReviewStatus;
  createdAt: string;
  updatedAt: string;
}

function normalizeText(value: string): string {
  return value.trim();
}

function sortByNewest(items: StoredReview[]): StoredReview[] {
  return [...items].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

async function getAllReviews(): Promise<StoredReview[]> {
  const reviews = await readJsonFile<StoredReview[]>(REVIEWS_FILE, []);
  return sortByNewest(reviews);
}

async function saveAllReviews(reviews: StoredReview[]): Promise<void> {
  await writeJsonFile(REVIEWS_FILE, reviews);
}

export async function getApprovedReviewsByProduct(productId: string): Promise<StoredReview[]> {
  const reviews = await getAllReviews();
  return reviews.filter((item) => item.productId === productId && item.status === "APPROVED");
}

export async function getAdminReviews(): Promise<StoredReview[]> {
  return getAllReviews();
}

export async function getReviewCooldownMs(userId: string, productId: string): Promise<number> {
  const reviews = await getAllReviews();
  const latest = reviews.find(
    (entry) => entry.userId === userId && entry.productId === productId
  );
  if (!latest) return 0;
  const nextAllowedAt = new Date(latest.createdAt).getTime() + REVIEW_COOLDOWN_MS;
  return Math.max(0, nextAllowedAt - Date.now());
}

export async function submitPendingReview(input: {
  productId: string;
  userId: string;
  userEmail: string;
  authorName: string;
  rating: number;
  content: string;
}): Promise<StoredReview> {
  const productId = normalizeText(input.productId);
  const authorName = normalizeText(input.authorName);
  const content = normalizeText(input.content);
  const rating = Math.max(1, Math.min(5, Math.round(Number(input.rating))));

  if (!productId) throw new Error("A termék azonosítója hiányzik.");
  if (!input.userId) throw new Error("Felhasználó azonosító hiányzik.");
  if (!authorName || authorName.length < 2) throw new Error("A név túl rövid.");
  if (!content || content.length < 8) throw new Error("A vélemény túl rövid.");

  const cooldownMs = await getReviewCooldownMs(input.userId, productId);
  if (cooldownMs > 0) {
    const waitHours = Math.ceil(cooldownMs / (60 * 60 * 1000));
    throw new Error(`24 órán belül csak egy vélemény küldhető. Kérlek próbáld újra ${waitHours} óra múlva.`);
  }

  const now = new Date().toISOString();
  const review: StoredReview = {
    id: `review-${Date.now()}`,
    productId,
    userId: input.userId,
    userEmail: input.userEmail.toLowerCase(),
    authorName,
    rating,
    content,
    status: "PENDING",
    createdAt: now,
    updatedAt: now,
  };

  const current = await getAllReviews();
  await saveAllReviews([review, ...current]);
  return review;
}

export async function approveReview(reviewId: string): Promise<StoredReview> {
  const reviews = await getAllReviews();
  const index = reviews.findIndex((entry) => entry.id === reviewId);
  if (index < 0) {
    throw new Error("A vélemény nem található.");
  }
  const next: StoredReview = {
    ...reviews[index],
    status: "APPROVED",
    updatedAt: new Date().toISOString(),
  };
  reviews[index] = next;
  await saveAllReviews(reviews);
  return next;
}
