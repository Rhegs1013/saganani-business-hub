import { createClient } from "@/lib/supabase/server";
import { PageHeader, Card } from "@/components/ui";
import { SupplierForm } from "../SupplierForm";
import { createSupplier } from "../actions";

export default async function NewSupplierPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase.from("categories").select("id, name").order("sort_order");

  return (
    <div>
      <PageHeader title="Bagong Supplier" subtitle="Add a supplier or sourcing lead" />
      <Card className="p-5 sm:p-6">
        <SupplierForm categories={categories ?? []} action={createSupplier} />
      </Card>
    </div>
  );
}
