import { NextRequest, NextResponse } from "next/server";
import { sendTestEmail } from "@/lib/email/sender";
import { requireAdmin } from "@/lib/server/api-auth";

export async function POST(request: NextRequest) {
  try {
    const unauthorized = requireAdmin(request);
    if (unauthorized) return unauthorized;
    const body = await request.json();
    const to = String(body.to ?? "").trim();
    if (!to) {
      return NextResponse.json({ error: "A teszt email cím kötelező" }, { status: 400 });
    }

    await sendTestEmail(to);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/admin/test-email error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Nem sikerült teszt emailt küldeni" },
      { status: 500 }
    );
  }
}
