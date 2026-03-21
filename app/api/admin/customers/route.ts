import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/api-auth";
import { getUsers } from "@/lib/server/users";
import { getOrders } from "@/lib/server/orders";

export async function GET(request: NextRequest) {
  try {
    const unauthorized = requireAdmin(request);
    if (unauthorized) return unauthorized;

    const [users, orders] = await Promise.all([getUsers(), getOrders()]);
    const payload = users.map((user) => {
      const userOrders = orders.filter((order) => order.guestEmail?.toLowerCase() === user.email.toLowerCase());
      const totalSpent = userOrders.reduce((sum, order) => sum + order.total, 0);
      const lastOrder = userOrders
        .slice()
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
      return {
        id: user.id,
        name: user.name || "Névtelen vásárló",
        email: user.email,
        phone: user.phone || "",
        orders: userOrders.length,
        totalSpent,
        lastOrderDate: lastOrder?.createdAt || user.createdAt,
      };
    });
    return NextResponse.json({ customers: payload });
  } catch (error) {
    console.error("GET /api/admin/customers error:", error);
    return NextResponse.json({ error: "Nem sikerült betölteni a vásárlókat." }, { status: 500 });
  }
}

