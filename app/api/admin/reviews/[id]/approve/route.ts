import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/api-auth";
import { approveReview } from "@/lib/server/reviews";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const unauthorized = requireAdmin(request);
    if (unauthorized) return unauthorized;
    const { id } = await params;
    const review = await approveReview(id);
    return NextResponse.json({ review });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nem sikerült jóváhagyni a véleményt.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
