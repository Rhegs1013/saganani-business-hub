import { createClient } from "@/lib/supabase/server";
import { EmptyState, PageHeader, TableScroll } from "@/components/ui";
import { formatPeso } from "@/lib/format";
import { ReportTabs } from "./ReportTabs";

export default async function MonthlyPnlPage() {
  const supabase = await createClient();
  const { data: rows } = await supabase.from("monthly_pnl").select("*").order("month_start", { ascending: false });

  return (
    <div>
      <PageHeader
        title="Monthly P&L"
        subtitle="Revenue − COGS − Operating Expenses = Net Income (Before Tax); minus 3% Percentage Tax = Net Income After Tax"
      />
      <ReportTabs />

      {!rows || rows.length === 0 ? (
        <EmptyState title="Wala pang data" description="Log sales, purchases, at expenses para makita ang P&L." />
      ) : (
        <>
          <TableScroll>
            <table className="w-full min-w-[1100px] text-sm">
              <thead>
                <tr className="border-b border-sibol-green/10 text-left text-sibol-green/60">
                  <th className="px-4 py-3 font-bold">Buwan</th>
                  <th className="px-4 py-3 font-bold">Revenue</th>
                  <th className="px-4 py-3 font-bold">COGS</th>
                  <th className="px-4 py-3 font-bold">Gross Profit</th>
                  <th className="px-4 py-3 font-bold">Gross Margin %</th>
                  <th className="px-4 py-3 font-bold">Operating Expenses</th>
                  <th className="px-4 py-3 font-bold">Net Income (Before Tax)</th>
                  <th className="px-4 py-3 font-bold">Percentage Tax (3%)</th>
                  <th className="px-4 py-3 font-bold">Net Income After Tax</th>
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
                      className={`px-4 py-3 font-bold ${r.net_income < 0 ? "text-lupang-sunog" : "text-sibol-green"}`}
                    >
                      {formatPeso(r.net_income)}
                    </td>
                    <td className="px-4 py-3">{formatPeso(r.percentage_tax)}</td>
                    <td
                      className={`px-4 py-3 font-extrabold ${r.net_income_after_tax < 0 ? "text-lupang-sunog" : "text-sibol-green"}`}
                    >
                      {formatPeso(r.net_income_after_tax)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableScroll>
          <p className="mt-3 text-xs text-sibol-green/50">
            Batay sa 3% Percentage Tax sa Gross Sales/Revenue (hindi ang 8% flat tax option), ayon sa BIR
            registration ng SagananiPH. Hindi pa kasama dito ang Graduated Income Tax, dahil taunang
            kinakalkula ito batay sa buong-taon na net taxable income — magkaiba ito sa buwan-buwanang
            Percentage Tax na ipinapakita sa itaas.
          </p>
          <p className="mt-2 text-xs text-sibol-green/50">
            Ang &ldquo;Percentage Tax (3%)&rdquo; sa taas ay buwan-buwanang estimate lang — ang aktwal na
            pagbabayad sa BIR (Form 2551Q) ay tuwing quarterly: Apr 25, Jul 25, Oct 25, at Jan 25. Makikita
            ang running na utang na ito sa Balance Sheet bilang &ldquo;Percentage Tax Payable&rdquo;, at
            lumalabas lang ito bilang cash outflow sa Cash Flow pag-abot ng aktwal na due date.
          </p>
        </>
      )}
    </div>
  );
}
