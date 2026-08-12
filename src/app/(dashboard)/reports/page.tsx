import { createClient } from "@/lib/supabase/server";
import { EmptyState, PageHeader, TableScroll } from "@/components/ui";
import { formatPeso } from "@/lib/format";
import { ReportTabs } from "./ReportTabs";

export default async function MonthlyPnlPage() {
  const supabase = await createClient();
  const { data: rows } = await supabase.from("monthly_pnl").select("*").order("month_start", { ascending: false });

  return (
    <div>
      <PageHeader title="Monthly P&L" subtitle="Revenue − COGS − Operating Expenses = Net Income" />
      <ReportTabs />

      {!rows || rows.length === 0 ? (
        <EmptyState title="Wala pang data" description="Log sales, purchases, at expenses para makita ang P&L." />
      ) : (
        <TableScroll>
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-sibol-green/10 text-left text-sibol-green/60">
                <th className="px-4 py-3 font-bold">Buwan</th>
                <th className="px-4 py-3 font-bold">Revenue</th>
                <th className="px-4 py-3 font-bold">COGS</th>
                <th className="px-4 py-3 font-bold">Gross Profit</th>
                <th className="px-4 py-3 font-bold">Gross Margin %</th>
                <th className="px-4 py-3 font-bold">Operating Expenses</th>
                <th className="px-4 py-3 font-bold">Net Income</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.month_start} className="border-b border-sibol-green/5 last:border-0">
                  <td className="px-4 py-3 font-bold">{r.month_label}</td>
                  <td className="px-4 py-3">{formatPeso(r.revenue)}</td>
                  <td className="px-4 py-3">{formatPeso(r.cogs)}</td>
                  <td className="px-4 py-3">{formatPeso(r.gross_profit)}</td>
                  <td className="px-4 py-3">{r.gross_margin_pct}%</td>
                  <td className="px-4 py-3">{formatPeso(r.operating_expenses)}</td>
                  <td
                    className={`px-4 py-3 font-extrabold ${r.net_income < 0 ? "text-lupang-sunog" : "text-sibol-green"}`}
                  >
                    {formatPeso(r.net_income)}
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
