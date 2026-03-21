import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/api-auth";
import { deleteBlogPostById, updateBlogPostById } from "@/lib/server/blog-posts";

type RouteParams = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const unauthorized = requireAdmin(request);
    if (unauthorized) return unauthorized;

    const { id } = await params;
    const body = (await request.json()) as Record<string, unknown>;
    const post = await updateBlogPostById(id, body);

    if (!post) {
      return NextResponse.json({ error: "A cikk nem található." }, { status: 404 });
    }

    return NextResponse.json({ post });
  } catch (error) {
    console.error("PUT /api/admin/blog-posts/[id] error:", error);
    return NextResponse.json(
      { error: "Nem sikerült menteni a cikket." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const unauthorized = requireAdmin(request);
    if (unauthorized) return unauthorized;

    const { id } = await params;
    const deleted = await deleteBlogPostById(id);
    if (!deleted) {
      return NextResponse.json({ error: "A cikk nem található." }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/admin/blog-posts/[id] error:", error);
    return NextResponse.json(
      { error: "Nem sikerült törölni a cikket." },
      { status: 500 }
    );
  }
}
