import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge, Card, EmptyState, LinkButton, PageHeader, statusTone } from "@/components/ui";
import { formatDate, todayISO } from "@/lib/format";
import { DeleteButton } from "./DeleteButton";

function daysUntil(dateStr: string | null) {
  if (!dateStr) return null;
  const today = new Date(todayISO());
  const target = new Date(dateStr);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export default async function CompliancePage() {
  const supabase = await createClient();
  const { data: items } = await supabase
    .from("compliance_status_view")
    .select("*")
    .order("sort_order");

  return (
    <div>
      <PageHeader
        title="Permits & Compliance"
        subtitle="Phase 0 ng Launch Plan — RA 11967 (Internet Transactions Act) applies kahit maliit na online seller"
        action={<LinkButton href="/compliance/new">+ Bagong Requirement</LinkButton>}
      />

      {!items || items.length === 0 ? (
        <EmptyState title="Wala pang requirement na naka-log" action={<LinkButton href="/compliance/new">+ Bagong Requirement</LinkButton>} />
      ) : (
        <div className="flex flex-col gap-4">
          {items.map((item) => {
            const days = item.status === "Completed" ? null : daysUntil(item.computed_deadline);
            const urgent = days !== null && days <= 7;
            const soon = days !== null && days > 7 && days <= 30;

            return (
              <Card
                key={item.id}
                className={`p-5 ${urgent ? "border-lupang-sunog/60" : soon ? "border-butil-gold/60" : ""}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-extrabold text-sibol-green">{item.name}</h2>
                      <Badge tone={statusTone(item.status)}>{item.status}</Badge>
                    </div>
                    {item.description ? <p className="mt-1 max-w-2xl text-sm text-sibol-green/70">{item.description}</p> : null}
                  </div>
                  <div className="flex items-center gap-3">
                    <Link href={`/compliance/${item.id}/edit`} className="font-bold text-butil-gold hover:underline">
                      Edit
                    </Link>
                    <DeleteButton id={item.id} />
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-sibol-green/50">Deadline</p>
                    <p className="font-bold text-sibol-green">{formatDate(item.computed_deadline)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-sibol-green/50">Countdown</p>
                    <p className={`font-bold ${urgent ? "text-lupang-sunog" : soon ? "text-butil-gold" : "text-sibol-green"}`}>
                      {days === null ? "—" : days >= 0 ? `${days} araw na lang` : `${Math.abs(days)} araw na lampas`}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-sibol-green/50">Date Completed</p>
                    <p className="font-bold text-sibol-green">{formatDate(item.date_completed)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-sibol-green/50">Reference #</p>
                    <p className="font-bold text-sibol-green">{item.reference_number ?? "—"}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
