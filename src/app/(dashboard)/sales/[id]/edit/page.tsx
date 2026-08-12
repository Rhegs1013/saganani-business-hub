import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, Card } from "@/components/ui";
import { SaleForm } from "../../SaleForm";
import { updateSale } from "../../actions";

export default async function EditSalePage(props: PageProps<"/sales/[id]/edit">) {
  const { id } = await props.params;
  const supabase = await createClient();

  const [{ data: categories }, { data: products }, { data: customers }, { data: sale }] = await Promise.all([
    supabase.from("categories").select("id, name").order("sort_order"),
    supabase.from("products").select("id, category_id, name, unit, retail_price").order("name"),
    supabase.from("customers").select("id, name, customer_type, address, lat, lng").order("name"),
    supabase.from("sales").select("*").eq("id", id).single(),
  ]);

  if (!sale) notFound();

  return (
    <div>
      <PageHeader title="I-edit ang Benta" />
      <Card className="p-5 sm:p-6">
        <SaleForm
          categories={categories ?? []}
          products={products ?? []}
          customers={customers ?? []}
          sale={sale}
          action={updateSale.bind(null, id)}
        />
      </Card>
    </div>
  );
}
