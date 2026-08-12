import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge, Card, EmptyState, LinkButton, PageHeader, TableScroll } from "@/components/ui";
import { formatDate, formatPeso } from "@/lib/format";
import { DeleteButton } from "./DeleteButton";

export default async function ExpensesPage() {
  const supabase = await createClient();
  const { data: expenses } = await supabase
    .from("expenses")
    .select("*")
    .order("expense_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(200);

  const total = (expenses ?? []).reduce((sum, e) => sum + e.amount, 0);

  return (
    <div>
      <PageHeader
        title="Expenses Log"
        subtitle="Renta, delivery, packaging, permits, at iba pa"
        action={<LinkButton href="/expenses/new">+ Bagong Gastos</LinkButton>}
      />

      <Card className="mb-6 p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-sibol-green/50">Total (huling 200 records)</p>
        <p className="mt-1 font-extrabold text-xl text-sibol-green">{formatPeso(total)}</p>
      </Card>

      {!expenses || expenses.length === 0 ? (
        <EmptyState title="Wala pang gastos na naka-log" action={<LinkButton href="/expenses/new">+ Bagong Gastos</LinkButton>} />
      ) : (
        <TableScroll>
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-sibol-green/10 text-left text-sibol-green/60">
                <th className="px-4 py-3 font-bold">Petsa</th>
                <th className="px-4 py-3 font-bold">Category</th>
                <th className="px-4 py-3 font-bold">Description</th>
                <th className="px-4 py-3 font-bold">Amount</th>
                <th className="px-4 py-3 font-bold">Payment</th>
                <th className="px-4 py-3 font-bold" />
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) => (
                <tr key={e.id} className="border-b border-sibol-green/5 last:border-0">
                  <td className="px-4 py-3">{formatDate(e.expense_date)}</td>
                  <td className="px-4 py-3">
                    <Badge tone="gold">{e.category}</Badge>
                  </td>
                  <td className="px-4 py-3 font-bold">{e.description}</td>
                  <td className="px-4 py-3">{formatPeso(e.amount)}</td>
                  <td className="px-4 py-3">{e.payment_method ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Link href={`/expenses/${e.id}/edit`} className="font-bold text-butil-gold hover:underline">
                        Edit
                      </Link>
                      <DeleteButton id={e.id} />
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
