"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateStartingCash(formData: FormData) {
  const starting_cash = Number(formData.get("starting_cash") || 0);
  const supabase = await createClient();
  await supabase.from("balance_sheet_settings").update({ starting_cash }).eq("id", 1);
  revalidatePath("/reports/balance-sheet");
}

export async function addLiability(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const amount = Number(formData.get("amount") || 0);
  const as_of_date = String(formData.get("as_of_date") || "");
  if (!name || amount < 0) return;

  const supabase = await createClient();
  await supabase.from("liabilities").insert({ name, amount, as_of_date: as_of_date || undefined });
  revalidatePath("/reports/balance-sheet");
}

export async function deleteLiability(id: string) {
  const supabase = await createClient();
  await supabase.from("liabilities").delete().eq("id", id);
  revalidatePath("/reports/balance-sheet");
}
