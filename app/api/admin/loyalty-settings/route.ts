import { NextRequest, NextResponse } from "next/server";
import { getLoyaltySettings, saveLoyaltySettings } from "@/lib/loyalty/settings";
import { requireAdmin } from "@/lib/server/api-auth";

export async function GET(request: NextRequest) {
  try {
    const unauthorized = requireAdmin(request);
    if (unauthorized) return unauthorized;
    const settings = await getLoyaltySettings();
    return NextResponse.json({ settings });
  } catch (error) {
    console.error("GET /api/admin/loyalty-settings error:", error);
    return NextResponse.json({ error: "Nem sikerült betölteni a Babapont beállításokat." }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const unauthorized = requireAdmin(request);
    if (unauthorized) return unauthorized;
    const body = await request.json();
    const settings = await saveLoyaltySettings(body);
    return NextResponse.json({ settings });
  } catch (error) {
    console.error("PUT /api/admin/loyalty-settings error:", error);
    return NextResponse.json({ error: "Nem sikerült menteni a Babapont beállításokat." }, { status: 500 });
  }
}
