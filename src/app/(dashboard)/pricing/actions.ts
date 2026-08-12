"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type ProductFormState = { error?: string };

function parseProductForm(formData: FormData) {
  const suki_price = formData.get("suki_price");
  return {
    category_id: String(formData.get("category_id") || ""),
    name: String(formData.get("name") || "").trim(),
    unit: String(formData.get("unit") || "").trim(),
    unit_cost: Number(formData.get("unit_cost") || 0),
    markup_pct: Number(formData.get("markup_pct") || 0),
    suki_price: suki_price ? Number(suki_price) : null,
    low_stock_threshold: Number(formData.get("low_stock_threshold") || 0),
    is_active: formData.get("is_active") === "on",
    notes: String(formData.get("notes") || "").trim() || null,
  };
}

export async function createProduct(_prevState: ProductFormState, formData: FormData): Promise<ProductFormState> {
  const values = parseProductForm(formData);
  if (!values.category_id || !values.name || !values.unit) {
    return { error: "Please fill in Category, Product Name, and Unit." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("products").insert(values);
  if (error) return { error: error.message };

  revalidatePath("/pricing");
  redirect("/pricing");
}

export async function updateProduct(
  id: string,
  _prevState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const values = parseProductForm(formData);
  if (!values.category_id || !values.name || !values.unit) {
    return { error: "Please fill in Category, Product Name, and Unit." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("products").update(values).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/pricing");
  redirect("/pricing");
}

export async function toggleProductActive(id: string, nextActive: boolean) {
  const supabase = await createClient();
  await supabase.from("products").update({ is_active: nextActive }).eq("id", id);
  revalidatePath("/pricing");
}
