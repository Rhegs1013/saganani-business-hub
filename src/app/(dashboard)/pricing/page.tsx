import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge, Card, EmptyState, LinkButton, PageHeader, TableScroll } from "@/components/ui";
import { formatPeso } from "@/lib/format";
import { ToggleActiveButton } from "./ToggleActiveButton";

export default async function PricingPage() {
  const supabase = await createClient();
  const { data: products } = await supabase
    .from("products")
    .select(
      "id, name, unit, unit_cost, markup_pct, retail_price, margin_amount, margin_pct, suki_price, suki_margin_pct, is_active, barcode, categories(name, is_active)",
    )
    .order("name");

  const grouped = new Map<string, typeof products>();
  for (const p of products ?? []) {
    const categoryName = (p.categories as unknown as { name: string } | null)?.name ?? "Uncategorized";
    if (!grouped.has(categoryName)) grouped.set(categoryName, []);
    grouped.get(categoryName)!.push(p);
  }

  return (
    <div>
      <PageHeader
        title="Pricing Master"
        subtitle="Unit cost, markup, at retail price ng bawat produkto"
        action={<LinkButton href="/pricing/new">+ Bagong Produkto</LinkButton>}
      />

      {!products || products.length === 0 ? (
        <EmptyState
          title="Wala pang produkto"
          description="Add your first product to start pricing."
          action={<LinkButton href="/pricing/new">+ Bagong Produkto</LinkButton>}
        />
      ) : (
        <div className="flex flex-col gap-8">
          {[...grouped.entries()].map(([categoryName, items]) => (
            <div key={categoryName}>
              <h2 className="mb-2 font-extrabold text-lg text-sibol-green">{categoryName}</h2>
              <TableScroll>
                <table className="w-full min-w-[880px] text-sm">
                  <thead>
                    <tr className="border-b border-sibol-green/10 text-left text-sibol-green/60">
                      <th className="px-4 py-3 font-bold">Produkto</th>
                      <th className="px-4 py-3 font-bold">Barcode</th>
                      <th className="px-4 py-3 font-bold">Unit</th>
                      <th className="px-4 py-3 font-bold">Unit Cost</th>
                      <th className="px-4 py-3 font-bold">Markup %</th>
                      <th className="px-4 py-3 font-bold">Retail Price</th>
                      <th className="px-4 py-3 font-bold">Margin</th>
                      <th className="px-4 py-3 font-bold">Suki Price</th>
                      <th className="px-4 py-3 font-bold">Suki Margin %</th>
                      <th className="px-4 py-3 font-bold">Status</th>
                      <th className="px-4 py-3 font-bold" />
                    </tr>
                  </thead>
                  <tbody>
                    {items!.map((p) => (
                      <tr key={p.id} className="border-b border-sibol-green/5 last:border-0">
                        <td className="px-4 py-3 font-bold">{p.name}</td>
                        <td className="px-4 py-3 font-mono text-xs">{p.barcode ?? "—"}</td>
                        <td className="px-4 py-3">{p.unit}</td>
                        <td className="px-4 py-3">{formatPeso(p.unit_cost)}</td>
                        <td className="px-4 py-3">{p.markup_pct}%</td>
                        <td className="px-4 py-3 font-bold">{formatPeso(p.retail_price)}</td>
                        <td className="px-4 py-3">
                          {formatPeso(p.margin_amount)} <span className="text-sibol-green/50">({p.margin_pct}%)</span>
                        </td>
                        <td className="px-4 py-3">{p.suki_price ? formatPeso(p.suki_price) : "—"}</td>
                        <td className="px-4 py-3">{p.suki_margin_pct !== null ? `${p.suki_margin_pct}%` : "—"}</td>
                        <td className="px-4 py-3">
                          <Badge tone={p.is_active ? "green" : "gray"}>{p.is_active ? "Active" : "Inactive"}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Link href={`/pricing/${p.id}/edit`} className="font-bold text-butil-gold hover:underline">
                              Edit
                            </Link>
                            <ToggleActiveButton id={p.id} isActive={p.is_active} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableScroll>
            </div>
          ))}
        </div>
      )}

      <Card className="mt-8 p-4 text-xs text-sibol-green/60">
        Retail Price, Margin, at Suki Margin % ay awtomatikong kinakalkula mula sa Unit Cost, Markup %, at Suki
        Price. I-edit lang ang mga ito para mag-update ang presyo.
      </Card>
    </div>
  );
}
