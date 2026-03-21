import { NextRequest, NextResponse } from "next/server";
import { runSupplierSync } from "@/lib/server/supplier-sync";

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.SUPPLIER_SYNC_CRON_SECRET?.trim();
  if (!secret) return false;

  const fromHeader =
    request.headers.get("x-cron-key")?.trim() ??
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  const fromQuery = request.nextUrl.searchParams.get("key")?.trim();
  return fromHeader === secret || fromQuery === secret;
}

export async function GET(request: NextRequest) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: "Nincs jogosultság." }, { status: 401 });
    }

    const summary = await runSupplierSync({
      mode: "full",
      initiatedBy: "cron",
    });

    return NextResponse.json({ ok: true, summary });
  } catch (error) {
    console.error("GET /api/cron/supplier-sync error:", error);
    return NextResponse.json(
      { error: "Nem sikerült futtatni az automatikus beszállítói szinkront." },
      { status: 500 }
    );
  }
}
