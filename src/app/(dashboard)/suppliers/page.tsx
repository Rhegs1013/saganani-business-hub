import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge, EmptyState, LinkButton, PageHeader, TableScroll, statusTone } from "@/components/ui";
import { DeleteButton } from "./DeleteButton";

export default async function SuppliersPage() {
  const supabase = await createClient();
  const { data: suppliers } = await supabase
    .from("suppliers")
    .select("*, categories(name)")
    .order("name");

  return (
    <div>
      <PageHeader
        title="Suppliers Directory"
        subtitle="Confirmed at research-based na pinagkukunan"
        action={<LinkButton href="/suppliers/new">+ Bagong Supplier</LinkButton>}
      />

      {!suppliers || suppliers.length === 0 ? (
        <EmptyState
          title="Wala pang supplier"
          description="Add your first supplier or sourcing lead."
          action={<LinkButton href="/suppliers/new">+ Bagong Supplier</LinkButton>}
        />
      ) : (
        <TableScroll>
          <table className="w-full min-w-[1000px] text-sm">
            <thead>
              <tr className="border-b border-sibol-green/10 text-left text-sibol-green/60">
                <th className="px-4 py-3 font-bold">Supplier</th>
                <th className="px-4 py-3 font-bold">Category</th>
                <th className="px-4 py-3 font-bold">Location</th>
                <th className="px-4 py-3 font-bold">Distance</th>
                <th className="px-4 py-3 font-bold">Products</th>
                <th className="px-4 py-3 font-bold">Terms</th>
                <th className="px-4 py-3 font-bold">MOQ</th>
                <th className="px-4 py-3 font-bold">Delivery</th>
                <th className="px-4 py-3 font-bold">Confidence</th>
                <th className="px-4 py-3 font-bold" />
              </tr>
            </thead>
            <tbody>
              {suppliers.map((s) => (
                <tr key={s.id} className="border-b border-sibol-green/5 last:border-0">
                  <td className="px-4 py-3 font-bold">{s.name}</td>
                  <td className="px-4 py-3">{(s.categories as unknown as { name: string } | null)?.name ?? "—"}</td>
                  <td className="px-4 py-3">{s.location ?? "—"}</td>
                  <td className="px-4 py-3">{s.distance_km ? `${s.distance_km} km` : "—"}</td>
                  <td className="px-4 py-3">{s.products_offered ?? "—"}</td>
                  <td className="px-4 py-3">{s.payment_terms ?? "—"}</td>
                  <td className="px-4 py-3">{s.moq ?? "—"}</td>
                  <td className="px-4 py-3">{s.delivery_available ? "Yes" : "No"}</td>
                  <td className="px-4 py-3">
                    <Badge tone={statusTone(s.confidence_level)}>{s.confidence_level}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Link href={`/suppliers/${s.id}/edit`} className="font-bold text-butil-gold hover:underline">
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
