import { NextRequest, NextResponse } from "next/server";
import { addNewsletterSubscriber } from "@/lib/server/newsletter";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body.email ?? "").trim();
    const name = body.name ? String(body.name) : undefined;
    const source = body.source ? String(body.source) : "web";
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Érvénytelen email cím." }, { status: 400 });
    }
    const subscriber = await addNewsletterSubscriber({ email, name, source });
    return NextResponse.json({ subscriber }, { status: 201 });
  } catch (error) {
    console.error("POST /api/newsletter error:", error);
    return NextResponse.json({ error: "A feliratkozás sikertelen." }, { status: 500 });
  }
}

