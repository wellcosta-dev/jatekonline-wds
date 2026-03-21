import { NextRequest, NextResponse } from "next/server";
import { loginUser, registerUser } from "@/lib/server/users";
import { createSessionToken, getSessionCookieName } from "@/lib/server/session";
import {
  clearAuthAttempts,
  getAuthAttemptInfo,
  registerAuthFailure,
} from "@/lib/server/auth-rate-limit";

function withSessionCookie(
  request: NextRequest,
  response: NextResponse,
  user: { id: string; email: string; role?: "CUSTOMER" | "ADMIN"; name?: string }
) {
  const forwardedProto = request.headers.get("x-forwarded-proto")?.toLowerCase();
  const isSecureRequest = forwardedProto === "https" || request.nextUrl.protocol === "https:";
  const token = createSessionToken({
    id: user.id,
    email: user.email,
    role: user.role ?? "CUSTOMER",
    name: user.name,
  });
  response.cookies.set(getSessionCookieName(), token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isSecureRequest,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const mode = (body.mode as "login" | "register" | undefined) ?? "login";
    const loginTarget = (body.loginTarget as "customer" | "admin" | undefined) ?? "customer";
    const email = body.email?.trim();
    const password = body.password as string | undefined;
    const ip =
      request.headers.get("x-forwarded-for") ??
      request.headers.get("x-real-ip") ??
      "unknown";

    if (!email || !password) {
      return NextResponse.json(
        { error: "email and password are required" },
        { status: 400 }
      );
    }

    if (mode === "register") {
      const name = String(body.name ?? "").trim();
      if (name.length < 2) {
        return NextResponse.json(
          { error: "A név legalább 2 karakter legyen." },
          { status: 400 }
        );
      }
      const user = await registerUser({ name, email, password });
      const response = NextResponse.json({
        user,
        token: "session",
      });
      return withSessionCookie(request, response, user);
    }

    const attemptInfo = await getAuthAttemptInfo(ip, email, loginTarget);
    if (attemptInfo.blocked) {
      return NextResponse.json(
        {
          error: `Túl sok sikertelen próbálkozás. Próbáld újra ${attemptInfo.retryAfterSeconds} másodperc múlva.`,
        },
        { status: 429 }
      );
    }

    let user;
    try {
      user = await loginUser({ email, password });
    } catch {
      const failureInfo = await registerAuthFailure(ip, email, loginTarget);
      if (failureInfo.blocked) {
        return NextResponse.json(
          {
            error: `Túl sok sikertelen próbálkozás. Próbáld újra ${failureInfo.retryAfterSeconds} másodperc múlva.`,
          },
          { status: 429 }
        );
      }
      return NextResponse.json(
        { error: "Hibás email cím vagy jelszó." },
        { status: 400 }
      );
    }

    if (loginTarget === "admin" && user.role !== "ADMIN") {
      await registerAuthFailure(ip, email, "admin");
      return NextResponse.json(
        { error: "Ehhez az oldalhoz admin jogosultság szükséges." },
        { status: 403 }
      );
    }
    if (loginTarget === "customer" && user.role === "ADMIN") {
      return NextResponse.json(
        { error: "Admin belépéshez használd az admin login oldalt." },
        { status: 403 }
      );
    }
    await clearAuthAttempts(ip, email, loginTarget);

    const response = NextResponse.json({
      user,
      token: "session",
    });
    return withSessionCookie(request, response, user);
  } catch (error) {
    console.error("POST /api/auth error:", error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Hitelesítési hiba" },
      { status: 500 }
    );
  }
}
