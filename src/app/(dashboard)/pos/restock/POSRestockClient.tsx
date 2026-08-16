"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { clsx } from "clsx";
import { useRouter } from "next/navigation";
import { Badge, Button, EmptyState, Field, Input, Select, Textarea } from "@/components/ui";
import { UnknownBarcodeSheet } from "@/components/UnknownBarcodeSheet";
import { formatNumber, formatPeso } from "@/lib/format";
import { PAYMENT_STATUSES } from "@/lib/constants";
import { completePOSRestock, type POSRestockLine } from "./actions";

const BarcodeScanner = dynamic(() => import("@/components/BarcodeScanner").then((m) => m.BarcodeScanner), {
  ssr: false,
});

type Category = { id: string; name: string };
type Product = {
  id: string;
  category_id: string;
  name: string;
  unit: string;
  unit_cost: number;
  barcode: string | null;
};
type Supplier = { id: string; name: string };

type QueueLine = {
  key: string;
  product_id: string;
  category_id: string;
  name: string;
  unit: string;
  qty: number;
  unit_cost: number;
  supplier_id: string | null;
  supplier_name: string | null;
};

type Confirmation = { lines: QueueLine[]; total: number; at: string };

const QUEUE_STORAGE_KEY = "saganani-pos-restock-queue";

