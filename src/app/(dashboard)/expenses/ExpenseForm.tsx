"use client";

import { useActionState } from "react";
import { Button, Field, Input, Select, Textarea } from "@/components/ui";
import { EXPENSE_CATEGORIES, EXPENSE_PAYMENT_METHODS } from "@/lib/constants";
import { todayISO } from "@/lib/format";
import type { ExpenseFormState } from "./actions";

type Expense = {
  id: string;
  expense_date: string;
  category: string;
  description: string;
  amount: number;
  payment_method: string | null;
  notes: string | null;
};

export function ExpenseForm({
  expense,
  action,
}: {
  expense?: Expense;
  action: (state: ExpenseFormState, formData: FormData) => Promise<ExpenseFormState>;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Petsa (Date)" htmlFor="expense_date" required>
          <Input id="expense_date" name="expense_date" type="date" required defaultValue={expense?.expense_date ?? todayISO()} />
        </Field>

        <Field label="Category" htmlFor="category" required>
          <Select id="category" name="category" required defaultValue={expense?.category ?? ""}>
            <option value="" disabled>
              Piliin ang category
            </option>
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Description" htmlFor="description" required>
          <Input id="description" name="description" required defaultValue={expense?.description} />
        </Field>

        <Field label="Amount (₱)" htmlFor="amount" required>
          <Input id="amount" name="amount" type="number" step="0.01" min="0.01" required defaultValue={expense?.amount ?? 0} />
        </Field>

        <Field label="Payment Method" htmlFor="payment_method">
          <Select id="payment_method" name="payment_method" defaultValue={expense?.payment_method ?? "Cash"}>
            {EXPENSE_PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="Notes" htmlFor="notes">
        <Textarea id="notes" name="notes" defaultValue={expense?.notes ?? ""} />
      </Field>

      {state.error ? (
        <p className="rounded-xl bg-lupang-sunog/10 px-3.5 py-2.5 text-sm font-bold text-lupang-sunog">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Sinasave…" : expense ? "I-save ang Pagbabago" : "I-save ang Gastos"}
      </Button>
    </form>
  );
}
