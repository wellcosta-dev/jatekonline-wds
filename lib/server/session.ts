import { createHmac, timingSafeEqual } from "node:crypto";

export type UserRole = "CUSTOMER" | "ADMIN";

export interface SessionUser {
  id: string;
  email: string;
  role: UserRole;
  name?: string;
}

interface SessionPayload extends SessionUser {
  exp: number;
}

const SESSION_COOKIE_NAME = "bo_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

function getSessionSecret(): string {
  return process.env.AUTH_SESSION_SECRET?.trim() || "dev-only-change-me";
}

function signPayload(encodedPayload: string): string {
  return createHmac("sha256", getSessionSecret()).update(encodedPayload).digest("base64url");
}

export function getSessionCookieName(): string {
  return SESSION_COOKIE_NAME;
}

export function createSessionToken(user: SessionUser): string {
  const payload: SessionPayload = {
    ...user,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = signPayload(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function verifySessionToken(token: string | undefined): SessionUser | null {
  if (!token) return null;
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return null;

  const expectedSignature = signPayload(encodedPayload);
  const providedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (providedBuffer.length !== expectedBuffer.length) return null;
  if (!timingSafeEqual(providedBuffer, expectedBuffer)) return null;

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as SessionPayload;
    if (!payload?.id || !payload.email || !payload.role || !payload.exp) return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return {
      id: payload.id,
      email: payload.email,
      role: payload.role,
      name: payload.name,
    };
  } catch {
    return null;
  }
}

