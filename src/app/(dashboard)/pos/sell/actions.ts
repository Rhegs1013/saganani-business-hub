"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type POSCartLine = {
  product_id: string;
  category_id: string;
  qty: number;
  unit: string;
  unit_price: number;
};

export type POSSaleMeta = {
  customer_id: string | null;
  payment_method: string;
  notes: string | null;
};

export type POSSaleResult = { error?: string; success?: boolean };

// Writes straight into the same `sales` table the Sales Log module uses -
// same columns, same generated total_sale, same order_status pipeline
// (marked Completed since a counter sale is done the moment it's rung up).
// Inventory automatically reflects this because inventory_status computes
// Sold Qty live from this table - no separate deduction step needed here.
export async function completePOSSale(lines: POSCartLine[], meta: POSSaleMeta): Promise<POSSaleResult> {
  if (lines.length === 0) {
    return { error: "Walang laman ang cart." };
  }
  if (lines.some((l) => l.qty <= 0)) {
    return { error: "May item na may 0 o negatibong quantity." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let customer_type = "Retail";
  if (meta.customer_id) {
    const { data: customer } = await supabase
      .from("customers")
      .select("customer_type")
      .eq("id", meta.customer_id)
      .maybeSingle();
    if (customer) customer_type = customer.customer_type;
  }

  const sale_date = new Date().toISOString().slice(0, 10);

  const rows = lines.map((line) => ({
    sale_date,
    customer_id: meta.customer_id,
    customer_type,
    category_id: line.category_id,
    product_id: line.product_id,
    qty: line.qty,
    unit: line.unit,
    unit_price: line.unit_price,
    payment_method: meta.payment_method,
    order_source: "In-store" as const,
    order_status: "Completed" as const,
    is_delivery: false,
    notes: meta.notes,
    created_by: user?.id ?? null,
  }));

  const { error } = await supabase.from("sales").insert(rows);
  if (error) return { error: error.message };

  revalidatePath("/sales");
  revalidatePath("/inventory");
  revalidatePath("/customers");
  revalidatePath("/");
  return { success: true };
}
