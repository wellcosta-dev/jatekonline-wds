import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/api-auth";
import { getNewsletterSubscribers } from "@/lib/server/newsletter";

export async function GET(request: NextRequest) {
  try {
    const unauthorized = requireAdmin(request);
    if (unauthorized) return unauthorized;
    const subscribers = await getNewsletterSubscribers();
    return NextResponse.json({ subscribers });
  } catch (error) {
    console.error("GET /api/admin/newsletter-subscribers error:", error);
    return NextResponse.json({ error: "Nem sikerült betölteni a feliratkozókat." }, { status: 500 });
  }
}

