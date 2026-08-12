import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, Card } from "@/components/ui";
import { PurchaseForm } from "../../PurchaseForm";
import { updatePurchase } from "../../actions";

export default async function EditPurchasePage(props: PageProps<"/purchases/[id]/edit">) {
  const { id } = await props.params;
  const supabase = await createClient();

  const [{ data: categories }, { data: products }, { data: suppliers }, { data: purchase }] = await Promise.all([
    supabase.from("categories").select("id, name").order("sort_order"),
    supabase.from("products").select("id, category_id, name, unit, unit_cost").order("name"),
    supabase.from("suppliers").select("id, name").order("name"),
    supabase.from("purchases").select("*").eq("id", id).single(),
  ]);

  if (!purchase) notFound();

  return (
    <div>
      <PageHeader title="I-edit ang Binili" />
      <Card className="p-5 sm:p-6">
        <PurchaseForm
          categories={categories ?? []}
          products={products ?? []}
          suppliers={suppliers ?? []}
          purchase={purchase}
          action={updatePurchase.bind(null, id)}
        />
      </Card>
    </div>
  );
}
