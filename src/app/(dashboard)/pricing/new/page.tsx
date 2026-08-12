import { createClient } from "@/lib/supabase/server";
import { PageHeader, Card } from "@/components/ui";
import { ProductForm } from "../ProductForm";
import { createProduct } from "../actions";

export default async function NewProductPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase.from("categories").select("id, name, is_active").order("sort_order");

  return (
    <div>
      <PageHeader title="Bagong Produkto" subtitle="Add a new item to the Pricing Master" />
      <Card className="p-5 sm:p-6">
        <ProductForm categories={categories ?? []} action={createProduct} />
      </Card>
    </div>
  );
}