export function POSRestockClient({
  categories,
  products,
  suppliers,
}: {
  categories: Category[];
  products: Product[];
  suppliers: Supplier[];
}) {
  const router = useRouter();
  const [activeCategoryId, setActiveCategoryId] = useState(categories[0]?.id ?? "");
  const [queue, setQueue] = useState<QueueLine[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [unknownBarcode, setUnknownBarcode] = useState<string | null>(null);
  const [entryProduct, setEntryProduct] = useState<Product | null>(null);
  const [queueOpen, setQueueOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [lastSupplierId, setLastSupplierId] = useState<string | null>(null);

  // One-time hydration from localStorage so a mid-restock page refresh
  // doesn't lose the queue. Runs once on mount (empty deps) - not a
  // render-loop risk, so the setState-in-effect rule is bypassed here.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(QUEUE_STORAGE_KEY);
      if (raw) setQueue(JSON.parse(raw));
    } catch {
      // ignore corrupt storage
    }
    setHydrated(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Prefetch the scanner library in the background as soon as this screen
  // is open, so tapping "Scan Barcode" later doesn't wait on a network
  // fetch - iOS Safari can drop the camera-permission user gesture if
  // getUserMedia is requested too long after the tap.
  useEffect(() => {
    import("@/components/BarcodeScanner");
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
  }, [queue, hydrated]);

  const barcodedCount = useMemo(() => products.filter((p) => p.barcode).length, [products]);
  const productsInCategory = useMemo(
    () => products.filter((p) => p.category_id === activeCategoryId),
    [products, activeCategoryId],
  );

  const total = queue.reduce((sum, line) => sum + line.qty * line.unit_cost, 0);
  const itemCount = queue.length;

  function addToQueue(line: Omit<QueueLine, "key">) {
    setQueue((prev) => [...prev, { ...line, key: `${line.product_id}-${Date.now()}` }]);
    setLastSupplierId(line.supplier_id);
  }

  function removeLine(key: string) {
    setQueue((prev) => prev.filter((l) => l.key !== key));
  }

  function handleScan(code: string) {
    setScanning(false);
    const match = products.find((p) => p.barcode === code);
    if (match) {
      setEntryProduct(match);
    } else {
      setUnknownBarcode(code);
    }
  }

  function handleBarcodeLinked(productId: string) {
    const product = products.find((p) => p.id === productId);
    setUnknownBarcode(null);
    if (product) setEntryProduct(product);
  }

  async function handleConfirm(meta: { payment_status: string; notes: string | null }) {
    const lines: POSRestockLine[] = queue.map((l) => ({
      product_id: l.product_id,
      category_id: l.category_id,
      supplier_id: l.supplier_id,
      qty: l.qty,
      unit: l.unit,
      unit_cost: l.unit_cost,
    }));
    const result = await completePOSRestock(lines, meta);
    if (result.error) return result.error;

    setConfirmation({ lines: queue, total, at: new Date().toISOString() });
    setQueue([]);
    window.localStorage.removeItem(QUEUE_STORAGE_KEY);
    setConfirmOpen(false);
    router.refresh();
    return null;
  }

  return (
    <div className="pb-28">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-extrabold text-2xl text-sibol-green">Restock (Pagdating ng Paninda)</h1>
          <p className="text-sibol-green/70">Mula sa palengke o supplier delivery</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Button type="button" variant="accent" onClick={() => setScanning(true)}>
            📷 Scan Barcode
          </Button>
          {barcodedCount > 0 ? (
            <span className="text-xs text-sibol-green/50">{barcodedCount} produkto ang may barcode</span>
          ) : null}
        </div>
      </div>

      {categories.length === 0 ? (
        <EmptyState title="Walang active na category" description="I-activate ang category sa Pricing Master." />
      ) : (
        <>
          <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setActiveCategoryId(c.id)}
                className={clsx(
                  "tap-target whitespace-nowrap rounded-xl px-4 font-bold text-sm transition-colors",
                  activeCategoryId === c.id
                    ? "bg-sibol-green text-bigas-cream"
                    : "border border-sibol-green/20 text-sibol-green hover:bg-sibol-green/5",
                )}
              >
                {c.name}
              </button>
            ))}
          </div>

          {productsInCategory.length === 0 ? (
            <EmptyState title="Walang produkto sa category na ito" />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {productsInCategory.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setEntryProduct(p)}
                  className="flex flex-col items-start gap-1 rounded-2xl border border-sibol-green/10 bg-white p-4 text-left shadow-sm active:bg-butil-gold/10"
                >
                  <span className="font-bold text-sibol-green">{p.name}</span>
                  <span className="text-sm text-sibol-green/60">
                    {p.unit} · huling cost {formatPeso(p.unit_cost)}
                  </span>
                  {p.barcode ? (
                    <Badge tone="gold" className="mt-1">
                      may barcode
                    </Badge>
                  ) : null}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {queue.length > 0 ? (
        <button
          type="button"
          onClick={() => setQueueOpen(true)}
          className="tap-target fixed inset-x-4 bottom-4 z-40 flex items-center justify-between rounded-2xl bg-sibol-green px-5 py-4 text-bigas-cream shadow-xl sm:inset-x-auto sm:right-6 sm:w-96"
        >
          <span className="font-bold">
            {itemCount} item{itemCount !== 1 ? "s" : ""}
          </span>
          <span className="font-extrabold text-lg">{formatPeso(total)} · Tingnan ang Listahan</span>
        </button>
      ) : null}

      {entryProduct ? (
        <RestockEntryModal
          product={entryProduct}
          suppliers={suppliers}
          defaultSupplierId={lastSupplierId}
          onConfirm={(line) => {
            addToQueue(line);
            setEntryProduct(null);
          }}
          onClose={() => setEntryProduct(null)}
        />
      ) : null}

      {scanning ? <BarcodeScanner onScan={handleScan} onClose={() => setScanning(false)} /> : null}

      {unknownBarcode ? (
        <UnknownBarcodeSheet
          barcode={unknownBarcode}
          products={products.map((p) => ({ id: p.id, name: p.name, unit: p.unit }))}
          onClose={() => setUnknownBarcode(null)}
          onLinked={handleBarcodeLinked}
        />
      ) : null}

      {queueOpen ? (
        <QueueSheet
          queue={queue}
          onClose={() => setQueueOpen(false)}
          onRemove={removeLine}
          onConfirm={() => {
            setQueueOpen(false);
            setConfirmOpen(true);
          }}
        />
      ) : null}

      {confirmOpen ? (
        <ConfirmRestockSheet total={total} onClose={() => setConfirmOpen(false)} onComplete={handleConfirm} />
      ) : null}

      {confirmation ? <ConfirmationView confirmation={confirmation} onClose={() => setConfirmation(null)} /> : null}
    </div>
  );
}

function RestockEntryModal({
  product,
  suppliers,
  defaultSupplierId,
  onConfirm,
  onClose,
}: {
  product: Product;
  suppliers: Supplier[];
  defaultSupplierId: string | null;
  onConfirm: (line: Omit<QueueLine, "key">) => void;
  onClose: () => void;
}) {
  const [qty, setQty] = useState("1");
  const [unitCost, setUnitCost] = useState(String(product.unit_cost));
  const [supplierId, setSupplierId] = useState(defaultSupplierId ?? "");

  const qtyNum = Number(qty) || 0;
  const costNum = Number(unitCost) || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-sibol-green/50 sm:items-center">
      <div className="w-full max-w-sm rounded-t-3xl bg-bigas-cream p-6 sm:rounded-3xl">
        <p className="font-extrabold text-lg text-sibol-green">{product.name}</p>
        <p className="mb-4 text-sm text-sibol-green/60">{product.unit}</p>

        <div className="flex flex-col gap-4">
          <Field label="Qty Received" htmlFor="restock_qty" required>
            <Input
              id="restock_qty"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0.01"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
            />
          </Field>

          <Field label="Unit Cost (₱)" htmlFor="restock_unit_cost" required hint="Auto-fill mula sa huling cost, pwedeng palitan">
            <Input
              id="restock_unit_cost"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={unitCost}
              onChange={(e) => setUnitCost(e.target.value)}
            />
          </Field>

          <Field label="Supplier" htmlFor="restock_supplier">
            <Select id="restock_supplier" value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
              <option value="">— Piliin —</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </Field>

          <p className="text-center font-bold text-sibol-green">Subtotal: {formatPeso(qtyNum * costNum)}</p>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" type="button" onClick={onClose}>
              Kanselahin
            </Button>
            <Button
              className="flex-1"
              type="button"
              disabled={qtyNum <= 0 || costNum < 0}
              onClick={() =>
                onConfirm({
                  product_id: product.id,
                  category_id: product.category_id,
                  name: product.name,
                  unit: product.unit,
                  qty: qtyNum,
                  unit_cost: costNum,
                  supplier_id: supplierId || null,
                  supplier_name: suppliers.find((s) => s.id === supplierId)?.name ?? null,
                })
              }
            >
              Idagdag
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function QueueSheet({
  queue,
  onClose,
  onRemove,
  onConfirm,
}: {
  queue: QueueLine[];
  onClose: () => void;
  onRemove: (key: string) => void;
  onConfirm: () => void;
}) {
  const total = queue.reduce((sum, l) => sum + l.qty * l.unit_cost, 0);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-bigas-cream">
      <div className="flex items-center justify-between border-b border-sibol-green/10 px-4 py-4">
        <p className="font-extrabold text-lg text-sibol-green">Restock List</p>
        <button type="button" onClick={onClose} className="tap-target rounded-xl px-3 font-bold text-sibol-green">
          ✕
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {queue.length === 0 ? (
          <p className="text-center text-sibol-green/60">Wala pang idinagdag.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {queue.map((line) => (
              <li key={line.key} className="rounded-2xl border border-sibol-green/10 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-sibol-green">{line.name}</p>
                    <p className="text-sm text-sibol-green/60">
                      {formatNumber(line.qty)} {line.unit} × {formatPeso(line.unit_cost)}
                      {line.supplier_name ? ` · ${line.supplier_name}` : ""}
                    </p>
                  </div>
                  <button type="button" onClick={() => onRemove(line.key)} className="font-bold text-lupang-sunog">
                    Alisin
                  </button>
                </div>
                <p className="mt-2 text-right font-extrabold text-sibol-green">
                  {formatPeso(line.qty * line.unit_cost)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="border-t border-sibol-green/10 bg-white px-4 py-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="font-bold text-sibol-green/70">Total</p>
          <p className="font-extrabold text-2xl text-sibol-green">{formatPeso(total)}</p>
        </div>
        <Button className="w-full" disabled={queue.length === 0} onClick={onConfirm} type="button">
          Kumpletuhin ang Restock
        </Button>
      </div>
    </div>
  );
}

function ConfirmRestockSheet({
  total,
  onClose,
  onComplete,
}: {
  total: number;
  onClose: () => void;
  onComplete: (meta: { payment_status: string; notes: string | null }) => Promise<string | null>;
}) {
  const [paymentStatus, setPaymentStatus] = useState("Planned");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-sibol-green/50 sm:items-center">
      <div className="w-full max-w-md rounded-t-3xl bg-bigas-cream p-6 sm:rounded-3xl">
        <p className="font-extrabold text-lg text-sibol-green">Kumpirmahin ang Restock</p>
        <p className="mt-1 mb-4 font-extrabold text-2xl text-sibol-green">{formatPeso(total)}</p>

        <div className="flex flex-col gap-4">
          <Field label="Payment Status" htmlFor="restock_payment_status" required>
            <Select id="restock_payment_status" value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}>
              {PAYMENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Note" htmlFor="restock_notes">
            <Textarea id="restock_notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" />
          </Field>

          {error ? (
            <p className="rounded-xl bg-lupang-sunog/10 px-3.5 py-2.5 text-sm font-bold text-lupang-sunog">{error}</p>
          ) : null}

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" type="button" onClick={onClose} disabled={submitting}>
              Bumalik
            </Button>
            <Button
              className="flex-1"
              type="button"
              disabled={submitting}
              onClick={async () => {
                setSubmitting(true);
                setError(null);
                const err = await onComplete({ payment_status: paymentStatus, notes: notes.trim() || null });
                setSubmitting(false);
                if (err) setError(err);
              }}
            >
              {submitting ? "Sinasave…" : "I-save ang Restock"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ConfirmationView({ confirmation, onClose }: { confirmation: Confirmation; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-sibol-green/50 p-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6">
        <p className="text-center font-extrabold text-lg text-sibol-green">Na-save ang Restock! ✅</p>
        <p className="text-center text-xs text-sibol-green/60">
          {new Date(confirmation.at).toLocaleString("en-PH")}
        </p>
        <div className="my-4 flex flex-col gap-2 border-y border-dashed border-sibol-green/20 py-4">
          {confirmation.lines.map((line) => (
            <div key={line.key} className="flex justify-between text-sm">
              <span>
                {line.name} x{formatNumber(line.qty)}
              </span>
              <span>{formatPeso(line.qty * line.unit_cost)}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between font-extrabold text-sibol-green">
          <span>Total Cost</span>
          <span>{formatPeso(confirmation.total)}</span>
        </div>
        <Button className="mt-6 w-full" type="button" onClick={onClose}>
          Bagong Restock
        </Button>
      </div>
    </div>
  );
}
