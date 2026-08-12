"use client";

import dynamic from "next/dynamic";
import { useActionState, useMemo, useState } from "react";
import { Button, Field, Input, Select, Textarea } from "@/components/ui";
import { Combobox } from "@/components/Combobox";
import { CUSTOMER_TYPES, ORDER_SOURCES, ORDER_STATUSES, SALE_PAYMENT_METHODS } from "@/lib/constants";
import { formatPeso, todayISO } from "@/lib/format";
import type { SaleFormState } from "./actions";

const LocationPicker = dynamic(() => import("@/components/LocationPicker").then((m) => m.LocationPicker), {
  ssr: false,
  loading: () => (
    <div className="flex h-56 items-center justify-center rounded-xl border border-sibol-green/20 bg-sibol-green/5 text-sm text-sibol-green/60">
      Loading map…
    </div>
  ),
});

type Category = { id: string; name: string };
type Product = { id: string; category_id: string; name: string; unit: string; retail_price: number };
type Customer = { id: string; name: string; customer_type: string; address: string | null; lat: number | null; lng: number | null };
type Sale = {
  id: string;
  sale_date: string;
  customer_id: string | null;
  customer_type: string;
  category_id: string;
  product_id: string;
  qty: number;
  unit: string;
  unit_price: number;
  payment_method: string;
  order_source: string;
  order_status: string;
  is_delivery: boolean;
  delivery_address: string | null;
  delivery_lat: number | null;
  delivery_lng: number | null;
  notes: string | null;
};

export function SaleForm({
  categories,
  products,
  customers,
  sale,
  action,
}: {
  categories: Category[];
  products: Product[];
  customers: Customer[];
  sale?: Sale;
  action: (state: SaleFormState, formData: FormData) => Promise<SaleFormState>;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const [categoryId, setCategoryId] = useState(sale?.category_id ?? categories[0]?.id ?? "");
  const [productId, setProductId] = useState(sale?.product_id ?? "");
  const [unit, setUnit] = useState(sale?.unit ?? "");
  const [unitPrice, setUnitPrice] = useState(sale?.unit_price ?? 0);
  const [qty, setQty] = useState(sale?.qty ?? 1);
  const [customerType, setCustomerType] = useState(sale?.customer_type ?? "Retail");
  const [isDelivery, setIsDelivery] = useState(sale?.is_delivery ?? false);
  const [deliveryAddress, setDeliveryAddress] = useState(sale?.delivery_address ?? "");
  const [lat, setLat] = useState<number | null>(sale?.delivery_lat ?? null);
  const [lng, setLng] = useState<number | null>(sale?.delivery_lng ?? null);

  const initialCustomer = customers.find((c) => c.id === sale?.customer_id);

  const productsInCategory = useMemo(
    () => products.filter((p) => p.category_id === categoryId),
    [products, categoryId],
  );

  function handleProductChange(id: string) {
    setProductId(id);
    const product = products.find((p) => p.id === id);
    if (product) {
      setUnit(product.unit);
      setUnitPrice(product.retail_price);
    }
  }

  function handleCustomerSelect(customerId: string) {
    const customer = customers.find((c) => c.id === customerId);
    if (customer) {
      setCustomerType(customer.customer_type);
      if (customer.address && !deliveryAddress) setDeliveryAddress(customer.address);
      if (customer.lat != null && customer.lng != null) {
        setLat(customer.lat);
        setLng(customer.lng);
      }
    }
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Petsa (Date)" htmlFor="sale_date" required>
          <Input id="sale_date" name="sale_date" type="date" required defaultValue={sale?.sale_date ?? todayISO()} />
        </Field>

        <Field label="Customer" htmlFor="customer_id" hint="Mag-type para maghanap, o iwanang blangko para sa walk-in">
          <Combobox
            name="customer_id"
            options={customers.map((c) => ({ id: c.id, label: c.name, sublabel: c.customer_type }))}
            defaultValue={sale?.customer_id ?? undefined}
            defaultLabel={initialCustomer?.name}
            placeholder="Hanapin ang customer…"
            onSelect={(option) => option && handleCustomerSelect(option.id)}
          />
        </Field>

        <Field label="Customer Type" htmlFor="customer_type" required>
          <Select
            id="customer_type"
            name="customer_type"
            value={customerType}
            onChange={(e) => setCustomerType(e.target.value)}
          >
            {CUSTOMER_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
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

        <Field label="Unit Price (₱)" htmlFor="unit_price" required hint="Auto-fill mula sa Pricing, pwedeng palitan">
          <Input
            id="unit_price"
            name="unit_price"
            type="number"
            step="0.01"
            min="0"
            required
            value={unitPrice}
            onChange={(e) => setUnitPrice(Number(e.target.value))}
          />
        </Field>

        <Field label="Total Sale" htmlFor="total_sale_preview">
          <div className="tap-target flex items-center rounded-xl bg-sibol-green/5 px-3.5 py-2.5 font-extrabold text-sibol-green">
            {formatPeso(qty * unitPrice)}
          </div>
        </Field>

        <Field label="Payment Method" htmlFor="payment_method" required>
          <Select id="payment_method" name="payment_method" defaultValue={sale?.payment_method ?? "Cash"}>
            {SALE_PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Order Source" htmlFor="order_source" required>
          <Select id="order_source" name="order_source" defaultValue={sale?.order_source ?? "In-store"}>
            {ORDER_SOURCES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Order Status" htmlFor="order_status" required>
          <Select id="order_status" name="order_status" defaultValue={sale?.order_status ?? "New"}>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="May delivery?" htmlFor="is_delivery">
          <label className="tap-target flex items-center gap-3 rounded-xl border border-sibol-green/20 px-3.5 py-2.5">
            <input
              id="is_delivery"
              name="is_delivery"
              type="checkbox"
              className="h-5 w-5 accent-butil-gold"
              checked={isDelivery}
              onChange={(e) => setIsDelivery(e.target.checked)}
            />
            <span className="text-sm font-bold">Ipapadeliver ang order na ito</span>
          </label>
        </Field>
      </div>

      {isDelivery ? (
        <div className="flex flex-col gap-4 rounded-2xl border border-butil-gold/30 bg-butil-gold/5 p-4">
          <Field label="Delivery Address" htmlFor="delivery_address">
            <Textarea
              id="delivery_address"
              name="delivery_address"
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
            />
          </Field>
          <Field label="Delivery Location Pin" htmlFor="delivery_lat" hint="I-tap ang mapa para markahan ang lokasyon">
            <LocationPicker
              lat={lat}
              lng={lng}
              onChange={(newLat, newLng) => {
                setLat(newLat);
                setLng(newLng);
              }}
            />
            <input type="hidden" name="delivery_lat" value={lat ?? ""} />
            <input type="hidden" name="delivery_lng" value={lng ?? ""} />
          </Field>
        </div>
      ) : null}

      <Field label="Notes" htmlFor="notes">
        <Textarea id="notes" name="notes" defaultValue={sale?.notes ?? ""} />
      </Field>

      {state.error ? (
        <p className="rounded-xl bg-lupang-sunog/10 px-3.5 py-2.5 text-sm font-bold text-lupang-sunog">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Sinasave…" : sale ? "I-save ang Pagbabago" : "I-save ang Benta"}
      </Button>
    </form>
  );
}
