import type { Order } from "@/types";
import { formatPrice } from "@/lib/utils";
import { absoluteUrl } from "@/lib/seo";

export interface EmailTemplatePayload {
  subject: string;
  html: string;
  text: string;
}

function getCustomerEmail(order: Order): string {
  return order.shippingAddress.email ?? order.guestEmail ?? "-";
}

function getCustomerPhone(order: Order): string {
  return order.shippingAddress.phone ?? order.billingAddress.phone ?? "-";
}

function formatOrderDateHu(dateIso: string): string {
  const date = new Date(dateIso);
  if (Number.isNaN(date.getTime())) return dateIso;
  return new Intl.DateTimeFormat("hu-HU", {
    timeZone: "Europe/Budapest",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getPaymentMethodLabel(paymentMethod: string): string {
  switch (paymentMethod) {
    case "cod":
      return "Utánvét";
    case "card":
      return "Bankkártyás fizetés";
    case "transfer":
      return "Banki átutalás";
    default:
      return paymentMethod || "-";
  }
}

function getShippingMethodLabel(shippingMethod: string): string {
  switch (shippingMethod) {
    case "gls":
      return "GLS Házhozszállítás";
    case "gls-csomagautomata":
      return "GLS Csomagautomata";
    case "gls-csomagpont":
      return "GLS Csomagpont";
    case "magyar-posta":
      return "Magyar Posta";
    default:
      return shippingMethod || "-";
  }
}

function formatShippingAddress(order: Order): string {
  const shipping = order.shippingAddress;
  return `${shipping.postalCode} ${shipping.city}, ${shipping.street}, ${shipping.country}`;
}

function orderMetaBlock(order: Order): string {
  const rows = [
    ["Rendelés dátuma", `${formatOrderDateHu(order.createdAt)} (magyar idő)`],
    ["Megrendelő e-mail címe", getCustomerEmail(order)],
    ["Megrendelő telefonszáma", getCustomerPhone(order)],
    ["Szállítási cím", formatShippingAddress(order)],
    ["Szállítási mód", getShippingMethodLabel(order.shippingMethod)],
    ["Fizetési mód", getPaymentMethodLabel(order.paymentMethod)],
  ];

  return `
    <div style="border:1px solid #e5e7eb;border-radius:12px;padding:12px;background:#ffffff;margin-bottom:16px;">
      <div style="font-size:11px;color:#64748b;text-transform:uppercase;font-weight:700;letter-spacing:.04em;">Rendelés adatai</div>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:8px;">
        ${rows
          .map(
            ([label, value]) => `
          <tr>
            <td style="padding:4px 0;color:#64748b;font-size:13px;width:42%;vertical-align:top;">${label}</td>
            <td style="padding:4px 0;color:#0f172a;font-size:13px;font-weight:600;vertical-align:top;">${value}</td>
          </tr>
        `
          )
          .join("")}
      </table>
    </div>
  `;
}

function getCodFee(order: Order): number {
  if (order.paymentMethod !== "cod") return 0;
  const baseTotal =
    order.subtotal - order.discount + order.shippingPrice - (order.loyaltyDiscount ?? 0);
  const fee = order.total - baseTotal;
  return fee > 0 ? fee : 0;
}

function baseTemplate(params: { title: string; intro: string; contentHtml: string }) {
  return `
  <div style="margin:0;padding:24px;background:#f6f8fb;font-family:Inter,Arial,sans-serif;color:#0f172a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;">
      <tr>
        <td style="padding:22px 24px;background:linear-gradient(120deg,#009dc7,#0ebbe4);color:#ffffff;">
          <div style="font-weight:800;font-size:20px;letter-spacing:-0.02em;">BabyOnline.hu</div>
          <div style="opacity:0.92;margin-top:6px;font-size:13px;">Rendelési értesítő</div>
        </td>
      </tr>
      <tr>
        <td style="padding:24px;">
          <h1 style="margin:0 0 8px;font-size:24px;line-height:1.2;letter-spacing:-0.03em;">${params.title}</h1>
          <p style="margin:0 0 16px;color:#475569;font-size:14px;line-height:1.6;">${params.intro}</p>
          ${params.contentHtml}
        </td>
      </tr>
      <tr>
        <td style="padding:16px 24px;background:#f8fafc;border-top:1px solid #e5e7eb;color:#64748b;font-size:12px;">
          Köszönjük, hogy a BabyOnline.hu-t választottad.
        </td>
      </tr>
    </table>
  </div>
  `;
}

function orderRows(order: Order): string {
  return order.items
    .map(
      (item) => `
      <tr>
        <td style="padding:10px 0;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
            <tr>
              <td style="width:56px;vertical-align:top;padding-right:10px;">
                <img src="${absoluteUrl(item.productImage || "/babyonline-logo.png")}" alt="${item.productName}" width="56" height="56" style="display:block;width:56px;height:56px;object-fit:cover;border-radius:8px;border:1px solid #e5e7eb;background:#f8fafc;" />
              </td>
              <td style="vertical-align:top;">
                <div style="color:#0f172a;font-size:14px;font-weight:700;line-height:1.35;">${item.productName}</div>
                <div style="margin-top:4px;color:#64748b;font-size:12px;">Mennyiség: ${item.quantity} · Egységár: ${formatPrice(item.price)}</div>
              </td>
            </tr>
          </table>
        </td>
        <td style="padding:10px 0;color:#0f172a;font-size:14px;text-align:right;font-weight:700;white-space:nowrap;vertical-align:top;">${formatPrice(
          item.price * item.quantity
        )}</td>
      </tr>
      `
    )
    .join("");
}

function addressBlock(order: Order): string {
  const shipping = order.shippingAddress;
  const billing = order.billingAddress;
  const sameBilling =
    shipping.name === billing.name &&
    shipping.street === billing.street &&
    shipping.city === billing.city &&
    shipping.postalCode === billing.postalCode &&
    shipping.country === billing.country;

  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:16px;">
      <tr>
        <td style="width:50%;vertical-align:top;padding-right:8px;">
          <div style="border:1px solid #e5e7eb;border-radius:12px;padding:12px;background:#f8fafc;height:100%;">
            <div style="font-size:11px;color:#64748b;text-transform:uppercase;font-weight:700;letter-spacing:.04em;">Vásárló adatai</div>
            <div style="margin-top:8px;font-size:13px;color:#0f172a;line-height:1.5;">
              <div><strong>${shipping.name}</strong></div>
              <div>${getCustomerEmail(order)}</div>
              <div>${getCustomerPhone(order)}</div>
            </div>
          </div>
        </td>
        <td style="width:50%;vertical-align:top;padding-left:8px;">
          <div style="border:1px solid #e5e7eb;border-radius:12px;padding:12px;background:#f8fafc;height:100%;">
            <div style="font-size:11px;color:#64748b;text-transform:uppercase;font-weight:700;letter-spacing:.04em;">Szállítási cím</div>
            <div style="margin-top:8px;font-size:13px;color:#0f172a;line-height:1.5;">
              <div><strong>${shipping.name}</strong></div>
              <div>${shipping.street}</div>
              <div>${shipping.postalCode} ${shipping.city}</div>
              <div>${shipping.country}</div>
            </div>
          </div>
        </td>
      </tr>
    </table>
    ${
      sameBilling
        ? ""
        : `
    <div style="border:1px solid #e5e7eb;border-radius:12px;padding:12px;background:#ffffff;margin-bottom:16px;">
      <div style="font-size:11px;color:#64748b;text-transform:uppercase;font-weight:700;letter-spacing:.04em;">Számlázási cím</div>
      <div style="margin-top:8px;font-size:13px;color:#0f172a;line-height:1.5;">
        <div><strong>${billing.name}</strong></div>
        <div>${billing.street}</div>
        <div>${billing.postalCode} ${billing.city}</div>
        <div>${billing.country}</div>
      </div>
    </div>`
    }
  `;
}

const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: "Függőben",
  CONFIRMED: "Megerősítve",
  PROCESSING: "Feldolgozás",
  SHIPPED: "Szállítás alatt",
  DELIVERED: "Kézbesítve",
  CANCELLED: "Törölve",
  REFUNDED: "Visszatérítve",
};

export function renderOrderConfirmationTemplate(order: Order): EmailTemplatePayload {
  const codFee = getCodFee(order);
  const contentHtml = `
    <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:12px;padding:12px 14px;margin-bottom:16px;">
      <div style="font-size:13px;color:#64748b;">Rendelésszám</div>
      <div style="font-size:18px;font-weight:800;color:#0f172a;letter-spacing:-0.02em;">${order.orderNumber}</div>
      <div style="margin-top:8px;font-size:13px;color:#334155;">Fizetési mód: <strong>${getPaymentMethodLabel(
        order.paymentMethod
      )}</strong></div>
      <div style="margin-top:2px;font-size:13px;color:#334155;">Szállítási mód: <strong>${getShippingMethodLabel(
        order.shippingMethod
      )}</strong></div>
    </div>
    ${orderMetaBlock(order)}
    ${addressBlock(order)}
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
      ${orderRows(order)}
      <tr><td colspan="2" style="padding:8px 0;border-top:1px solid #e5e7eb;"></td></tr>
      <tr>
        <td style="color:#475569;font-size:14px;padding:4px 0;">Részösszeg</td>
        <td style="text-align:right;color:#0f172a;font-size:14px;font-weight:700;padding:4px 0;">${formatPrice(order.subtotal)}</td>
      </tr>
      <tr>
        <td style="color:#475569;font-size:14px;padding:4px 0;">Szállítási díj</td>
        <td style="text-align:right;color:#0f172a;font-size:14px;font-weight:700;padding:4px 0;">${formatPrice(order.shippingPrice)}</td>
      </tr>
      ${
        codFee > 0
          ? `
      <tr>
        <td style="color:#475569;font-size:14px;padding:4px 0;">Utánvét kezelési díj</td>
        <td style="text-align:right;color:#0f172a;font-size:14px;font-weight:700;padding:4px 0;">${formatPrice(codFee)}</td>
      </tr>`
          : ""
      }
      ${
        order.discount > 0
          ? `
      <tr>
        <td style="color:#16a34a;font-size:14px;padding:4px 0;">Kedvezmény</td>
        <td style="text-align:right;color:#16a34a;font-size:14px;font-weight:700;padding:4px 0;">-${formatPrice(order.discount)}</td>
      </tr>`
          : ""
      }
      ${
        order.loyaltyDiscount
          ? `
      <tr>
        <td style="color:#0ea5e9;font-size:14px;padding:4px 0;">Babapont kedvezmény</td>
        <td style="text-align:right;color:#0ea5e9;font-size:14px;font-weight:700;padding:4px 0;">-${formatPrice(order.loyaltyDiscount)}</td>
      </tr>`
          : ""
      }
      <tr>
        <td style="color:#475569;font-size:14px;padding-top:6px;">Végösszeg</td>
        <td style="text-align:right;color:#0f172a;font-size:18px;font-weight:800;padding-top:6px;">${formatPrice(
          order.total
        )}</td>
      </tr>
    </table>
  `;

  return {
    subject: `Rendelés visszaigazolás - ${order.orderNumber}`,
    html: baseTemplate({
      title: "Sikeres rendelés",
      intro:
        "Megkaptuk a rendelésedet, hamarosan feldolgozzuk. Alább minden fontos részletet megtalálsz.",
      contentHtml,
    }),
    text: `Sikeres rendelés: ${order.orderNumber}. Rendelés dátuma (magyar idő): ${formatOrderDateHu(
      order.createdAt
    )}. Megrendelő e-mail: ${getCustomerEmail(order)}. Megrendelő telefonszám: ${getCustomerPhone(
      order
    )}. Szállítási cím: ${formatShippingAddress(order)}. Szállítási mód: ${getShippingMethodLabel(
      order.shippingMethod
    )}. Fizetési mód: ${getPaymentMethodLabel(order.paymentMethod)}. Részösszeg: ${order.subtotal} Ft, szállítás: ${
      order.shippingPrice
    } Ft, végösszeg: ${order.total} Ft.`,
  };
}

export function renderOrderStatusUpdateTemplate(order: Order): EmailTemplatePayload {
  const codFee = getCodFee(order);
  const statusLabel = ORDER_STATUS_LABELS[order.status] ?? order.status;
  const intro =
    order.status === "CANCELLED"
      ? "A rendelésed törölve lett. Ha kérdésed van, ügyfélszolgálatunk segít."
      : "A rendelésed állapota megváltozott. Az új státuszt lent találod.";
  const statusBoxColor =
    order.status === "CANCELLED"
      ? "background:#fff1f2;border:1px solid #fecdd3;color:#9f1239;"
      : "background:#eff6ff;border:1px solid #bfdbfe;color:#1e3a8a;";
  const contentHtml = `
    <div style="${statusBoxColor}border-radius:12px;padding:14px;margin-bottom:16px;">
      <div style="font-size:13px;color:#1d4ed8;">Rendelésszám</div>
      <div style="font-size:18px;font-weight:800;letter-spacing:-0.02em;">${order.orderNumber}</div>
      <div style="margin-top:8px;font-size:14px;">Új státusz: <strong>${statusLabel}</strong></div>
    </div>
    ${orderMetaBlock(order)}
    ${addressBlock(order)}
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
      ${orderRows(order)}
      <tr><td colspan="2" style="padding:8px 0;border-top:1px solid #e5e7eb;"></td></tr>
      <tr>
        <td style="color:#475569;font-size:14px;">Végösszeg</td>
        <td style="text-align:right;color:#0f172a;font-size:16px;font-weight:800;">${formatPrice(order.total)}</td>
      </tr>
      <tr>
        <td style="color:#475569;font-size:14px;">Szállítási díj</td>
        <td style="text-align:right;color:#0f172a;font-size:14px;font-weight:700;">${formatPrice(order.shippingPrice)}</td>
      </tr>
      ${
        codFee > 0
          ? `
      <tr>
        <td style="color:#475569;font-size:14px;">Utánvét kezelési díj</td>
        <td style="text-align:right;color:#0f172a;font-size:14px;font-weight:700;">${formatPrice(codFee)}</td>
      </tr>`
          : ""
      }
    </table>
  `;

  return {
    subject: `Rendelés frissítés - ${order.orderNumber}`,
    html: baseTemplate({
      title: "Rendelés státusz frissült",
      intro,
      contentHtml,
    }),
    text: `A rendelés státusza frissült: ${order.orderNumber} -> ${statusLabel}. Rendelés dátuma (magyar idő): ${formatOrderDateHu(
      order.createdAt
    )}. Megrendelő e-mail: ${getCustomerEmail(order)}. Megrendelő telefonszám: ${getCustomerPhone(
      order
    )}. Szállítási cím: ${formatShippingAddress(order)}. Szállítási mód: ${getShippingMethodLabel(
      order.shippingMethod
    )}. Fizetési mód: ${getPaymentMethodLabel(order.paymentMethod)}. Szállítás: ${
      order.shippingPrice
    } Ft. Végösszeg: ${order.total} Ft.`,
  };
}

export function renderAdminNewOrderTemplate(order: Order): EmailTemplatePayload {
  const codFee = getCodFee(order);
  const contentHtml = `
    <div style="background:#ecfeff;border:1px solid #bae6fd;border-radius:12px;padding:14px;margin-bottom:16px;">
      <div style="font-size:13px;color:#0369a1;">Új rendelés érkezett</div>
      <div style="font-size:18px;font-weight:800;color:#0c4a6e;letter-spacing:-0.02em;">${order.orderNumber}</div>
      <div style="margin-top:8px;font-size:14px;color:#0c4a6e;">Összeg: <strong>${formatPrice(
        order.total
      )}</strong></div>
    </div>
    ${orderMetaBlock(order)}
    ${addressBlock(order)}
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
      ${orderRows(order)}
      <tr><td colspan="2" style="padding:8px 0;border-top:1px solid #e5e7eb;"></td></tr>
      <tr>
        <td style="color:#475569;font-size:14px;">Szállítási díj</td>
        <td style="text-align:right;color:#0f172a;font-size:14px;font-weight:700;">${formatPrice(order.shippingPrice)}</td>
      </tr>
      ${
        codFee > 0
          ? `
      <tr>
        <td style="color:#475569;font-size:14px;">Utánvét kezelési díj</td>
        <td style="text-align:right;color:#0f172a;font-size:14px;font-weight:700;">${formatPrice(codFee)}</td>
      </tr>`
          : ""
      }
      <tr>
        <td style="color:#475569;font-size:14px;">Végösszeg</td>
        <td style="text-align:right;color:#0f172a;font-size:16px;font-weight:800;">${formatPrice(order.total)}</td>
      </tr>
    </table>
  `;

  return {
    subject: `Új rendelés érkezett - ${order.orderNumber}`,
    html: baseTemplate({
      title: "Új rendelés az adminban",
      intro: "Új rendelés érkezett a BabyOnline webshopból.",
      contentHtml,
    }),
    text: `Új rendelés: ${order.orderNumber}. Rendelés dátuma (magyar idő): ${formatOrderDateHu(
      order.createdAt
    )}. Megrendelő e-mail: ${getCustomerEmail(order)}. Megrendelő telefonszám: ${getCustomerPhone(
      order
    )}. Szállítási cím: ${formatShippingAddress(order)}. Szállítási mód: ${getShippingMethodLabel(
      order.shippingMethod
    )}. Fizetési mód: ${getPaymentMethodLabel(order.paymentMethod)}. Összeg: ${order.total} Ft.`,
  };
}
