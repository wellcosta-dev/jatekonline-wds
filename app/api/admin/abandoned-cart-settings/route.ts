import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/api-auth";
import {
  getAbandonedCartSettings,
  saveAbandonedCartSettings,
} from "@/lib/server/abandoned-carts";

export async function GET(request: NextRequest) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;
  const settings = await getAbandonedCartSettings();
  return NextResponse.json({ settings });
}

export async function PUT(request: NextRequest) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;
  const body = await request.json();
  const settings = await saveAbandonedCartSettings({
    enabled: body.enabled,
    inactivityMinutes: body.inactivityMinutes,
    reminderDelayMinutes: body.reminderDelayMinutes,
    maxReminders: body.maxReminders,
  });
  return NextResponse.json({ settings });
}
