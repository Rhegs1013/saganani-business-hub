import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge, EmptyState, LinkButton, PageHeader, TableScroll } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { DeleteButton, StatusSelect } from "./InquiryRowActions";

export default async function InquiriesPage() {
  const supabase = await createClient();
  const { data: inquiries } = await supabase
    .from("inquiries")
    .select("*")
    .order("inquiry_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div>
      <PageHeader
        title="Mga Tanong / Leads"
        subtitle="Manual log — foundation para sa future Facebook/TikTok automation"
        action={<LinkButton href="/inquiries/new">+ Bagong Tanong</LinkButton>}
      />

      {!inquiries || inquiries.length === 0 ? (
        <EmptyState title="Wala pang tanong na naka-log" action={<LinkButton href="/inquiries/new">+ Bagong Tanong</LinkButton>} />
      ) : (
        <TableScroll>
          <table className="w-full min-w-[840px] text-sm">
            <thead>
              <tr className="border-b border-sibol-green/10 text-left text-sibol-green/60">
                <th className="px-4 py-3 font-bold">Petsa</th>
                <th className="px-4 py-3 font-bold">Name / Handle</th>
                <th className="px-4 py-3 font-bold">Platform</th>
                <th className="px-4 py-3 font-bold">Message</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-4 py-3 font-bold" />
              </tr>
            </thead>
            <tbody>
              {inquiries.map((i) => (
                <tr key={i.id} className="border-b border-sibol-green/5 last:border-0">
                  <td className="px-4 py-3">{formatDate(i.inquiry_date)}</td>
                  <td className="px-4 py-3 font-bold">{i.name_handle}</td>
                  <td className="px-4 py-3">
                    <Badge tone="gold">{i.platform}</Badge>
                  </td>
                  <td className="px-4 py-3 max-w-xs truncate">{i.message_summary ?? "—"}</td>
                  <td className="px-4 py-3">
                    <StatusSelect id={i.id} status={i.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Link href={`/inquiries/${i.id}/edit`} className="font-bold text-butil-gold hover:underline">
                        Edit
                      </Link>
                      <DeleteButton id={i.id} />
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
