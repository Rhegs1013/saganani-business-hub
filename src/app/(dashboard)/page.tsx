import Link from "next/link";
import { endOfWeek, format, startOfMonth, startOfWeek, subWeeks } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { Badge, Card, LinkButton, PageHeader } from "@/components/ui";
import { formatDate, formatNumber, formatPeso, todayISO } from "@/lib/format";
import { SalesTrendChart } from "@/components/SalesTrendChart";

export default async function DashboardPage() {
  const supabase = await createClient();
  const today = new Date();
  const monthStart = format(startOfMonth(today), "yyyy-MM-dd");
  const trendStart = format(startOfWeek(subWeeks(today, 7), { weekStartsOn: 1 }), "yyyy-MM-dd");
  const weekStart = format(startOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd");

  const [
    { data: pnlRows },
    { data: lowStock },
    { data: monthSales },
    { data: trendSales },
    { data: newInquiries },
    { data: complianceRows },
  ] = await Promise.all([
    supabase.from("monthly_pnl").select("*").order("month_start", { ascending: false }).limit(1),
    supabase.from("inventory_status").select("*").eq("is_active", true).eq("is_low_stock", true),
    supabase
      .from("sales")
      .select("product_id, qty, unit, products(name)")
      .gte("sale_date", monthStart)
      .neq("order_status", "Cancelled"),
    supabase.from("sales").select("sale_date, total_sale").gte("sale_date", trendStart).neq("order_status", "Cancelled"),
    supabase.from("inquiries").select("id", { count: "exact", head: true }).gte("inquiry_date", weekStart),
    supabase
      .from("compliance_status_view")
      .select("*")
      .neq("status", "Completed")
      .order("computed_deadline", { ascending: true })
      .limit(5),
  ]);

  const thisMonth = pnlRows?.[0];

  const productTotals = new Map<string, { name: string; qty: number; unit: string }>();
  for (const s of monthSales ?? []) {
    const name = (s.products as unknown as { name: string } | null)?.name ?? "—";
    const key = s.product_id;
    const existing = productTotals.get(key);
    if (existing) {
      existing.qty += s.qty;
    } else {
      productTotals.set(key, { name, qty: s.qty, unit: s.unit });
    }
  }
  const topProducts = [...productTotals.values()].sort((a, b) => b.qty - a.qty).slice(0, 3);

  const weeks: { start: Date; end: Date; label: string }[] = [];
  for (let i = 7; i >= 0; i--) {
    const start = startOfWeek(subWeeks(today, i), { weekStartsOn: 1 });
    const end = endOfWeek(start, { weekStartsOn: 1 });
    weeks.push({ start, end, label: format(start, "MMM d") });
  }
  const trendData = weeks.map((w) => {
    const total = (trendSales ?? [])
      .filter((s) => {
        const d = new Date(`${s.sale_date}T00:00:00`);
        return d >= w.start && d <= w.end;
      })
      .reduce((sum, s) => sum + s.total_sale, 0);
    return { label: w.label, total };
  });

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle={`Kumusta! Narito ang buod para sa ${format(today, "MMMM yyyy")}`}
        action={<LinkButton href="/sales/new">+ Bagong Benta</LinkButton>}
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Revenue (this month)" value={formatPeso(thisMonth?.revenue ?? 0)} />
        <Stat label="COGS (this month)" value={formatPeso(thisMonth?.cogs ?? 0)} />
        <Stat label="Gross Profit" value={formatPeso(thisMonth?.gross_profit ?? 0)} />
        <Stat label="Gross Margin %" value={`${thisMonth?.gross_margin_pct ?? 0}%`} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <h2 className="mb-3 font-extrabold text-sibol-green">Sales Trend (last 8 weeks)</h2>
          <SalesTrendChart data={trendData} />
        </Card>

        <Card className="p-5">
          <h2 className="mb-3 font-extrabold text-sibol-green">Top 3 Products (this month)</h2>
          {topProducts.length === 0 ? (
            <p className="text-sm text-sibol-green/60">Wala pang benta ngayong buwan.</p>
          ) : (
            <ol className="flex flex-col gap-3">
              {topProducts.map((p, idx) => (
                <li key={p.name} className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 font-bold text-sibol-green">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-butil-gold text-xs text-sibol-green">
                      {idx + 1}
                    </span>
                    {p.name}
                  </span>
                  <span className="text-sm text-sibol-green/70">
                    {formatNumber(p.qty)} {p.unit}
                  </span>
                </li>
              ))}
            </ol>
          )}

          <div className="mt-6 border-t border-sibol-green/10 pt-4">
            <div className="flex items-center justify-between">
              <h2 className="font-extrabold text-sibol-green">Bagong Tanong (this week)</h2>
              <Link href="/inquiries" className="text-sm font-bold text-butil-gold hover:underline">
                View all
              </Link>
            </div>
            <p className="mt-2 font-extrabold text-2xl text-sibol-green">{newInquiries?.length ?? 0}</p>
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-extrabold text-sibol-green">Low Stock Alerts</h2>
            <Link href="/inventory" className="text-sm font-bold text-butil-gold hover:underline">
              View Inventory
            </Link>
          </div>
          {!lowStock || lowStock.length === 0 ? (
            <p className="text-sm text-sibol-green/60">Walang mababang stock. 🎉</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {lowStock.map((item) => (
                <li key={item.product_id} className="flex items-center justify-between gap-3 rounded-xl bg-lupang-sunog/5 px-3.5 py-2.5">
                  <span className="font-bold text-sibol-green">{item.product_name}</span>
                  <Badge tone="red">
                    {formatNumber(item.ending_qty)} {item.unit} na lang
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-extrabold text-sibol-green">Upcoming Compliance Deadlines</h2>
            <Link href="/compliance" className="text-sm font-bold text-butil-gold hover:underline">
              View all
            </Link>
          </div>
          {!complianceRows || complianceRows.length === 0 ? (
            <p className="text-sm text-sibol-green/60">Walang naka-schedule na deadline.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {complianceRows.map((item) => {
                const days = item.computed_deadline
                  ? Math.ceil(
                      (new Date(item.computed_deadline).getTime() - new Date(todayISO()).getTime()) /
                        (1000 * 60 * 60 * 24),
                    )
                  : null;
                return (
                  <li key={item.id} className="flex items-center justify-between gap-3 rounded-xl bg-sibol-green/5 px-3.5 py-2.5">
                    <div>
                      <p className="font-bold text-sibol-green">{item.name}</p>
                      <p className="text-xs text-sibol-green/60">{formatDate(item.computed_deadline)}</p>
                    </div>
                    <Badge tone={days !== null && days <= 7 ? "red" : days !== null && days <= 30 ? "gold" : "gray"}>
                      {days === null ? item.status : days >= 0 ? `${days}d left` : `${Math.abs(days)}d overdue`}
                    </Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-sibol-green/50">{label}</p>
      <p className="mt-1 font-extrabold text-xl text-sibol-green">{value}</p>
    </Card>
  );
}
