"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type SaleFormState = { error?: string };

function parseForm(formData: FormData) {
  const lat = formData.get("delivery_lat");
  const lng = formData.get("delivery_lng");
  const isDelivery = formData.get("is_delivery") === "on";
  return {
    sale_date: String(formData.get("sale_date") || ""),
    customer_id: String(formData.get("customer_id") || "") || null,
    customer_type: String(formData.get("customer_type") || "Retail"),
    category_id: String(formData.get("category_id") || ""),
    product_id: String(formData.get("product_id") || ""),
    qty: Number(formData.get("qty") || 0),
    unit: String(formData.get("unit") || "").trim(),
    unit_price: Number(formData.get("unit_price") || 0),
    payment_method: String(formData.get("payment_method") || "Cash"),
    order_source: String(formData.get("order_source") || "In-store"),
    order_status: String(formData.get("order_status") || "New"),
    is_delivery: isDelivery,
    delivery_address: isDelivery ? String(formData.get("delivery_address") || "").trim() || null : null,
    delivery_lat: isDelivery && lat ? Number(lat) : null,
    delivery_lng: isDelivery && lng ? Number(lng) : null,
    notes: String(formData.get("notes") || "").trim() || null,
  };
}

export async function createSale(_prevState: SaleFormState, formData: FormData): Promise<SaleFormState> {
  const values = parseForm(formData);
  if (!values.sale_date || !values.category_id || !values.product_id || values.qty <= 0) {
    return { error: "Kailangan ng Date, Category, Product, at Qty (higit sa 0)." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("sales").insert({ ...values, created_by: user?.id ?? null });
  if (error) return { error: error.message };

  revalidatePath("/sales");
  revalidatePath("/inventory");
  revalidatePath("/customers");
  revalidatePath("/");
  redirect("/sales");
}

export async function updateSale(id: string, _prevState: SaleFormState, formData: FormData): Promise<SaleFormState> {
  const values = parseForm(formData);
  if (!values.sale_date || !values.category_id || !values.product_id || values.qty <= 0) {
    return { error: "Kailangan ng Date, Category, Product, at Qty (higit sa 0)." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("sales").update(values).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/sales");
  revalidatePath("/inventory");
  revalidatePath("/customers");
  revalidatePath("/");
  redirect("/sales");
}

export async function deleteSale(id: string) {
  const supabase = await createClient();
  await supabase.from("sales").delete().eq("id", id);
  revalidatePath("/sales");
  revalidatePath("/inventory");
  revalidatePath("/customers");
  revalidatePath("/");
}

export async function updateSaleStatus(id: string, order_status: string) {
  const supabase = await createClient();
  await supabase.from("sales").update({ order_status }).eq("id", id);
  revalidatePath("/sales");
  revalidatePath("/customers");
  revalidatePath("/");
}
