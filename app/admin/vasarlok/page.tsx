import { Mail, Phone, CalendarDays } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { StatusChip } from "@/app/admin/_components/StatusChip";
import { getUsers } from "@/lib/server/users";
import { getOrders } from "@/lib/server/orders";

function formatDate(input: string): string {
  return new Intl.DateTimeFormat("hu-HU").format(new Date(input));
}

export default async function AdminVasarlokPage() {
  const [users, orders] = await Promise.all([getUsers(), getOrders()]);
  const customers = users.map((user) => {
    const userOrders = orders.filter((order) => order.guestEmail?.toLowerCase() === user.email.toLowerCase());
    const totalSpent = userOrders.reduce((sum, order) => sum + order.total, 0);
    const lastOrderDate = userOrders
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]?.createdAt;
    return {
      id: user.id,
      name: user.name || "Névtelen vásárló",
      email: user.email,
      phone: user.phone || "-",
      orders: userOrders.length,
      totalSpent,
      lastOrderDate: lastOrderDate ? formatDate(lastOrderDate) : formatDate(user.createdAt),
    };
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-extrabold text-neutral-dark tracking-tight">Vásárlók</h1>
        <p className="text-sm text-neutral-medium">{customers.length} aktív vásárló</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px]">
            <thead className="sticky top-0 z-10 bg-gray-50/90 border-b border-gray-100 backdrop-blur-sm">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-neutral-medium uppercase tracking-wider">Vásárló</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-neutral-medium uppercase tracking-wider">Email</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-neutral-medium uppercase tracking-wider">Telefon</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-neutral-medium uppercase tracking-wider">Utolsó rendelés</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-neutral-medium uppercase tracking-wider">Rendelések</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-neutral-medium uppercase tracking-wider">Költés</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-neutral-medium uppercase tracking-wider">Státusz</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {customers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-4 py-3.5">
                    <div>
                      <p className="text-sm font-bold text-neutral-dark">{customer.name}</p>
                      <p className="text-xs text-neutral-medium">{customer.id}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center gap-1.5 text-sm text-neutral-dark">
                      <Mail className="size-3.5 text-primary" />
                      {customer.email}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center gap-1.5 text-sm text-neutral-dark">
                      <Phone className="size-3.5 text-primary" />
                      {customer.phone}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center gap-1.5 text-sm text-neutral-medium">
                      <CalendarDays className="size-3.5 text-primary" />
                      {customer.lastOrderDate}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right text-sm font-bold text-neutral-dark">{customer.orders}</td>
                  <td className="px-4 py-3.5 text-right text-sm font-extrabold text-primary">{formatPrice(customer.totalSpent)}</td>
                  <td className="px-4 py-3.5 text-right">
                    <StatusChip label="Aktív" tone="success" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
