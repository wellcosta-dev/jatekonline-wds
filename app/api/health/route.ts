import { NextResponse } from "next/server";

export async function GET() {
  const checks = {
    stripeConfigured: Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET),
    authConfigured: Boolean(process.env.AUTH_SESSION_SECRET),
    databaseConfigured: Boolean(process.env.DATABASE_URL),
  };
  return NextResponse.json({
    ok: true,
    timestamp: new Date().toISOString(),
    checks,
  });
}

