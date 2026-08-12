import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge, Card, LinkButton, PageHeader, TableScroll, statusTone } from "@/components/ui";
import { formatDate, formatPeso } from "@/lib/format";
import { CustomerMap } from "./CustomerMap";

export default async function CustomerDetailPage(props: PageProps<"/customers/[id]">) {
  const { id } = await props.params;
  const supabase = await createClient();

  const [{ data: customer }, { data: stats }, { data: sales }] = await Promise.all([
    supabase.from("customers").select("*").eq("id", id).single(),
    supabase.from("customer_stats").select("*").eq("customer_id", id).maybeSingle(),
    supabase
      .from("sales")
      .select("id, sale_date, total_sale, order_status, products(name)")
      .eq("customer_id", id)
      .order("sale_date", { ascending: false })
      .limit(50),
  ]);

  if (!customer) notFound();

  return (
    <div>
      <PageHeader
        title={customer.name}
        subtitle={customer.customer_type === "Suki" ? "Suki customer" : "Retail customer"}
        action={<LinkButton href={`/customers/${id}/edit`}>Edit Profile</LinkButton>}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-1">
          <h2 className="mb-3 font-extrabold text-sibol-green">Profile</h2>
          <dl className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-sibol-green/60">Contact</dt>
              <dd className="font-bold">{customer.contact_number ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-sibol-green/60">Facebook</dt>
              <dd className="font-bold">{customer.fb_handle ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-sibol-green/60">TikTok</dt>
              <dd className="font-bold">{customer.tiktok_handle ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-sibol-green/60">Address</dt>
              <dd className="text-right font-bold">{customer.address ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-sibol-green/60">Type</dt>
              <dd>
                <Badge tone={statusTone(customer.customer_type)}>{customer.customer_type}</Badge>
                {customer.customer_type_override ? <span className="ml-2 text-xs text-sibol-green/50">(locked)</span> : null}
              </dd>
            </div>
          </dl>
          {customer.notes ? <p className="mt-4 text-sm text-sibol-green/70">{customer.notes}</p> : null}
        </Card>

        <Card className="p-5 lg:col-span-2">
          <h2 className="mb-3 font-extrabold text-sibol-green">Order History Summary</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat label="Total Orders" value={String(stats?.total_orders ?? 0)} />
            <Stat label="Completed" value={String(stats?.completed_orders ?? 0)} />
            <Stat label="Lifetime Spend" value={formatPeso(stats?.lifetime_spend ?? 0)} />
            <Stat label="Last Order" value={formatDate(stats?.last_order_date)} />
          </div>

          {customer.lat != null && customer.lng != null ? (
            <div className="mt-5">
              <p className="mb-2 text-sm font-bold text-sibol-green">Delivery Location</p>
              <CustomerMap lat={customer.lat} lng={customer.lng} />
            </div>
          ) : null}
        </Card>
      </div>

      <div className="mt-6">
        <h2 className="mb-3 font-extrabold text-lg text-sibol-green">Recent Orders</h2>
        {!sales || sales.length === 0 ? (
          <p className="text-sm text-sibol-green/60">Wala pang order.</p>
        ) : (
          <TableScroll>
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-sibol-green/10 text-left text-sibol-green/60">
                  <th className="px-4 py-3 font-bold">Petsa</th>
                  <th className="px-4 py-3 font-bold">Produkto</th>
                  <th className="px-4 py-3 font-bold">Total</th>
                  <th className="px-4 py-3 font-bold">Status</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((s) => (
                  <tr key={s.id} className="border-b border-sibol-green/5 last:border-0">
                    <td className="px-4 py-3">{formatDate(s.sale_date)}</td>
                    <td className="px-4 py-3 font-bold">{(s.products as unknown as { name: string } | null)?.name ?? "—"}</td>
                    <td className="px-4 py-3">{formatPeso(s.total_sale)}</td>
                    <td className="px-4 py-3">
                      <Badge tone={statusTone(s.order_status)}>{s.order_status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableScroll>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-sibol-green/5 px-4 py-3">
      <p className="text-xs font-bold uppercase tracking-wide text-sibol-green/50">{label}</p>
      <p className="mt-1 font-extrabold text-lg text-sibol-green">{value}</p>
    </div>
  );
}
