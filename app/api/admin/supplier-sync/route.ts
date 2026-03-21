import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/api-auth";
import {
  getSupplierSyncStatus,
  maybeTriggerAutomaticSupplierSync,
  runSupplierSync,
} from "@/lib/server/supplier-sync";

type SyncRequestBody = {
  mode?: "test" | "full" | "single";
  limit?: number;
  productId?: string;
};

export async function GET(request: NextRequest) {
  try {
    const unauthorized = requireAdmin(request);
    if (unauthorized) return unauthorized;

    await maybeTriggerAutomaticSupplierSync();
    const status = await getSupplierSyncStatus();
    return NextResponse.json({ status });
  } catch (error) {
    console.error("GET /api/admin/supplier-sync error:", error);
    return NextResponse.json(
      { error: "Nem sikerült betölteni a beszállítói szinkron állapotot." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const unauthorized = requireAdmin(request);
    if (unauthorized) return unauthorized;

    const body = (await request.json().catch(() => ({}))) as SyncRequestBody;
    const mode = body.mode ?? "test";
    const summary = await runSupplierSync({
      mode,
      initiatedBy: "admin",
      limit: body.limit,
      productId: body.productId,
    });

    return NextResponse.json({ ok: true, summary });
  } catch (error) {
    console.error("POST /api/admin/supplier-sync error:", error);
    return NextResponse.json(
      { error: "Nem sikerült lefuttatni a beszállítói szinkront." },
      { status: 500 }
    );
  }
}
