import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge, EmptyState, LinkButton, PageHeader, TableScroll } from "@/components/ui";
import { formatDate, formatPeso } from "@/lib/format";
import { StatusSelect } from "./StatusSelect";
import { DeleteButton } from "./DeleteButton";

export default async function SalesPage() {
  const supabase = await createClient();
  const { data: sales } = await supabase
    .from("sales")
    .select("*, customers(name), products(name)")
    .order("sale_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div>
      <PageHeader
        title="Sales Log"
        subtitle="Lahat ng benta at order — in-store, Facebook, TikTok"
        action={<LinkButton href="/sales/new">+ Bagong Benta</LinkButton>}
      />

      {!sales || sales.length === 0 ? (
        <EmptyState title="Wala pang benta na naka-log" action={<LinkButton href="/sales/new">+ Bagong Benta</LinkButton>} />
      ) : (
        <TableScroll>
          <table className="w-full min-w-[1080px] text-sm">
            <thead>
              <tr className="border-b border-sibol-green/10 text-left text-sibol-green/60">
                <th className="px-4 py-3 font-bold">Petsa</th>
                <th className="px-4 py-3 font-bold">Customer</th>
                <th className="px-4 py-3 font-bold">Produkto</th>
                <th className="px-4 py-3 font-bold">Qty</th>
                <th className="px-4 py-3 font-bold">Total</th>
                <th className="px-4 py-3 font-bold">Payment</th>
                <th className="px-4 py-3 font-bold">Source</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-4 py-3 font-bold">Delivery</th>
                <th className="px-4 py-3 font-bold" />
              </tr>
            </thead>
            <tbody>
              {sales.map((s) => (
                <tr key={s.id} className="border-b border-sibol-green/5 last:border-0">
                  <td className="px-4 py-3">{formatDate(s.sale_date)}</td>
                  <td className="px-4 py-3">
                    {s.customer_id ? (
                      <Link href={`/customers/${s.customer_id}`} className="font-bold hover:underline">
                        {(s.customers as unknown as { name: string } | null)?.name ?? "—"}
                      </Link>
                    ) : (
                      <span className="text-sibol-green/50">Walk-in</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-bold">{(s.products as unknown as { name: string } | null)?.name ?? "—"}</td>
                  <td className="px-4 py-3">
                    {s.qty} {s.unit}
                  </td>
                  <td className="px-4 py-3 font-bold">{formatPeso(s.total_sale)}</td>
                  <td className="px-4 py-3">{s.payment_method}</td>
                  <td className="px-4 py-3">{s.order_source}</td>
                  <td className="px-4 py-3">
                    <StatusSelect id={s.id} status={s.order_status} />
                  </td>
                  <td className="px-4 py-3">
                    {s.is_delivery ? <Badge tone="gold">Delivery</Badge> : <Badge tone="gray">Pickup</Badge>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Link href={`/sales/${s.id}/edit`} className="font-bold text-butil-gold hover:underline">
                        Edit
                      </Link>
                      <DeleteButton id={s.id} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableScroll>
      )}
    </div>
  );
}
