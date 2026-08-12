"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type CustomerFormState = { error?: string };

function parseForm(formData: FormData) {
  const lat = formData.get("lat");
  const lng = formData.get("lng");
  return {
    name: String(formData.get("name") || "").trim(),
    contact_number: String(formData.get("contact_number") || "").trim() || null,
    fb_handle: String(formData.get("fb_handle") || "").trim() || null,
    tiktok_handle: String(formData.get("tiktok_handle") || "").trim() || null,
    address: String(formData.get("address") || "").trim() || null,
    lat: lat ? Number(lat) : null,
    lng: lng ? Number(lng) : null,
    customer_type: String(formData.get("customer_type") || "Retail"),
    customer_type_override: formData.get("customer_type_override") === "on",
    notes: String(formData.get("notes") || "").trim() || null,
  };
}

export async function createCustomer(_prevState: CustomerFormState, formData: FormData): Promise<CustomerFormState> {
  const values = parseForm(formData);
  if (!values.name) return { error: "Kailangan ng Pangalan ng Customer." };

  const supabase = await createClient();
  const { error } = await supabase.from("customers").insert(values);
  if (error) return { error: error.message };

  revalidatePath("/customers");
  redirect("/customers");
}

export async function updateCustomer(
  id: string,
  _prevState: CustomerFormState,
  formData: FormData,
): Promise<CustomerFormState> {
  const values = parseForm(formData);
  if (!values.name) return { error: "Kailangan ng Pangalan ng Customer." };

  const supabase = await createClient();
  const { error } = await supabase.from("customers").update(values).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/customers");
  revalidatePath(`/customers/${id}`);
  redirect("/customers");
}
