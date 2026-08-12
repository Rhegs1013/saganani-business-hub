import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge, EmptyState, LinkButton, PageHeader, TableScroll, statusTone } from "@/components/ui";
import { formatDate, formatPeso } from "@/lib/format";

export default async function CustomersPage() {
  const supabase = await createClient();
  const [{ data: customers }, { data: stats }] = await Promise.all([
    supabase.from("customers").select("id, name, contact_number, customer_type, lat").order("name"),
    supabase.from("customer_stats").select("customer_id, lifetime_spend, last_order_date, total_orders"),
  ]);
  const statsById = new Map((stats ?? []).map((s) => [s.customer_id, s]));

  return (
    <div>
      <PageHeader
        title="Mga Customer"
        subtitle="Customer database na may delivery location"
        action={<LinkButton href="/customers/new">+ Bagong Customer</LinkButton>}
      />

      {!customers || customers.length === 0 ? (
        <EmptyState
          title="Wala pang customer"
          action={<LinkButton href="/customers/new">+ Bagong Customer</LinkButton>}
        />
      ) : (
        <TableScroll>
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-sibol-green/10 text-left text-sibol-green/60">
                <th className="px-4 py-3 font-bold">Pangalan</th>
                <th className="px-4 py-3 font-bold">Contact</th>
                <th className="px-4 py-3 font-bold">Type</th>
                <th className="px-4 py-3 font-bold">Orders</th>
                <th className="px-4 py-3 font-bold">Lifetime Spend</th>
                <th className="px-4 py-3 font-bold">Last Order</th>
                <th className="px-4 py-3 font-bold">Pin</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => {
                const stats = statsById.get(c.id);
                return (
                  <tr key={c.id} className="border-b border-sibol-green/5 last:border-0">
                    <td className="px-4 py-3 font-bold">
                      <Link href={`/customers/${c.id}`} className="hover:underline">
                        {c.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{c.contact_number ?? "—"}</td>
                    <td className="px-4 py-3">
                      <Badge tone={statusTone(c.customer_type)}>{c.customer_type}</Badge>
                    </td>
                    <td className="px-4 py-3">{stats?.total_orders ?? 0}</td>
                    <td className="px-4 py-3">{formatPeso(stats?.lifetime_spend ?? 0)}</td>
                    <td className="px-4 py-3">{formatDate(stats?.last_order_date)}</td>
                    <td className="px-4 py-3">{c.lat != null ? "📍" : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableScroll>
      )}
    </div>
  );
}
