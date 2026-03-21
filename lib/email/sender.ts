import nodemailer from "nodemailer";
import type { EmailSettings, Order } from "@/types";
import { getEmailSettings } from "@/lib/email/settings";
import {
  renderAdminNewOrderTemplate,
  renderOrderConfirmationTemplate,
  renderOrderStatusUpdateTemplate,
} from "@/lib/email/templates";

function resolveOrderRecipientEmail(order: Order): string | null {
  if (order.guestEmail) return order.guestEmail;
  if (order.shippingAddress?.email) return order.shippingAddress.email;
  if (order.billingAddress?.email) return order.billingAddress.email;
  return null;
}

function hasSmtpConfig(settings: EmailSettings): boolean {
  return Boolean(settings.smtpHost && settings.smtpUser && settings.smtpPass && settings.fromEmail);
}

function buildTransport(settings: EmailSettings) {
  return nodemailer.createTransport({
    host: settings.smtpHost,
    port: settings.smtpPort,
    secure: settings.smtpSecure,
    auth: {
      user: settings.smtpUser,
      pass: settings.smtpPass,
    },
  });
}

async function sendWithTemplate(
  to: string,
  template: { subject: string; html: string; text: string },
  settings: EmailSettings
) {
  if (!hasSmtpConfig(settings)) {
    throw new Error("SMTP nincs megfelelően beállítva.");
  }
  const transport = buildTransport(settings);
  await transport.sendMail({
    from: `"${settings.fromName}" <${settings.fromEmail}>`,
    to,
    replyTo: settings.replyTo || undefined,
    subject: template.subject,
    text: template.text,
    html: template.html,
  });
}

export async function sendOrderConfirmationEmail(order: Order) {
  const settings = await getEmailSettings();
  const recipient = resolveOrderRecipientEmail(order);
  if (!settings.orderConfirmationEnabled || !recipient) return;
  await sendWithTemplate(recipient, renderOrderConfirmationTemplate(order), settings);
}

export async function sendOrderStatusUpdateEmail(order: Order) {
  const settings = await getEmailSettings();
  const recipient = resolveOrderRecipientEmail(order);
  if (!settings.orderStatusUpdateEnabled || !recipient) return;
  await sendWithTemplate(recipient, renderOrderStatusUpdateTemplate(order), settings);
}

export async function sendAdminNewOrderEmail(order: Order) {
  const settings = await getEmailSettings();
  if (!settings.adminNewOrderEnabled || !settings.adminNotificationEmail) return;
  await sendWithTemplate(
    settings.adminNotificationEmail,
    renderAdminNewOrderTemplate(order),
    settings
  );
}

export async function sendTestEmail(to: string) {
  const settings = await getEmailSettings();
  const html = `
    <div style="font-family:Inter,Arial,sans-serif;padding:24px;background:#f6f8fb;">
      <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:14px;padding:20px;">
        <h2 style="margin:0 0 8px;">BabyOnline email teszt</h2>
        <p style="margin:0;color:#475569;">Ha ezt látod, az SMTP beállítások rendben működnek.</p>
      </div>
    </div>
  `;
  await sendWithTemplate(
    to,
    { subject: "BabyOnline SMTP teszt", html, text: "BabyOnline SMTP teszt sikeres." },
    settings
  );
}

export async function sendCustomEmail(input: {
  to: string;
  subject: string;
  text: string;
  html: string;
}) {
  const settings = await getEmailSettings();
  await sendWithTemplate(
    input.to,
    { subject: input.subject, text: input.text, html: input.html },
    settings
  );
}
