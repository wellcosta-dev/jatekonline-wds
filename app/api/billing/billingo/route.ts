import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.BILLINGO_API_KEY?.trim();
    const apiBase = process.env.BILLINGO_API_BASE_URL?.trim() || "https://api.billingo.hu/v3";
    if (!apiKey) {
      return NextResponse.json({ error: "A Billingo API nincs konfigurálva." }, { status: 501 });
    }
    const body = await request.json();
    const upstream = await fetch(`${apiBase}/documents`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
      body: JSON.stringify(body),
    });
    if (!upstream.ok) {
      return NextResponse.json({ error: "A számla létrehozása sikertelen." }, { status: 502 });
    }
    const payload = await upstream.json();
    return NextResponse.json(payload);
  } catch (error) {
    console.error("POST /api/billing/billingo error:", error);
    return NextResponse.json(
      { error: "Failed to create invoice" },
      { status: 500 }
    );
  }
}
