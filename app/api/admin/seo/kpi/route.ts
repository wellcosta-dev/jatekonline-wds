import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/api-auth";
import { getOrders } from "@/lib/server/orders";

function isWithinDays(dateIso: string, days: number): boolean {
  const ts = Date.parse(dateIso);
  if (!Number.isFinite(ts)) return false;
  return Date.now() - ts <= days * 24 * 60 * 60 * 1000;
}

export async function GET(request: NextRequest) {
  try {
    const unauthorized = requireAdmin(request);
    if (unauthorized) return unauthorized;

    const orders = await getOrders();
    const paidOrders = orders.filter((order) => order.paymentStatus === "PAID");
    const paid7d = paidOrders.filter((order) => isWithinDays(order.createdAt, 7));
    const paid14d = paidOrders.filter((order) => isWithinDays(order.createdAt, 14));
    const all7d = orders.filter((order) => isWithinDays(order.createdAt, 7));

    const revenue7d = paid7d.reduce((sum, order) => sum + Number(order.total || 0), 0);
    const revenue14d = paid14d.reduce((sum, order) => sum + Number(order.total || 0), 0);
    const aov7d = paid7d.length > 0 ? revenue7d / paid7d.length : 0;

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      windows: {
        days7: {
          totalOrders: all7d.length,
          paidOrders: paid7d.length,
          revenue: Math.round(revenue7d),
          averageOrderValue: Math.round(aov7d),
        },
        days14: {
          paidOrders: paid14d.length,
          revenue: Math.round(revenue14d),
        },
      },
      notes: [
        "Search Console query/page KPI-kat a GSC feluleten kell nezni (organic clicks, CTR, avg position).",
        "Merchant feed hibakat a Google Merchant Center Diagnostics reszben kovessetek.",
      ],
    });
  } catch (error) {
    console.error("GET /api/admin/seo/kpi error:", error);
    return NextResponse.json(
      { error: "Nem sikerult lekerdezni az SEO KPI adatokat." },
      { status: 500 }
    );
  }
}
