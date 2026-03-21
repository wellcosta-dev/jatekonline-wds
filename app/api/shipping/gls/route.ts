import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const apiBase = process.env.GLS_API_BASE_URL?.trim();
    const apiKey = process.env.GLS_API_KEY?.trim();
    if (!apiBase || !apiKey) {
      return NextResponse.json(
        { error: "A GLS API nincs konfigurálva." },
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
      return NextResponse.json({ error: "GLS tracking hiba." }, { status: 502 });
    }
    const payload = await upstream.json();
    return NextResponse.json(payload);
  } catch (error) {
    console.error("GET /api/shipping/gls error:", error);
    return NextResponse.json(
      { error: "Failed to fetch tracking" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const apiBase = process.env.GLS_API_BASE_URL?.trim();
    const apiKey = process.env.GLS_API_KEY?.trim();
    if (!apiBase || !apiKey) {
      return NextResponse.json(
        { error: "A GLS API nincs konfigurálva." },
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
      const contentType = upstream.headers.get("content-type")?.toLowerCase() ?? "";
      const details = contentType.includes("application/json")
        ? await upstream.json().catch(() => undefined)
        : await upstream.text().catch(() => undefined);
      return NextResponse.json(
        { error: "GLS címkekérés sikertelen.", details },
        { status: 502 }
      );
    }
    const contentType = upstream.headers.get("content-type")?.toLowerCase() ?? "";
    if (contentType.includes("application/json")) {
      const payload = await upstream.json();
      return NextResponse.json(payload);
    }

    const buffer = Buffer.from(await upstream.arrayBuffer());
    const base64 = buffer.toString("base64");
    return NextResponse.json({
      labelBase64: base64,
      labelContentType: contentType || "application/pdf",
    });
  } catch (error) {
    console.error("POST /api/shipping/gls error:", error);
    return NextResponse.json(
      { error: "Failed to create shipment" },
      { status: 500 }
    );
  }
}
