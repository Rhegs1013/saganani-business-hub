import { createClient } from "@/lib/supabase/server";
import { Badge, Card, EmptyState, PageHeader, TableScroll } from "@/components/ui";
import { formatNumber, formatPeso } from "@/lib/format";
import { BeginningQtyEditor } from "./BeginningQtyEditor";

export default async function InventoryPage() {
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("inventory_status")
    .select("*")
    .eq("is_active", true)
    .order("category_name")
    .order("product_name");

  const grouped = new Map<string, NonNullable<typeof rows>>();
  for (const r of rows ?? []) {
    if (!grouped.has(r.category_name)) grouped.set(r.category_name, []);
    grouped.get(r.category_name)!.push(r);
  }

  const totalValue = (rows ?? []).reduce((sum, r) => sum + (r.ending_value ?? 0), 0);
  const lowStockCount = (rows ?? []).filter((r) => r.is_low_stock).length;

  return (
    <div>
      <PageHeader title="Inventory" subtitle="Beginning + Binili − Nabenta = Ending Stock" />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-2">
        <Card className="p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-sibol-green/50">Ending Inventory Value</p>
          <p className="mt-1 font-extrabold text-xl text-sibol-green">{formatPeso(totalValue)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-sibol-green/50">Low Stock Items</p>
          <p className="mt-1 font-extrabold text-xl text-lupang-sunog">{lowStockCount}</p>
        </Card>
      </div>

      {!rows || rows.length === 0 ? (
        <EmptyState title="Walang produkto" description="Add products in Pricing Master first." />
      ) : (
        <div className="flex flex-col gap-8">
          {[...grouped.entries()].map(([categoryName, items]) => (
            <div key={categoryName}>
              <h2 className="mb-2 font-extrabold text-lg text-sibol-green">{categoryName}</h2>
              <TableScroll>
                <table className="w-full min-w-[900px] text-sm">
                  <thead>
                    <tr className="border-b border-sibol-green/10 text-left text-sibol-green/60">
                      <th className="px-4 py-3 font-bold">Produkto</th>
                      <th className="px-4 py-3 font-bold">Beginning Qty</th>
                      <th className="px-4 py-3 font-bold">Purchased</th>
                      <th className="px-4 py-3 font-bold">Sold</th>
                      <th className="px-4 py-3 font-bold">Ending Qty</th>
                      <th className="px-4 py-3 font-bold">Ending Value</th>
                      <th className="px-4 py-3 font-bold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((r) => (
                      <tr key={r.product_id} className="border-b border-sibol-green/5 last:border-0">
                        <td className="px-4 py-3 font-bold">{r.product_name}</td>
                        <td className="px-4 py-3">
                          <BeginningQtyEditor
                            productId={r.product_id}
                            beginningQty={r.beginning_qty}
                            beginningDate={r.beginning_date}
                          />
                        </td>
                        <td className="px-4 py-3">
                          {formatNumber(r.purchased_qty)} {r.unit}
                        </td>
                        <td className="px-4 py-3">
                          {formatNumber(r.sold_qty)} {r.unit}
                        </td>
                        <td className="px-4 py-3 font-extrabold">
                          {formatNumber(r.ending_qty)} {r.unit}
                        </td>
                        <td className="px-4 py-3">{formatPeso(r.ending_value)}</td>
                        <td className="px-4 py-3">
                          {r.is_low_stock ? (
                            <Badge tone="red">Low Stock</Badge>
                          ) : (
                            <Badge tone="green">OK</Badge>
                          )}
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
    </div>
  );
}
