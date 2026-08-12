import { createClient } from "@/lib/supabase/server";
import { Card, EmptyState, PageHeader, TableScroll } from "@/components/ui";
import { formatPeso } from "@/lib/format";
import { ReportTabs } from "../ReportTabs";

export default async function CashFlowPage() {
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("monthly_cash_flow")
    .select("*")
    .order("month_start", { ascending: false });

  return (
    <div>
      <PageHeader title="Cash Flow" subtitle="Simplified — lahat ng transaksyon ay itinuturing na cash" />
      <ReportTabs />

      <Card className="mb-6 p-4 text-xs text-sibol-green/60">
        Cash In = lahat ng benta (Sales Log). Cash Out = binili na naka-mark na &ldquo;Paid&rdquo; (hindi kasama ang
        &ldquo;Planned&rdquo;) + expenses. Ganito ang simpleng cash-basis assumption ng Excel Financial System.
      </Card>

      {!rows || rows.length === 0 ? (
        <EmptyState title="Wala pang data" />
      ) : (
        <TableScroll>
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-sibol-green/10 text-left text-sibol-green/60">
                <th className="px-4 py-3 font-bold">Buwan</th>
                <th className="px-4 py-3 font-bold">Cash In</th>
                <th className="px-4 py-3 font-bold">Purchases (Paid)</th>
                <th className="px-4 py-3 font-bold">Expenses</th>
                <th className="px-4 py-3 font-bold">Net Cash Flow</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.month_start} className="border-b border-sibol-green/5 last:border-0">
                  <td className="px-4 py-3 font-bold">{r.month_label}</td>
                  <td className="px-4 py-3">{formatPeso(r.cash_in)}</td>
                  <td className="px-4 py-3">{formatPeso(r.purchases_cash_out)}</td>
                  <td className="px-4 py-3">{formatPeso(r.expenses_cash_out)}</td>
                  <td
                    className={`px-4 py-3 font-extrabold ${r.net_cash_flow < 0 ? "text-lupang-sunog" : "text-sibol-green"}`}
                  >
                    {formatPeso(r.net_cash_flow)}
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
