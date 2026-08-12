import { createClient } from "@/lib/supabase/server";
import { PageHeader, Card } from "@/components/ui";
import { SaleForm } from "../SaleForm";
import { createSale } from "../actions";

export default async function NewSalePage() {
  const supabase = await createClient();
  const [{ data: categories }, { data: products }, { data: customers }] = await Promise.all([
    supabase.from("categories").select("id, name").eq("is_active", true).order("sort_order"),
    supabase.from("products").select("id, category_id, name, unit, retail_price").eq("is_active", true).order("name"),
    supabase.from("customers").select("id, name, customer_type, address, lat, lng").order("name"),
  ]);

  return (
    <div>
      <PageHeader title="Bagong Benta" subtitle="Log a new sale / order" />
      <Card className="p-5 sm:p-6">
        <SaleForm
          categories={categories ?? []}
          products={products ?? []}
          customers={customers ?? []}
          action={createSale}
        />
      </Card>
    </div>
  );
}
