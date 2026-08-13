import { createClient } from "@/lib/supabase/server";
import { POSSellClient } from "./POSSellClient";

export default async function POSSellPage() {
  const supabase = await createClient();

  const [{ data: categories }, { data: products }, { data: customers }] = await Promise.all([
    supabase.from("categories").select("id, name").eq("is_active", true).order("sort_order"),
    supabase
      .from("products")
      .select("id, category_id, name, unit, retail_price, barcode")
      .eq("is_active", true)
      .order("name"),
    supabase.from("customers").select("id, name, customer_type").order("name"),
  ]);

  return (
    <POSSellClient categories={categories ?? []} products={products ?? []} customers={customers ?? []} />
  );
}
