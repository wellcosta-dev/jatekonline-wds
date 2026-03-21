import { NextRequest, NextResponse } from "next/server";
import { getSessionCookieName, type SessionUser, verifySessionToken } from "@/lib/server/session";

export function getSessionUser(request: NextRequest): SessionUser | null {
  const token = request.cookies.get(getSessionCookieName())?.value;
  return verifySessionToken(token);
}

export function requireAdmin(request: NextRequest): NextResponse | null {
  const session = getSessionUser(request);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Nincs jogosultság." }, { status: 401 });
  }
  return null;
}

