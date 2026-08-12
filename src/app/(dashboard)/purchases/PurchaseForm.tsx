"use client";

import { useActionState, useMemo, useState } from "react";
import { Button, Field, Input, Select, Textarea } from "@/components/ui";
import { PAYMENT_STATUSES } from "@/lib/constants";
import { formatPeso, todayISO } from "@/lib/format";
import type { PurchaseFormState } from "./actions";

type Category = { id: string; name: string };
type Product = { id: string; category_id: string; name: string; unit: string; unit_cost: number };
type Supplier = { id: string; name: string };
type Purchase = {
  id: string;
  purchase_date: string;
  supplier_id: string | null;
  category_id: string;
  product_id: string;
  qty: number;
  unit: string;
  unit_cost: number;
  payment_terms: string | null;
  payment_status: string;
  notes: string | null;
};

export function PurchaseForm({
  categories,
  products,
  suppliers,
  purchase,
  action,
}: {
  categories: Category[];
  products: Product[];
  suppliers: Supplier[];
  purchase?: Purchase;
  action: (state: PurchaseFormState, formData: FormData) => Promise<PurchaseFormState>;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const [categoryId, setCategoryId] = useState(purchase?.category_id ?? categories[0]?.id ?? "");
  const [productId, setProductId] = useState(purchase?.product_id ?? "");
  const [unit, setUnit] = useState(purchase?.unit ?? "");
  const [unitCost, setUnitCost] = useState(purchase?.unit_cost ?? 0);
  const [qty, setQty] = useState(purchase?.qty ?? 1);

  const productsInCategory = useMemo(
    () => products.filter((p) => p.category_id === categoryId),
    [products, categoryId],
  );

  function handleProductChange(id: string) {
    setProductId(id);
    const product = products.find((p) => p.id === id);
    if (product) {
      setUnit(product.unit);
      setUnitCost(product.unit_cost);
    }
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Petsa (Date)" htmlFor="purchase_date" required>
          <Input id="purchase_date" name="purchase_date" type="date" required defaultValue={purchase?.purchase_date ?? todayISO()} />
        </Field>

        <Field label="Supplier" htmlFor="supplier_id">
          <Select id="supplier_id" name="supplier_id" defaultValue={purchase?.supplier_id ?? ""}>
            <option value="">— Piliin —</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Category" htmlFor="category_id" required>
          <Select
            id="category_id"
            name="category_id"
            required
            value={categoryId}
            onChange={(e) => {
              setCategoryId(e.target.value);
              setProductId("");
            }}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Produkto (Product)" htmlFor="product_id" required>
          <Select
            id="product_id"
            name="product_id"
            required
            value={productId}
            onChange={(e) => handleProductChange(e.target.value)}
          >
            <option value="" disabled>
              Piliin ang produkto
            </option>
            {productsInCategory.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Quantity" htmlFor="qty" required>
          <Input
            id="qty"
            name="qty"
            type="number"
            step="0.01"
            min="0.01"
            required
            value={qty}
            onChange={(e) => setQty(Number(e.target.value))}
          />
        </Field>

        <Field label="Unit" htmlFor="unit" required>
          <Input id="unit" name="unit" required value={unit} onChange={(e) => setUnit(e.target.value)} />
        </Field>

        <Field label="Unit Cost (₱)" htmlFor="unit_cost" required hint="Auto-fill mula sa Pricing, pwedeng palitan">
          <Input
            id="unit_cost"
            name="unit_cost"
            type="number"
            step="0.01"
            min="0"
            required
            value={unitCost}
            onChange={(e) => setUnitCost(Number(e.target.value))}
          />
        </Field>

        <Field label="Total Cost" htmlFor="total_cost_preview">
          <div className="tap-target flex items-center rounded-xl bg-sibol-green/5 px-3.5 py-2.5 font-extrabold text-sibol-green">
            {formatPeso(qty * unitCost)}
          </div>
        </Field>

        <Field label="Payment Terms" htmlFor="payment_terms">
          <Input id="payment_terms" name="payment_terms" defaultValue={purchase?.payment_terms ?? ""} placeholder="e.g. COD, 7 days" />
        </Field>

        <Field label="Payment Status" htmlFor="payment_status" required>
          <Select id="payment_status" name="payment_status" defaultValue={purchase?.payment_status ?? "Planned"}>
            {PAYMENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="Notes" htmlFor="notes">
        <Textarea id="notes" name="notes" defaultValue={purchase?.notes ?? ""} />
      </Field>

      {state.error ? (
        <p className="rounded-xl bg-lupang-sunog/10 px-3.5 py-2.5 text-sm font-bold text-lupang-sunog">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Sinasave…" : purchase ? "I-save ang Pagbabago" : "I-save ang Binili"}
      </Button>
    </form>
  );
}
