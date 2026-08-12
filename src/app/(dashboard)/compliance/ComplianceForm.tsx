"use client";

import { useActionState } from "react";
import { Button, Field, Input, Select, Textarea } from "@/components/ui";
import { COMPLIANCE_STATUSES } from "@/lib/constants";
import type { ComplianceFormState } from "./actions";

type ComplianceItem = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  deadline_date: string | null;
  depends_on_item_id: string | null;
  deadline_offset_days: number | null;
  date_completed: string | null;
  reference_number: string | null;
  notes: string | null;
  sort_order: number;
};

export function ComplianceForm({
  items,
  item,
  action,
}: {
  items: { id: string; name: string }[];
  item?: ComplianceItem;
  action: (state: ComplianceFormState, formData: FormData) => Promise<ComplianceFormState>;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Requirement Name" htmlFor="name" required>
          <Input id="name" name="name" required defaultValue={item?.name} />
        </Field>

        <Field label="Status" htmlFor="status" required>
          <Select id="status" name="status" defaultValue={item?.status ?? "Not Started"}>
            {COMPLIANCE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Fixed Deadline" htmlFor="deadline_date" hint="Leave blank kung dependent sa ibang item (see below)">
          <Input id="deadline_date" name="deadline_date" type="date" defaultValue={item?.deadline_date ?? ""} />
        </Field>

        <Field label="Date Completed" htmlFor="date_completed">
          <Input id="date_completed" name="date_completed" type="date" defaultValue={item?.date_completed ?? ""} />
        </Field>

        <Field label="Depends on" htmlFor="depends_on_item_id" hint="e.g. BIR Registration depends on DTI">
          <Select id="depends_on_item_id" name="depends_on_item_id" defaultValue={item?.depends_on_item_id ?? ""}>
            <option value="">— Wala —</option>
            {items
              .filter((i) => i.id !== item?.id)
              .map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
          </Select>
        </Field>

        <Field label="Days after dependency" htmlFor="deadline_offset_days" hint="e.g. 30 for BIR (30 days from DTI completion)">
          <Input
            id="deadline_offset_days"
            name="deadline_offset_days"
            type="number"
            min="0"
            defaultValue={item?.deadline_offset_days ?? ""}
          />
        </Field>

        <Field label="Reference / Certificate Number" htmlFor="reference_number">
          <Input id="reference_number" name="reference_number" defaultValue={item?.reference_number ?? ""} />
        </Field>

        <Field label="Order" htmlFor="sort_order">
          <Input id="sort_order" name="sort_order" type="number" defaultValue={item?.sort_order ?? 0} />
        </Field>
      </div>

      <Field label="Description" htmlFor="description">
        <Textarea id="description" name="description" defaultValue={item?.description ?? ""} />
      </Field>

      <Field label="Notes" htmlFor="notes">
        <Textarea id="notes" name="notes" defaultValue={item?.notes ?? ""} />
      </Field>

      {state.error ? (
        <p className="rounded-xl bg-lupang-sunog/10 px-3.5 py-2.5 text-sm font-bold text-lupang-sunog">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Sinasave…" : item ? "I-save ang Pagbabago" : "Idagdag"}
      </Button>
    </form>
  );
}
