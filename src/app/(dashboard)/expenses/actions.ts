"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type ExpenseFormState = { error?: string };

function parseForm(formData: FormData) {
  return {
    expense_date: String(formData.get("expense_date") || ""),
    category: String(formData.get("category") || ""),
    description: String(formData.get("description") || "").trim(),
    amount: Number(formData.get("amount") || 0),
    payment_method: String(formData.get("payment_method") || "").trim() || null,
    notes: String(formData.get("notes") || "").trim() || null,
  };
}

export async function createExpense(_prevState: ExpenseFormState, formData: FormData): Promise<ExpenseFormState> {
  const values = parseForm(formData);
  if (!values.expense_date || !values.category || !values.description || values.amount <= 0) {
    return { error: "Kailangan ng Date, Category, Description, at Amount (higit sa 0)." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("expenses").insert({ ...values, created_by: user?.id ?? null });
  if (error) return { error: error.message };

  revalidatePath("/expenses");
  revalidatePath("/");
  redirect("/expenses");
}

export async function updateExpense(
  id: string,
  _prevState: ExpenseFormState,
  formData: FormData,
): Promise<ExpenseFormState> {
  const values = parseForm(formData);
  if (!values.expense_date || !values.category || !values.description || values.amount <= 0) {
    return { error: "Kailangan ng Date, Category, Description, at Amount (higit sa 0)." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("expenses").update(values).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/expenses");
  revalidatePath("/");
  redirect("/expenses");
}

export async function deleteExpense(id: string) {
  const supabase = await createClient();
  await supabase.from("expenses").delete().eq("id", id);
  revalidatePath("/expenses");
  revalidatePath("/");
}
