import { createClient } from "@/lib/supabase/server";
import { PageHeader, Card } from "@/components/ui";
import { ProductForm } from "../ProductForm";
import { createProduct } from "../actions";

export default async function NewProductPage(props: PageProps<"/pricing/new">) {
  const searchParams = await props.searchParams;
  const barcodeParam = searchParams?.barcode;
  const defaultBarcode = Array.isArray(barcodeParam) ? barcodeParam[0] : barcodeParam;

  const supabase = await createClient();
  const { data: categories } = await supabase.from("categories").select("id, name, is_active").order("sort_order");

  return (
    <div>
      <PageHeader title="Bagong Produkto" subtitle="Add a new item to the Pricing Master" />
      <Card className="p-5 sm:p-6">
        <ProductForm categories={categories ?? []} defaultBarcode={defaultBarcode} action={createProduct} />
      </Card>
    </div>
  );
}
