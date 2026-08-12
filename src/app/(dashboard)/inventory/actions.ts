"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateBeginningQty(productId: string, beginningQty: number, beginningDate: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("inventory_settings").upsert({
    product_id: productId,
    beginning_qty: beginningQty,
    beginning_date: beginningDate,
    updated_by: user?.id ?? null,
  });

  revalidatePath("/inventory");
  revalidatePath("/");
  if (error) throw new Error(error.message);
}
