import { createClient } from "@/lib/supabase/server";
import { PageHeader, Card } from "@/components/ui";
import { ComplianceForm } from "../ComplianceForm";
import { createComplianceItem } from "../actions";

export default async function NewComplianceItemPage() {
  const supabase = await createClient();
  const { data: items } = await supabase.from("compliance_items").select("id, name").order("sort_order");

  return (
    <div>
      <PageHeader title="Bagong Requirement" subtitle="Add a permit or compliance checklist item" />
      <Card className="p-5 sm:p-6">
        <ComplianceForm items={items ?? []} action={createComplianceItem} />
      </Card>
    </div>
  );
}
