import { NextRequest, NextResponse } from "next/server";
import { getEmailSettings, getSafeEmailSettings, saveEmailSettings } from "@/lib/email/settings";
import { requireAdmin } from "@/lib/server/api-auth";

export async function GET(request: NextRequest) {
  try {
    const unauthorized = requireAdmin(request);
    if (unauthorized) return unauthorized;
    const settings = await getEmailSettings();
    return NextResponse.json({ settings: getSafeEmailSettings(settings) });
  } catch (error) {
    console.error("GET /api/admin/email-settings error:", error);
    return NextResponse.json({ error: "Nem sikerült betölteni a beállításokat" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const unauthorized = requireAdmin(request);
    if (unauthorized) return unauthorized;
    const body = await request.json();
    const current = await getEmailSettings();

    const next = await saveEmailSettings({
      smtpHost: body.smtpHost ?? current.smtpHost,
      smtpPort: body.smtpPort ?? current.smtpPort,
      smtpSecure: body.smtpSecure ?? current.smtpSecure,
      smtpUser: body.smtpUser ?? current.smtpUser,
      smtpPass: body.smtpPass && body.smtpPass !== "********" ? body.smtpPass : current.smtpPass,
      fromName: body.fromName ?? current.fromName,
      fromEmail: body.fromEmail ?? current.fromEmail,
      replyTo: body.replyTo ?? current.replyTo,
      orderConfirmationEnabled:
        body.orderConfirmationEnabled ?? current.orderConfirmationEnabled,
      orderStatusUpdateEnabled:
        body.orderStatusUpdateEnabled ?? current.orderStatusUpdateEnabled,
      adminNewOrderEnabled: body.adminNewOrderEnabled ?? current.adminNewOrderEnabled,
      adminNotificationEmail:
        body.adminNotificationEmail ?? current.adminNotificationEmail,
    });

    return NextResponse.json({ settings: getSafeEmailSettings(next) });
  } catch (error) {
    console.error("PUT /api/admin/email-settings error:", error);
    return NextResponse.json({ error: "Nem sikerült menteni a beállításokat" }, { status: 500 });
  }
}
