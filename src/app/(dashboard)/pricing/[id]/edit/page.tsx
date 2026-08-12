import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, Card } from "@/components/ui";
import { ProductForm } from "../../ProductForm";
import { updateProduct } from "../../actions";

export default async function EditProductPage(props: PageProps<"/pricing/[id]/edit">) {
  const { id } = await props.params;
  const supabase = await createClient();

  const [{ data: categories }, { data: product }] = await Promise.all([
    supabase.from("categories").select("id, name, is_active").order("sort_order"),
    supabase.from("products").select("*").eq("id", id).single(),
  ]);

  if (!product) notFound();

  const boundUpdate = updateProduct.bind(null, id);

  return (
    <div>
      <PageHeader title="I-edit ang Produkto" subtitle={product.name} />
      <Card className="p-5 sm:p-6">
        <ProductForm categories={categories ?? []} product={product} action={boundUpdate} />
      </Card>
    </div>
  );
}
