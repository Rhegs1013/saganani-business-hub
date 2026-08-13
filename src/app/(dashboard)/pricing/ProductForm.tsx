"use client";

import { useActionState } from "react";
import { Button, Field, Input, Select, Textarea } from "@/components/ui";
import { UNIT_OPTIONS } from "@/lib/constants";
import type { ProductFormState } from "./actions";

type Category = { id: string; name: string; is_active: boolean };
type Product = {
  id: string;
  category_id: string;
  name: string;
  unit: string;
  unit_cost: number;
  markup_pct: number;
  suki_price: number | null;
  low_stock_threshold: number;
  is_active: boolean;
  barcode: string | null;
  notes: string | null;
};

export function ProductForm({
  categories,
  product,
  defaultBarcode,
  action,
}: {
  categories: Category[];
  product?: Product;
  defaultBarcode?: string;
  action: (state: ProductFormState, formData: FormData) => Promise<ProductFormState>;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Category" htmlFor="category_id" required>
          <Select id="category_id" name="category_id" defaultValue={product?.category_id} required>
            <option value="" disabled>
              Piliin ang category
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {!c.is_active ? " (inactive)" : ""}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Product Name" htmlFor="name" required>
          <Input id="name" name="name" required defaultValue={product?.name} placeholder="e.g. Sinandomeng (Local)" />
        </Field>

        <Field label="Unit" htmlFor="unit" required hint="kg, tray, sack, piece">
          <Select id="unit" name="unit" defaultValue={product?.unit ?? "kg"} required>
            {UNIT_OPTIONS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Unit Cost (₱)" htmlFor="unit_cost" required>
          <Input
            id="unit_cost"
            name="unit_cost"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={product?.unit_cost ?? 0}
          />
        </Field>

        <Field label="Markup %" htmlFor="markup_pct" required hint="Retail Price = Cost x (1 + Markup%)">
          <Input
            id="markup_pct"
            name="markup_pct"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={product?.markup_pct ?? 0}
          />
        </Field>

        <Field label="Suki / Wholesale Price (₱)" htmlFor="suki_price" hint="Optional — leave blank if not set yet">
          <Input
            id="suki_price"
            name="suki_price"
            type="number"
            step="0.01"
            min="0"
            defaultValue={product?.suki_price ?? undefined}
          />
        </Field>

        <Field label="Low Stock Alert Level" htmlFor="low_stock_threshold" hint="Warn when Ending Qty drops to this or below">
          <Input
            id="low_stock_threshold"
            name="low_stock_threshold"
            type="number"
            step="0.01"
            min="0"
            defaultValue={product?.low_stock_threshold ?? 0}
          />
        </Field>

        <Field
          label="Barcode"
          htmlFor="barcode"
          hint="Para lang sa pre-packaged items (UPC/EAN). Iwanang blangko ang loose/timbangin na produkto."
        >
          <Input
            id="barcode"
            name="barcode"
            inputMode="numeric"
            defaultValue={product?.barcode ?? defaultBarcode ?? ""}
            placeholder="e.g. 4800016151234"
          />
        </Field>

        <Field label="Status" htmlFor="is_active">
          <label className="tap-target flex items-center gap-3 rounded-xl border border-sibol-green/20 px-3.5 py-2.5">
            <input
              id="is_active"
              name="is_active"
              type="checkbox"
              className="h-5 w-5 accent-butil-gold"
              defaultChecked={product?.is_active ?? true}
            />
            <span className="text-sm font-bold">Active (shown in Sales / Purchases dropdowns)</span>
          </label>
        </Field>
      </div>

      <Field label="Notes" htmlFor="notes">
        <Textarea id="notes" name="notes" defaultValue={product?.notes ?? ""} placeholder="Optional notes" />
      </Field>

      {state.error ? (
        <p className="rounded-xl bg-lupang-sunog/10 px-3.5 py-2.5 text-sm font-bold text-lupang-sunog">
          {state.error}
        </p>
      ) : null}

      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Sinasave…" : product ? "I-save ang Pagbabago" : "Idagdag ang Produkto"}
        </Button>
      </div>
    </form>
  );
}
