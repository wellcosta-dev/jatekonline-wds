import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/api-auth";
import {
  getNotificationSettings,
  saveNotificationSettings,
} from "@/lib/server/notification-settings";

export async function GET(request: NextRequest) {
  try {
    const unauthorized = requireAdmin(request);
    if (unauthorized) return unauthorized;
    const settings = await getNotificationSettings();
    return NextResponse.json({ settings });
  } catch (error) {
    console.error("GET /api/admin/notification-settings error:", error);
    return NextResponse.json(
      { error: "Nem sikerült betölteni az értesítési beállításokat." },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const unauthorized = requireAdmin(request);
    if (unauthorized) return unauthorized;
    const body = (await request.json()) as Partial<{
      newOrderNotification: boolean;
      lowStockAlert: boolean;
      weeklySummary: boolean;
      aiAgentAlert: boolean;
    }>;

    const settings = await saveNotificationSettings(body);
    return NextResponse.json({ settings });
  } catch (error) {
    console.error("PUT /api/admin/notification-settings error:", error);
    return NextResponse.json(
      { error: "Nem sikerült menteni az értesítési beállításokat." },
      { status: 500 }
    );
  }
}
