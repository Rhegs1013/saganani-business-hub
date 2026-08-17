import { createClient } from "@/lib/supabase/server";
import { Button, Card, Field, Input, PageHeader, TableScroll } from "@/components/ui";
import { formatDate, formatPeso, todayISO } from "@/lib/format";
import { ReportTabs } from "../ReportTabs";
import { addLiability, updateStartingCash } from "./actions";
import { DeleteLiabilityButton } from "./DeleteLiabilityButton";

export default async function BalanceSheetPage() {
  const supabase = await createClient();

  const [{ data: cashPosition }, { data: inventoryRows }, { data: liabilities }, { data: settings }, { data: taxPayable }] =
    await Promise.all([
      supabase.from("monthly_cash_position").select("*").order("month_start", { ascending: false }).limit(1),
      supabase.from("inventory_status").select("ending_value"),
      supabase.from("liabilities").select("*").order("as_of_date", { ascending: false }),
      supabase.from("balance_sheet_settings").select("*").eq("id", 1).single(),
      supabase.from("percentage_tax_payable_status").select("*").single(),
    ]);

  const cash = cashPosition?.[0]?.cash_balance ?? settings?.starting_cash ?? 0;
  const inventoryValue = (inventoryRows ?? []).reduce((sum, r) => sum + (r.ending_value ?? 0), 0);
  const totalAssets = cash + inventoryValue;
  const percentageTaxPayable = taxPayable?.payable_balance ?? 0;
  const totalLiabilities = (liabilities ?? []).reduce((sum, l) => sum + l.amount, 0) + percentageTaxPayable;
  const equity = totalAssets - totalLiabilities;

  return (
    <div>
      <PageHeader title="Balance Sheet" subtitle="Simple snapshot — Cash + Inventory Value = Assets" />
      <ReportTabs />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-4 font-extrabold text-sibol-green">Assets</h2>
          <dl className="flex flex-col gap-3 text-sm">
            <Row label="Cash (running balance)" value={formatPeso(cash)} />
            <Row label="Inventory Value" value={formatPeso(inventoryValue)} />
            <Row label="Total Assets" value={formatPeso(totalAssets)} bold />
          </dl>

          <form action={updateStartingCash} className="mt-5 flex items-end gap-3 border-t border-sibol-green/10 pt-4">
            <Field label="Starting Cash (₱)" htmlFor="starting_cash" hint="Manual baseline bago mag-start ang cash flow tracking">
              <Input
                id="starting_cash"
                name="starting_cash"
                type="number"
                step="0.01"
                defaultValue={settings?.starting_cash ?? 0}
              />
            </Field>
            <Button type="submit" size="sm">
              Save
            </Button>
          </form>
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 font-extrabold text-sibol-green">Liabilities</h2>

          <div className="mb-4 flex items-center justify-between gap-3 rounded-xl bg-sibol-green/5 px-3 py-2.5 text-sm">
            <div>
              <p className="font-bold text-sibol-green">Percentage Tax Payable</p>
              <p className="text-xs text-sibol-green/50">
                Awtomatikong kinakalkula (3% ng revenue, minus binayaran na sa BIR due dates) — hindi ito
                mano-manong ine-edit.
              </p>
            </div>
            <p className="font-extrabold text-sibol-green">{formatPeso(percentageTaxPayable)}</p>
          </div>

          {!liabilities || liabilities.length === 0 ? (
            <p className="text-sm text-sibol-green/60">Walang naka-log na liability.</p>
          ) : (
            <TableScroll>
              <table className="w-full text-sm">
                <tbody>
                  {liabilities.map((l) => (
                    <tr key={l.id} className="border-b border-sibol-green/5 last:border-0">
                      <td className="px-3 py-2 font-bold">{l.name}</td>
                      <td className="px-3 py-2">{formatDate(l.as_of_date)}</td>
                      <td className="px-3 py-2">{formatPeso(l.amount)}</td>
                      <td className="px-3 py-2">
                        <DeleteLiabilityButton id={l.id} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableScroll>
          )}

          <form action={addLiability} className="mt-4 grid gap-3 sm:grid-cols-3">
            <Field label="Name" htmlFor="liability_name">
              <Input id="liability_name" name="name" placeholder="e.g. Utang sa supplier" />
            </Field>
            <Field label="Amount (₱)" htmlFor="liability_amount">
              <Input id="liability_amount" name="amount" type="number" step="0.01" min="0" />
            </Field>
            <Field label="As of" htmlFor="liability_date">
              <Input id="liability_date" name="as_of_date" type="date" defaultValue={todayISO()} />
            </Field>
            <Button type="submit" size="sm" className="sm:col-span-3 sm:self-start">
              + Add Liability
            </Button>
          </form>

          <dl className="mt-5 flex flex-col gap-3 border-t border-sibol-green/10 pt-4 text-sm">
            <Row label="Total Liabilities" value={formatPeso(totalLiabilities)} bold />
            <Row label="Owner's Equity (Assets − Liabilities)" value={formatPeso(equity)} bold />
          </dl>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className={bold ? "font-bold text-sibol-green" : "text-sibol-green/60"}>{label}</dt>
      <dd className={bold ? "font-extrabold text-sibol-green" : "font-bold text-sibol-green"}>{value}</dd>
    </div>
  );
}
