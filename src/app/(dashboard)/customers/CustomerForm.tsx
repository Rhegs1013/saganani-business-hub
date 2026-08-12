"use client";

import dynamic from "next/dynamic";
import { useActionState, useState } from "react";
import { Button, Field, Input, Select, Textarea } from "@/components/ui";
import { CUSTOMER_TYPES } from "@/lib/constants";
import type { CustomerFormState } from "./actions";

const LocationPicker = dynamic(() => import("@/components/LocationPicker").then((m) => m.LocationPicker), {
  ssr: false,
  loading: () => (
    <div className="flex h-64 items-center justify-center rounded-xl border border-sibol-green/20 bg-sibol-green/5 text-sm text-sibol-green/60 sm:h-80">
      Loading map…
    </div>
  ),
});

type Customer = {
  id: string;
  name: string;
  contact_number: string | null;
  fb_handle: string | null;
  tiktok_handle: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  customer_type: string;
  customer_type_override: boolean;
  notes: string | null;
};

export function CustomerForm({
  customer,
  action,
}: {
  customer?: Customer;
  action: (state: CustomerFormState, formData: FormData) => Promise<CustomerFormState>;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const [lat, setLat] = useState<number | null>(customer?.lat ?? null);
  const [lng, setLng] = useState<number | null>(customer?.lng ?? null);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Pangalan (Name)" htmlFor="name" required>
          <Input id="name" name="name" required defaultValue={customer?.name} />
        </Field>

        <Field label="Contact Number" htmlFor="contact_number">
          <Input id="contact_number" name="contact_number" type="tel" defaultValue={customer?.contact_number ?? ""} />
        </Field>

        <Field label="Facebook Handle" htmlFor="fb_handle">
          <Input id="fb_handle" name="fb_handle" defaultValue={customer?.fb_handle ?? ""} />
        </Field>

        <Field label="TikTok Handle" htmlFor="tiktok_handle">
          <Input id="tiktok_handle" name="tiktok_handle" defaultValue={customer?.tiktok_handle ?? ""} />
        </Field>

        <Field label="Customer Type" htmlFor="customer_type" required>
          <Select id="customer_type" name="customer_type" defaultValue={customer?.customer_type ?? "Retail"}>
            {CUSTOMER_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          label="Manual override?"
          htmlFor="customer_type_override"
          hint="I-check kung gusto mong manatili ang Customer Type na ito (huwag i-auto-update ng system)"
        >
          <label className="tap-target flex items-center gap-3 rounded-xl border border-sibol-green/20 px-3.5 py-2.5">
            <input
              id="customer_type_override"
              name="customer_type_override"
              type="checkbox"
              className="h-5 w-5 accent-butil-gold"
              defaultChecked={customer?.customer_type_override ?? false}
            />
            <span className="text-sm font-bold">Lock this type</span>
          </label>
        </Field>
      </div>

      <Field label="Address" htmlFor="address">
        <Textarea id="address" name="address" defaultValue={customer?.address ?? ""} placeholder="Free text address" />
      </Field>

      <Field label="Delivery Location Pin" htmlFor="lat" hint="I-tap ang mapa para markahan ang delivery address (kung applicable)">
        <LocationPicker
          lat={lat}
          lng={lng}
          onChange={(newLat, newLng) => {
            setLat(newLat);
            setLng(newLng);
          }}
        />
        <input type="hidden" name="lat" value={lat ?? ""} />
        <input type="hidden" name="lng" value={lng ?? ""} />
      </Field>

      <Field label="Notes" htmlFor="notes">
        <Textarea id="notes" name="notes" defaultValue={customer?.notes ?? ""} />
      </Field>

      {state.error ? (
        <p className="rounded-xl bg-lupang-sunog/10 px-3.5 py-2.5 text-sm font-bold text-lupang-sunog">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Sinasave…" : customer ? "I-save ang Pagbabago" : "Idagdag ang Customer"}
      </Button>
    </form>
  );
}
