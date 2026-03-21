import { NextRequest, NextResponse } from "next/server";
import { getSessionCookieName } from "@/lib/server/session";

export async function POST(request: NextRequest) {
  const forwardedProto = request.headers.get("x-forwarded-proto")?.toLowerCase();
  const isSecureRequest = forwardedProto === "https" || request.nextUrl.protocol === "https:";
  const response = NextResponse.json({ ok: true });
  response.cookies.set(getSessionCookieName(), "", {
    httpOnly: true,
    sameSite: "lax",
    secure: isSecureRequest,
    path: "/",
    maxAge: 0,
  });
  return response;
}

