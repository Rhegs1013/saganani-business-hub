"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type PurchaseFormState = { error?: string };

function parseForm(formData: FormData) {
  return {
    purchase_date: String(formData.get("purchase_date") || ""),
    supplier_id: String(formData.get("supplier_id") || "") || null,
    category_id: String(formData.get("category_id") || ""),
    product_id: String(formData.get("product_id") || ""),
    qty: Number(formData.get("qty") || 0),
    unit: String(formData.get("unit") || "").trim(),
    unit_cost: Number(formData.get("unit_cost") || 0),
    payment_terms: String(formData.get("payment_terms") || "").trim() || null,
    payment_status: String(formData.get("payment_status") || "Planned"),
    notes: String(formData.get("notes") || "").trim() || null,
  };
}

export async function createPurchase(_prevState: PurchaseFormState, formData: FormData): Promise<PurchaseFormState> {
  const values = parseForm(formData);
  if (!values.purchase_date || !values.category_id || !values.product_id || values.qty <= 0) {
    return { error: "Kailangan ng Date, Category, Product, at Qty (higit sa 0)." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("purchases").insert({ ...values, created_by: user?.id ?? null });
  if (error) return { error: error.message };

  revalidatePath("/purchases");
  revalidatePath("/inventory");
  revalidatePath("/");
  redirect("/purchases");
}

export async function updatePurchase(
  id: string,
  _prevState: PurchaseFormState,
  formData: FormData,
): Promise<PurchaseFormState> {
  const values = parseForm(formData);
  if (!values.purchase_date || !values.category_id || !values.product_id || values.qty <= 0) {
    return { error: "Kailangan ng Date, Category, Product, at Qty (higit sa 0)." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("purchases").update(values).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/purchases");
  revalidatePath("/inventory");
  revalidatePath("/");
  redirect("/purchases");
}

export async function deletePurchase(id: string) {
  const supabase = await createClient();
  await supabase.from("purchases").delete().eq("id", id);
  revalidatePath("/purchases");
  revalidatePath("/inventory");
  revalidatePath("/");
}
