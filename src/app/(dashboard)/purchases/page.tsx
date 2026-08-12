import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge, EmptyState, LinkButton, PageHeader, TableScroll, statusTone } from "@/components/ui";
import { formatDate, formatPeso } from "@/lib/format";
import { DeleteButton } from "./DeleteButton";

export default async function PurchasesPage() {
  const supabase = await createClient();
  const { data: purchases } = await supabase
    .from("purchases")
    .select("*, suppliers(name), products(name)")
    .order("purchase_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div>
      <PageHeader
        title="Purchases Log"
        subtitle="Binili mula sa suppliers — nagpapakita rin sa Inventory at COGS"
        action={<LinkButton href="/purchases/new">+ Bagong Binili</LinkButton>}
      />

      {!purchases || purchases.length === 0 ? (
        <EmptyState
          title="Wala pang binili na naka-log"
          action={<LinkButton href="/purchases/new">+ Bagong Binili</LinkButton>}
        />
      ) : (
        <TableScroll>
          <table className="w-full min-w-[980px] text-sm">
            <thead>
              <tr className="border-b border-sibol-green/10 text-left text-sibol-green/60">
                <th className="px-4 py-3 font-bold">Petsa</th>
                <th className="px-4 py-3 font-bold">Supplier</th>
                <th className="px-4 py-3 font-bold">Produkto</th>
                <th className="px-4 py-3 font-bold">Qty</th>
                <th className="px-4 py-3 font-bold">Unit Cost</th>
                <th className="px-4 py-3 font-bold">Total Cost</th>
                <th className="px-4 py-3 font-bold">Payment</th>
                <th className="px-4 py-3 font-bold" />
              </tr>
            </thead>
            <tbody>
              {purchases.map((p) => (
                <tr key={p.id} className="border-b border-sibol-green/5 last:border-0">
                  <td className="px-4 py-3">{formatDate(p.purchase_date)}</td>
                  <td className="px-4 py-3">{(p.suppliers as unknown as { name: string } | null)?.name ?? "—"}</td>
                  <td className="px-4 py-3 font-bold">
                    {(p.products as unknown as { name: string } | null)?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    {p.qty} {p.unit}
                  </td>
                  <td className="px-4 py-3">{formatPeso(p.unit_cost)}</td>
                  <td className="px-4 py-3 font-bold">{formatPeso(p.total_cost)}</td>
                  <td className="px-4 py-3">
                    <Badge tone={statusTone(p.payment_status)}>{p.payment_status}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Link href={`/purchases/${p.id}/edit`} className="font-bold text-butil-gold hover:underline">
                        Edit
                      </Link>
                      <DeleteButton id={p.id} />
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
