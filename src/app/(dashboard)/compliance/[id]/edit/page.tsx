import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, Card } from "@/components/ui";
import { ComplianceForm } from "../../ComplianceForm";
import { updateComplianceItem } from "../../actions";

export default async function EditComplianceItemPage(props: PageProps<"/compliance/[id]/edit">) {
  const { id } = await props.params;
  const supabase = await createClient();

  const [{ data: items }, { data: item }] = await Promise.all([
    supabase.from("compliance_items").select("id, name").order("sort_order"),
    supabase.from("compliance_items").select("*").eq("id", id).single(),
  ]);

  if (!item) notFound();

  return (
    <div>
      <PageHeader title="I-edit ang Requirement" subtitle={item.name} />
      <Card className="p-5 sm:p-6">
        <ComplianceForm items={items ?? []} item={item} action={updateComplianceItem.bind(null, id)} />
      </Card>
    </div>
  );
}
