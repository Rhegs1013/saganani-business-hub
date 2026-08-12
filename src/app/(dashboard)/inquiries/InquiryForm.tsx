"use client";

import { useActionState } from "react";
import { Button, Field, Input, Select, Textarea } from "@/components/ui";
import { INQUIRY_PLATFORMS, INQUIRY_STATUSES } from "@/lib/constants";
import { todayISO } from "@/lib/format";
import type { InquiryFormState } from "./actions";

type Inquiry = {
  id: string;
  inquiry_date: string;
  name_handle: string;
  platform: string;
  message_summary: string | null;
  status: string;
};

export function InquiryForm({
  inquiry,
  action,
}: {
  inquiry?: Inquiry;
  action: (state: InquiryFormState, formData: FormData) => Promise<InquiryFormState>;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Petsa (Date)" htmlFor="inquiry_date" required>
          <Input id="inquiry_date" name="inquiry_date" type="date" required defaultValue={inquiry?.inquiry_date ?? todayISO()} />
        </Field>

        <Field label="Name / Handle" htmlFor="name_handle" required>
          <Input id="name_handle" name="name_handle" required defaultValue={inquiry?.name_handle} />
        </Field>

        <Field label="Platform" htmlFor="platform" required>
          <Select id="platform" name="platform" defaultValue={inquiry?.platform ?? "Facebook"}>
            {INQUIRY_PLATFORMS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Status" htmlFor="status" required>
          <Select id="status" name="status" defaultValue={inquiry?.status ?? "New"}>
            {INQUIRY_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="Message Summary" htmlFor="message_summary">
        <Textarea id="message_summary" name="message_summary" defaultValue={inquiry?.message_summary ?? ""} />
      </Field>

      {state.error ? (
        <p className="rounded-xl bg-lupang-sunog/10 px-3.5 py-2.5 text-sm font-bold text-lupang-sunog">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Sinasave…" : inquiry ? "I-save ang Pagbabago" : "I-save ang Tanong"}
      </Button>
    </form>
  );
}
