import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/api-auth";
import { getEffectiveBlogPosts } from "@/lib/server/blog-posts";

export async function GET(request: NextRequest) {
  try {
    const unauthorized = requireAdmin(request);
    if (unauthorized) return unauthorized;

    const posts = await getEffectiveBlogPosts();
    return NextResponse.json({ posts });
  } catch (error) {
    console.error("GET /api/admin/blog-posts error:", error);
    return NextResponse.json(
      { error: "Nem sikerült betölteni a blog cikkeket." },
      { status: 500 }
    );
  }
}
