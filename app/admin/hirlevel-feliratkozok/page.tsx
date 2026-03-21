import { Mail, CalendarDays, UserRound, Download } from "lucide-react";
import { getNewsletterSubscribers } from "@/lib/server/newsletter";

function formatDate(input: string): string {
  return new Intl.DateTimeFormat("hu-HU").format(new Date(input));
}

export default async function AdminHirlevelFeliratkozokPage() {
  const subscribers = await getNewsletterSubscribers();
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-neutral-dark tracking-tight">Hírlevél feliratkozók</h1>
          <p className="text-sm text-neutral-medium">{subscribers.length} feliratkozó</p>
        </div>
        <a
          href="/api/admin/newsletter-subscribers/export"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-primary bg-primary/10 rounded-xl hover:bg-primary/20 transition-colors"
        >
          <Download className="size-3.5" />
          Export CSV
        </a>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px]">
            <thead className="sticky top-0 z-10 bg-gray-50/90 border-b border-gray-100 backdrop-blur-sm">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-neutral-medium uppercase tracking-wider">Név</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-neutral-medium uppercase tracking-wider">Email</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-neutral-medium uppercase tracking-wider">Forrás</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-neutral-medium uppercase tracking-wider">Dátum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {subscribers.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="inline-flex items-center gap-2 min-w-0">
                      <UserRound className="size-3.5 text-neutral-medium" />
                      <span className="text-sm font-semibold text-neutral-dark truncate">{item.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="inline-flex items-center gap-2 min-w-0">
                      <Mail className="size-3.5 text-primary" />
                      <span className="text-sm text-neutral-dark truncate">{item.email}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-sm text-neutral-medium">{item.source}</span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <span className="inline-flex items-center justify-end gap-1 text-sm text-neutral-medium">
                      <CalendarDays className="size-3.5" />
                      {formatDate(item.createdAt)}
                    </span>
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
