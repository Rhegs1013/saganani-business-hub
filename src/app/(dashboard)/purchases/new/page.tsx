import { createClient } from "@/lib/supabase/server";
import { PageHeader, Card } from "@/components/ui";
import { PurchaseForm } from "../PurchaseForm";
import { createPurchase } from "../actions";

export default async function NewPurchasePage() {
  const supabase = await createClient();
  const [{ data: categories }, { data: products }, { data: suppliers }] = await Promise.all([
    supabase.from("categories").select("id, name").eq("is_active", true).order("sort_order"),
    supabase.from("products").select("id, category_id, name, unit, unit_cost").eq("is_active", true).order("name"),
    supabase.from("suppliers").select("id, name").order("name"),
  ]);

  return (
    <div>
      <PageHeader title="Bagong Binili" subtitle="Log a new purchase from a supplier" />
      <Card className="p-5 sm:p-6">
        <PurchaseForm
          categories={categories ?? []}
          products={products ?? []}
          suppliers={suppliers ?? []}
          action={createPurchase}
        />
      </Card>
    </div>
  );
}
