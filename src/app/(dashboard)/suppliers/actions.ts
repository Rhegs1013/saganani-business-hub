"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type SupplierFormState = { error?: string };

function parseForm(formData: FormData) {
  const distance = formData.get("distance_km");
  return {
    category_id: String(formData.get("category_id") || "") || null,
    name: String(formData.get("name") || "").trim(),
    location: String(formData.get("location") || "").trim() || null,
    distance_km: distance ? Number(distance) : null,
    products_offered: String(formData.get("products_offered") || "").trim() || null,
    price_benchmark: String(formData.get("price_benchmark") || "").trim() || null,
    payment_terms: String(formData.get("payment_terms") || "").trim() || null,
    moq: String(formData.get("moq") || "").trim() || null,
    delivery_available: formData.get("delivery_available") === "on",
    contact: String(formData.get("contact") || "").trim() || null,
    confidence_level: String(formData.get("confidence_level") || "Unverified"),
    notes: String(formData.get("notes") || "").trim() || null,
  };
}

export async function createSupplier(_prevState: SupplierFormState, formData: FormData): Promise<SupplierFormState> {
  const values = parseForm(formData);
  if (!values.name) return { error: "Kailangan ng Supplier Name." };

  const supabase = await createClient();
  const { error } = await supabase.from("suppliers").insert(values);
  if (error) return { error: error.message };

  revalidatePath("/suppliers");
  redirect("/suppliers");
}

export async function updateSupplier(
  id: string,
  _prevState: SupplierFormState,
  formData: FormData,
): Promise<SupplierFormState> {
  const values = parseForm(formData);
  if (!values.name) return { error: "Kailangan ng Supplier Name." };

  const supabase = await createClient();
  const { error } = await supabase.from("suppliers").update(values).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/suppliers");
  redirect("/suppliers");
}

export async function deleteSupplier(id: string) {
  const supabase = await createClient();
  await supabase.from("suppliers").delete().eq("id", id);
  revalidatePath("/suppliers");
}
