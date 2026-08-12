"use client";

import { useActionState } from "react";
import { Button, Field, Input, Select, Textarea } from "@/components/ui";
import { CONFIDENCE_LEVELS } from "@/lib/constants";
import type { SupplierFormState } from "./actions";

type Category = { id: string; name: string };
type Supplier = {
  id: string;
  category_id: string | null;
  name: string;
  location: string | null;
  distance_km: number | null;
  products_offered: string | null;
  price_benchmark: string | null;
  payment_terms: string | null;
  moq: string | null;
  delivery_available: boolean;
  contact: string | null;
  confidence_level: string;
  notes: string | null;
};

export function SupplierForm({
  categories,
  supplier,
  action,
}: {
  categories: Category[];
  supplier?: Supplier;
  action: (state: SupplierFormState, formData: FormData) => Promise<SupplierFormState>;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Category" htmlFor="category_id">
          <Select id="category_id" name="category_id" defaultValue={supplier?.category_id ?? ""}>
            <option value="">— Any —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Supplier / Lead Name" htmlFor="name" required>
          <Input id="name" name="name" required defaultValue={supplier?.name} />
        </Field>

        <Field label="Location" htmlFor="location">
          <Input id="location" name="location" defaultValue={supplier?.location ?? ""} />
        </Field>

        <Field label="Distance from San Mateo (km)" htmlFor="distance_km">
          <Input
            id="distance_km"
            name="distance_km"
            type="number"
            step="0.1"
            min="0"
            defaultValue={supplier?.distance_km ?? undefined}
          />
        </Field>

        <Field label="Products Offered" htmlFor="products_offered">
          <Input id="products_offered" name="products_offered" defaultValue={supplier?.products_offered ?? ""} />
        </Field>

        <Field label="Price Benchmark" htmlFor="price_benchmark">
          <Input id="price_benchmark" name="price_benchmark" defaultValue={supplier?.price_benchmark ?? ""} />
        </Field>

        <Field label="Payment Terms" htmlFor="payment_terms">
          <Input id="payment_terms" name="payment_terms" defaultValue={supplier?.payment_terms ?? ""} />
        </Field>

        <Field label="MOQ" htmlFor="moq" hint="Minimum order quantity">
          <Input id="moq" name="moq" defaultValue={supplier?.moq ?? ""} />
        </Field>

        <Field label="Contact / Source" htmlFor="contact">
          <Input id="contact" name="contact" defaultValue={supplier?.contact ?? ""} />
        </Field>

        <Field label="Confidence Level" htmlFor="confidence_level" required>
          <Select id="confidence_level" name="confidence_level" defaultValue={supplier?.confidence_level ?? "Unverified"}>
            {CONFIDENCE_LEVELS.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Delivery Available?" htmlFor="delivery_available">
          <label className="tap-target flex items-center gap-3 rounded-xl border border-sibol-green/20 px-3.5 py-2.5">
            <input
              id="delivery_available"
              name="delivery_available"
              type="checkbox"
              className="h-5 w-5 accent-butil-gold"
              defaultChecked={supplier?.delivery_available ?? false}
            />
            <span className="text-sm font-bold">Yes, may delivery</span>
          </label>
        </Field>
      </div>

      <Field label="Notes" htmlFor="notes">
        <Textarea id="notes" name="notes" defaultValue={supplier?.notes ?? ""} />
      </Field>

      {state.error ? (
        <p className="rounded-xl bg-lupang-sunog/10 px-3.5 py-2.5 text-sm font-bold text-lupang-sunog">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Sinasave…" : supplier ? "I-save ang Pagbabago" : "Idagdag ang Supplier"}
      </Button>
    </form>
  );
}
