import { NextRequest, NextResponse } from "next/server";
import { getLoyaltySettings } from "@/lib/loyalty/settings";
import { getLoyaltyBalance } from "@/lib/server/loyalty";

export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get("email")?.trim();
    const settings = await getLoyaltySettings();
    if (!email) {
      return NextResponse.json({
        balance: 0,
        settings,
      });
    }
    const balance = await getLoyaltyBalance(email);
    return NextResponse.json({
      balance: balance.points,
      settings,
    });
  } catch (error) {
    console.error("GET /api/loyalty/balance error:", error);
    return NextResponse.json({ error: "Nem sikerült lekérni a Babapont egyenleget." }, { status: 500 });
  }
}
