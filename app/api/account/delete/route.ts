import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/api-auth";
import { getSessionCookieName } from "@/lib/server/session";
import { deleteUserByEmail } from "@/lib/server/users";

export async function POST(request: NextRequest) {
  try {
    const session = getSessionUser(request);
    if (!session) {
      return NextResponse.json({ error: "Nincs aktív session." }, { status: 401 });
    }

    await deleteUserByEmail(session.email);

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
  } catch (error) {
    console.error("POST /api/account/delete error:", error);
    return NextResponse.json({ error: "A fiók törlése sikertelen." }, { status: 500 });
  }
}
