import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const apiBase = process.env.POSTA_API_BASE_URL?.trim();
    const apiKey = process.env.POSTA_API_KEY?.trim();
    if (!apiBase || !apiKey) {
      return NextResponse.json(
        { error: "A Magyar Posta API nincs konfigurálva." },
        { status: 501 }
      );
    }
    const { searchParams } = new URL(request.url);
    const trackingId = searchParams.get("trackingId");

    if (!trackingId) {
      return NextResponse.json(
        { error: "trackingId query parameter is required" },
        { status: 400 }
      );
    }

    const upstream = await fetch(`${apiBase}/tracking/${encodeURIComponent(trackingId)}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: "no-store",
    });
    if (!upstream.ok) {
      return NextResponse.json({ error: "Tracking lekérdezés sikertelen." }, { status: 502 });
    }
    const payload = await upstream.json();
    return NextResponse.json(payload);
  } catch (error) {
    console.error("GET /api/shipping/magyar-posta error:", error);
    return NextResponse.json(
      { error: "Failed to fetch tracking" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const apiBase = process.env.POSTA_API_BASE_URL?.trim();
    const apiKey = process.env.POSTA_API_KEY?.trim();
    if (!apiBase || !apiKey) {
      return NextResponse.json(
        { error: "A Magyar Posta API nincs konfigurálva." },
        { status: 501 }
      );
    }
    const body = await request.json();
    const upstream = await fetch(`${apiBase}/shipments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });
    if (!upstream.ok) {
      return NextResponse.json({ error: "Címkegenerálás sikertelen." }, { status: 502 });
    }
    const payload = await upstream.json();
    return NextResponse.json(payload);
  } catch (error) {
    console.error("POST /api/shipping/magyar-posta error:", error);
    return NextResponse.json(
      { error: "Failed to create shipment" },
      { status: 500 }
    );
  }
}
