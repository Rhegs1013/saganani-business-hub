"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type POSRestockLine = {
  product_id: string;
  category_id: string;
  supplier_id: string | null;
  qty: number;
  unit: string;
  unit_cost: number;
};

export type POSRestockMeta = {
  payment_status: string;
  notes: string | null;
};

export type POSRestockResult = { error?: string; success?: boolean };

// Writes straight into the same `purchases` table the Purchases Log module
// uses. Inventory's Purchased Qty is computed live from this table, so a
// restock logged here shows up in Inventory immediately with no extra step.
export async function completePOSRestock(lines: POSRestockLine[], meta: POSRestockMeta): Promise<POSRestockResult> {
  if (lines.length === 0) {
    return { error: "Walang item sa restock list." };
  }
  if (lines.some((l) => l.qty <= 0)) {
    return { error: "May item na may 0 o negatibong quantity." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const purchase_date = new Date().toISOString().slice(0, 10);

  const rows = lines.map((line) => ({
    purchase_date,
    supplier_id: line.supplier_id,
    category_id: line.category_id,
    product_id: line.product_id,
    qty: line.qty,
    unit: line.unit,
    unit_cost: line.unit_cost,
    payment_status: meta.payment_status,
    notes: meta.notes,
    created_by: user?.id ?? null,
  }));

  const { error } = await supabase.from("purchases").insert(rows);
  if (error) return { error: error.message };

  revalidatePath("/purchases");
  revalidatePath("/inventory");
  revalidatePath("/");
  return { success: true };
}
