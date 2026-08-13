import { createClient } from "@/lib/supabase/server";
import { POSRestockClient } from "./POSRestockClient";

export default async function POSRestockPage() {
  const supabase = await createClient();

  const [{ data: categories }, { data: products }, { data: suppliers }] = await Promise.all([
    supabase.from("categories").select("id, name").eq("is_active", true).order("sort_order"),
    supabase
      .from("products")
      .select("id, category_id, name, unit, unit_cost, barcode")
      .eq("is_active", true)
      .order("name"),
    supabase.from("suppliers").select("id, name").order("name"),
  ]);

  return (
    <POSRestockClient categories={categories ?? []} products={products ?? []} suppliers={suppliers ?? []} />
  );
}
