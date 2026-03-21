import { NextRequest, NextResponse } from "next/server";
import { getEmailSettings } from "@/lib/email/settings";
import { sendCustomEmail } from "@/lib/email/sender";

type ContactPayload = {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
};

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ContactPayload;
    const name = clean(body.name);
    const email = clean(body.email);
    const subject = clean(body.subject);
    const message = clean(body.message);

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: "Minden kötelező mezőt tölts ki." },
        { status: 400 }
      );
    }
    if (!email.includes("@")) {
      return NextResponse.json(
        { error: "Érvénytelen email cím." },
        { status: 400 }
      );
    }

    const settings = await getEmailSettings();
    const recipient = settings.adminNotificationEmail || settings.fromEmail;
    if (!recipient) {
      return NextResponse.json(
        { error: "A kapcsolatfelvétel jelenleg nem elérhető." },
        { status: 503 }
      );
    }

    const safeSubject = subject.replace(/\r?\n/g, " ").slice(0, 160);
    const text = [
      "Új kapcsolatfelvételi üzenet érkezett.",
      "",
      `Név: ${name}`,
      `Email: ${email}`,
      `Tárgy: ${safeSubject}`,
      "",
      "Üzenet:",
      message,
    ].join("\n");

    const html = `
      <div style="font-family:Inter,Arial,sans-serif;padding:16px;background:#f6f8fb;">
        <div style="max-width:640px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:20px;">
          <h2 style="margin:0 0 12px;">Új kapcsolatfelvételi üzenet</h2>
          <p style="margin:0 0 4px;"><strong>Név:</strong> ${name}</p>
          <p style="margin:0 0 4px;"><strong>Email:</strong> ${email}</p>
          <p style="margin:0 0 12px;"><strong>Tárgy:</strong> ${safeSubject}</p>
          <div style="padding:12px;border:1px solid #e5e7eb;border-radius:8px;white-space:pre-wrap;">${message}</div>
        </div>
      </div>
    `;

    await sendCustomEmail({
      to: recipient,
      subject: `Kapcsolat: ${safeSubject}`,
      text,
      html,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/contact error:", error);
    return NextResponse.json(
      { error: "Az üzenet küldése sikertelen." },
      { status: 500 }
    );
  }
}
