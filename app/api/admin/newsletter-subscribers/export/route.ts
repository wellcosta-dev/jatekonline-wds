import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/api-auth";
import { getNewsletterSubscribers } from "@/lib/server/newsletter";

function toCsvValue(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}

export async function GET(request: NextRequest) {
  try {
    const unauthorized = requireAdmin(request);
    if (unauthorized) return unauthorized;
    const subscribers = await getNewsletterSubscribers();
    const rows = [
      ["id", "email", "name", "source", "isActive", "createdAt"],
      ...subscribers.map((item) => [
        item.id,
        item.email,
        item.name ?? "",
        item.source,
        String(item.isActive),
        item.createdAt,
      ]),
    ];
    const csv = rows.map((row) => row.map(toCsvValue).join(",")).join("\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=\"newsletter-subscribers.csv\"",
      },
    });
  } catch (error) {
    console.error("GET /api/admin/newsletter-subscribers/export error:", error);
    return NextResponse.json({ error: "Nem sikerült exportálni a feliratkozókat." }, { status: 500 });
  }
}

