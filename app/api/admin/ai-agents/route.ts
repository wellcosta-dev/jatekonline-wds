import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/api-auth";
import { getAiAgentsState } from "@/lib/server/ai-agents";

export async function GET(request: NextRequest) {
  try {
    const unauthorized = requireAdmin(request);
    if (unauthorized) return unauthorized;

    const state = await getAiAgentsState();
    return NextResponse.json(state);
  } catch (error) {
    console.error("GET /api/admin/ai-agents error:", error);
    return NextResponse.json(
      { error: "Nem sikerült betölteni az AI agent adatokat." },
      { status: 500 }
    );
  }
}
