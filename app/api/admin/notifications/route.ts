import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/api-auth";
import {
  getAdminNotifications,
  markAllAdminNotificationsRead,
} from "@/lib/server/admin-notifications";

export async function GET(request: NextRequest) {
  try {
    const unauthorized = requireAdmin(request);
    if (unauthorized) return unauthorized;
    const notifications = await getAdminNotifications();
    return NextResponse.json({ notifications });
  } catch (error) {
    console.error("GET /api/admin/notifications error:", error);
    return NextResponse.json(
      { error: "Nem sikerült betölteni az értesítéseket." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const unauthorized = requireAdmin(request);
    if (unauthorized) return unauthorized;
    const body = (await request.json()) as { action?: string };
    if (body.action === "mark_all_read") {
      await markAllAdminNotificationsRead();
      const notifications = await getAdminNotifications();
      return NextResponse.json({ notifications });
    }
    return NextResponse.json({ error: "Ismeretlen művelet." }, { status: 400 });
  } catch (error) {
    console.error("POST /api/admin/notifications error:", error);
    return NextResponse.json(
      { error: "Nem sikerült frissíteni az értesítéseket." },
      { status: 500 }
    );
  }
}
