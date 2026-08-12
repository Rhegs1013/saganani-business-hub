"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type ComplianceFormState = { error?: string };

function parseForm(formData: FormData) {
  const deadlineOffset = formData.get("deadline_offset_days");
  return {
    name: String(formData.get("name") || "").trim(),
    description: String(formData.get("description") || "").trim() || null,
    status: String(formData.get("status") || "Not Started"),
    deadline_date: String(formData.get("deadline_date") || "") || null,
    depends_on_item_id: String(formData.get("depends_on_item_id") || "") || null,
    deadline_offset_days: deadlineOffset ? Number(deadlineOffset) : null,
    date_completed: String(formData.get("date_completed") || "") || null,
    reference_number: String(formData.get("reference_number") || "").trim() || null,
    notes: String(formData.get("notes") || "").trim() || null,
    sort_order: Number(formData.get("sort_order") || 0),
  };
}

export async function createComplianceItem(
  _prevState: ComplianceFormState,
  formData: FormData,
): Promise<ComplianceFormState> {
  const values = parseForm(formData);
  if (!values.name) return { error: "Kailangan ng pangalan ng requirement." };

  const supabase = await createClient();
  const { error } = await supabase.from("compliance_items").insert(values);
  if (error) return { error: error.message };

  revalidatePath("/compliance");
  revalidatePath("/");
  redirect("/compliance");
}

export async function updateComplianceItem(
  id: string,
  _prevState: ComplianceFormState,
  formData: FormData,
): Promise<ComplianceFormState> {
  const values = parseForm(formData);
  if (!values.name) return { error: "Kailangan ng pangalan ng requirement." };

  const supabase = await createClient();
  const { error } = await supabase.from("compliance_items").update(values).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/compliance");
  revalidatePath("/");
  redirect("/compliance");
}

export async function deleteComplianceItem(id: string) {
  const supabase = await createClient();
  await supabase.from("compliance_items").delete().eq("id", id);
  revalidatePath("/compliance");
  revalidatePath("/");
}
