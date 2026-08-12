import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, Card } from "@/components/ui";
import { SupplierForm } from "../../SupplierForm";
import { updateSupplier } from "../../actions";

export default async function EditSupplierPage(props: PageProps<"/suppliers/[id]/edit">) {
  const { id } = await props.params;
  const supabase = await createClient();

  const [{ data: categories }, { data: supplier }] = await Promise.all([
    supabase.from("categories").select("id, name").order("sort_order"),
    supabase.from("suppliers").select("*").eq("id", id).single(),
  ]);

  if (!supplier) notFound();

  return (
    <div>
      <PageHeader title="I-edit ang Supplier" subtitle={supplier.name} />
      <Card className="p-5 sm:p-6">
        <SupplierForm categories={categories ?? []} supplier={supplier} action={updateSupplier.bind(null, id)} />
      </Card>
    </div>
  );
}
