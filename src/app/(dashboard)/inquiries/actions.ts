"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type InquiryFormState = { error?: string };

function parseForm(formData: FormData) {
  return {
    inquiry_date: String(formData.get("inquiry_date") || ""),
    name_handle: String(formData.get("name_handle") || "").trim(),
    platform: String(formData.get("platform") || "Facebook"),
    message_summary: String(formData.get("message_summary") || "").trim() || null,
    status: String(formData.get("status") || "New"),
  };
}

export async function createInquiry(_prevState: InquiryFormState, formData: FormData): Promise<InquiryFormState> {
  const values = parseForm(formData);
  if (!values.inquiry_date || !values.name_handle) {
    return { error: "Kailangan ng Date at Name/Handle." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("inquiries").insert({ ...values, created_by: user?.id ?? null });
  if (error) return { error: error.message };

  revalidatePath("/inquiries");
  revalidatePath("/");
  redirect("/inquiries");
}

export async function updateInquiry(
  id: string,
  _prevState: InquiryFormState,
  formData: FormData,
): Promise<InquiryFormState> {
  const values = parseForm(formData);
  if (!values.inquiry_date || !values.name_handle) {
    return { error: "Kailangan ng Date at Name/Handle." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("inquiries").update(values).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/inquiries");
  revalidatePath("/");
  redirect("/inquiries");
}

export async function updateInquiryStatus(id: string, status: string) {
  const supabase = await createClient();
  await supabase.from("inquiries").update({ status }).eq("id", id);
  revalidatePath("/inquiries");
  revalidatePath("/");
}

export async function deleteInquiry(id: string) {
  const supabase = await createClient();
  await supabase.from("inquiries").delete().eq("id", id);
  revalidatePath("/inquiries");
  revalidatePath("/");
}
