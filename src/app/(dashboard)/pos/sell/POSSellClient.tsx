"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { clsx } from "clsx";
import { useRouter } from "next/navigation";
import { Badge, Button, EmptyState, Field, Select, Textarea } from "@/components/ui";
import { Combobox } from "@/components/Combobox";
import { UnknownBarcodeSheet } from "@/components/UnknownBarcodeSheet";
import { formatPeso } from "@/lib/format";
import { SALE_PAYMENT_METHODS } from "@/lib/constants";
import { completePOSSale, type POSCartLine } from "./actions";

const BarcodeScanner = dynamic(() => import("@/components/BarcodeScanner").then((m) => m.BarcodeScanner), {
  ssr: false,
});

type Category = { id: string; name: string };
type Product = {
  id: string;
  category_id: string;
  name: string;
  unit: string;
  retail_price: number;
  barcode: string | null;
};
type Customer = { id: string; name: string; customer_type: string };

type CartLine = {
  product_id: string;
  category_id: string;
  name: string;
  unit: string;
  unit_price: number;
  qty: number;
};

type Receipt = { lines: CartLine[]; total: number; paymentMethod: string; at: string };

const CART_STORAGE_KEY = "saganani-pos-sell-cart";

export function POSSellClient({
  categories,
  products,
  customers,
}: {
  categories: Category[];
  products: Product[];
  customers: Customer[];
}) {
  const router = useRouter();
  const [activeCategoryId, setActiveCategoryId] = useState(categories[0]?.id ?? "");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [unknownBarcode, setUnknownBarcode] = useState<string | null>(null);
  const [qtyProduct, setQtyProduct] = useState<Product | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [receipt, setReceipt] = useState<Receipt | null>(null);

  // One-time hydration from localStorage so a mid-sale page refresh doesn't
  // lose the cart. Runs once on mount (empty deps) - not a render-loop risk,
  // so the setState-in-effect rule is intentionally bypassed here.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(CART_STORAGE_KEY);
      if (raw) setCart(JSON.parse(raw));
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
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart, hydrated]);

  const barcodedCount = useMemo(() => products.filter((p) => p.barcode).length, [products]);
  const productsInCategory = useMemo(
    () => products.filter((p) => p.category_id === activeCategoryId),
    [products, activeCategoryId],
  );

  const total = cart.reduce((sum, line) => sum + line.qty * line.unit_price, 0);
  const itemCount = cart.reduce((sum, line) => sum + line.qty, 0);

  function addToCart(product: Product, qty: number) {
    setCart((prev) => {
      const existing = prev.find((l) => l.product_id === product.id);
      if (existing) {
        return prev.map((l) => (l.product_id === product.id ? { ...l, qty: l.qty + qty } : l));
      }
      return [
        ...prev,
        {
          product_id: product.id,
          category_id: product.category_id,
          name: product.name,
          unit: product.unit,
          unit_price: product.retail_price,
          qty,
        },
      ];
    });
  }

  function updateLineQty(productId: string, qty: number) {
    setCart((prev) =>
      qty <= 0
        ? prev.filter((l) => l.product_id !== productId)
        : prev.map((l) => (l.product_id === productId ? { ...l, qty } : l)),
    );
  }

  function removeLine(productId: string) {
    setCart((prev) => prev.filter((l) => l.product_id !== productId));
  }

  function handleScan(code: string) {
    setScanning(false);
    const match = products.find((p) => p.barcode === code);
    if (match) {
      addToCart(match, 1);
      setCartOpen(true);
    } else {
      setUnknownBarcode(code);
    }
  }

  function handleBarcodeLinked(productId: string) {
    const product = products.find((p) => p.id === productId);
    setUnknownBarcode(null);
    if (product) {
      addToCart(product, 1);
      setCartOpen(true);
    }
  }

  async function handleCheckout(meta: { customer_id: string | null; payment_method: string; notes: string | null }) {
    const lines: POSCartLine[] = cart.map((l) => ({
      product_id: l.product_id,
      category_id: l.category_id,
      qty: l.qty,
      unit: l.unit,
      unit_price: l.unit_price,
    }));
    const result = await completePOSSale(lines, meta);
    if (result.error) return result.error;

    setReceipt({ lines: cart, total, paymentMethod: meta.payment_method, at: new Date().toISOString() });
    setCart([]);
    window.localStorage.removeItem(CART_STORAGE_KEY);
    setCheckoutOpen(false);
    router.refresh();
    return null;
  }

  return (
    <div className="pb-28">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-extrabold text-2xl text-sibol-green">Benta sa Counter (POS)</h1>
          <p className="text-sibol-green/70">I-tap ang produkto o mag-scan ng barcode</p>
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
                  onClick={() => setQtyProduct(p)}
                  className="flex flex-col items-start gap-1 rounded-2xl border border-sibol-green/10 bg-white p-4 text-left shadow-sm active:bg-butil-gold/10"
                >
                  <span className="font-bold text-sibol-green">{p.name}</span>
                  <span className="text-sm text-sibol-green/60">{p.unit}</span>
                  <span className="mt-1 font-extrabold text-butil-gold">{formatPeso(p.retail_price)}</span>
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

      {cart.length > 0 ? (
        <button
          type="button"
          onClick={() => setCartOpen(true)}
          className="tap-target fixed inset-x-4 bottom-4 z-40 flex items-center justify-between rounded-2xl bg-sibol-green px-5 py-4 text-bigas-cream shadow-xl sm:inset-x-auto sm:right-6 sm:w-96"
        >
          <span className="font-bold">
            {itemCount} item{itemCount !== 1 ? "s" : ""}
          </span>
          <span className="font-extrabold text-lg">{formatPeso(total)} · Tingnan ang Cart</span>
        </button>
      ) : null}

      {qtyProduct ? (
        <QtyModal
          product={qtyProduct}
          onConfirm={(qty) => {
            addToCart(qtyProduct, qty);
            setQtyProduct(null);
          }}
          onClose={() => setQtyProduct(null)}
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

      {cartOpen ? (
        <CartSheet
          cart={cart}
          onClose={() => setCartOpen(false)}
          onUpdateQty={updateLineQty}
          onRemove={removeLine}
          onCheckout={() => {
            setCartOpen(false);
            setCheckoutOpen(true);
          }}
        />
      ) : null}

      {checkoutOpen ? (
        <CheckoutSheet
          total={total}
          customers={customers}
          onClose={() => setCheckoutOpen(false)}
          onComplete={handleCheckout}
        />
      ) : null}

      {receipt ? <ReceiptView receipt={receipt} onClose={() => setReceipt(null)} /> : null}
    </div>
  );
}

function QtyModal({
  product,
  onConfirm,
  onClose,
}: {
  product: Product;
  onConfirm: (qty: number) => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState("1");

  function press(key: string) {
    setValue((prev) => {
      if (key === "back") return prev.length <= 1 ? "0" : prev.slice(0, -1);
      if (key === ".") return prev.includes(".") ? prev : `${prev}.`;
      if (prev === "0") return key;
      return prev + key;
    });
  }

  const qty = Number(value) || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-sibol-green/50 sm:items-center">
      <div className="w-full max-w-sm rounded-t-3xl bg-bigas-cream p-6 sm:rounded-3xl">
        <p className="font-extrabold text-lg text-sibol-green">{product.name}</p>
        <p className="text-sm text-sibol-green/60">
          {formatPeso(product.retail_price)} / {product.unit}
        </p>

        <div className="my-5 rounded-2xl bg-sibol-green/5 py-6 text-center">
          <span className="font-extrabold text-4xl text-sibol-green">{value}</span>
          <span className="ml-2 text-lg text-sibol-green/60">{product.unit}</span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "back"].map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => press(key)}
              className="tap-target rounded-xl bg-white text-xl font-bold text-sibol-green shadow-sm active:bg-sibol-green/10"
            >
              {key === "back" ? "⌫" : key}
            </button>
          ))}
        </div>

        <p className="mt-4 text-center font-bold text-sibol-green">Subtotal: {formatPeso(qty * product.retail_price)}</p>

        <div className="mt-4 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose} type="button">
            Kanselahin
          </Button>
          <Button variant="primary" className="flex-1" disabled={qty <= 0} onClick={() => onConfirm(qty)} type="button">
            Idagdag sa Cart
          </Button>
        </div>
      </div>
    </div>
  );
}

function CartSheet({
  cart,
  onClose,
  onUpdateQty,
  onRemove,
  onCheckout,
}: {
  cart: CartLine[];
  onClose: () => void;
  onUpdateQty: (productId: string, qty: number) => void;
  onRemove: (productId: string) => void;
  onCheckout: () => void;
}) {
  const total = cart.reduce((sum, l) => sum + l.qty * l.unit_price, 0);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-bigas-cream">
      <div className="flex items-center justify-between border-b border-sibol-green/10 px-4 py-4">
        <p className="font-extrabold text-lg text-sibol-green">Cart</p>
        <button type="button" onClick={onClose} className="tap-target rounded-xl px-3 font-bold text-sibol-green">
          ✕
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {cart.length === 0 ? (
          <p className="text-center text-sibol-green/60">Walang laman ang cart.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {cart.map((line) => (
              <li key={line.product_id} className="rounded-2xl border border-sibol-green/10 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-sibol-green">{line.name}</p>
                    <p className="text-sm text-sibol-green/60">
                      {formatPeso(line.unit_price)} / {line.unit}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemove(line.product_id)}
                    className="font-bold text-lupang-sunog"
                  >
                    Alisin
                  </button>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onUpdateQty(line.product_id, Number((line.qty - 1).toFixed(2)))}
                      className="tap-target w-10 rounded-xl bg-sibol-green/5 font-bold text-sibol-green"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      step="0.01"
                      value={line.qty}
                      onChange={(e) => onUpdateQty(line.product_id, Number(e.target.value) || 0)}
                      className="tap-target w-20 rounded-xl border border-sibol-green/20 text-center font-bold"
                    />
                    <button
                      type="button"
                      onClick={() => onUpdateQty(line.product_id, Number((line.qty + 1).toFixed(2)))}
                      className="tap-target w-10 rounded-xl bg-sibol-green/5 font-bold text-sibol-green"
                    >
                      +
                    </button>
                  </div>
                  <p className="font-extrabold text-sibol-green">{formatPeso(line.qty * line.unit_price)}</p>
                </div>
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
        <Button className="w-full" disabled={cart.length === 0} onClick={onCheckout} type="button">
          Mag-Checkout
        </Button>
      </div>
    </div>
  );
}

function CheckoutSheet({
  total,
  customers,
  onClose,
  onComplete,
}: {
  total: number;
  customers: Customer[];
  onClose: () => void;
  onComplete: (meta: { customer_id: string | null; payment_method: string; notes: string | null }) => Promise<string | null>;
}) {
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-sibol-green/50 sm:items-center">
      <div className="w-full max-w-md rounded-t-3xl bg-bigas-cream p-6 sm:rounded-3xl">
        <p className="font-extrabold text-lg text-sibol-green">Checkout</p>
        <p className="mt-1 mb-4 font-extrabold text-2xl text-sibol-green">{formatPeso(total)}</p>

        <div className="flex flex-col gap-4">
          <Field label="Payment Method" htmlFor="pos_payment_method" required>
            <Select id="pos_payment_method" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
              {SALE_PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Customer" htmlFor="pos_customer" hint="Iwanang blangko para sa Walk-in customer">
            <Combobox
              name="pos_customer"
              options={customers.map((c) => ({ id: c.id, label: c.name, sublabel: c.customer_type }))}
              placeholder="Walk-in"
              onSelect={(option) => setCustomerId(option?.id ?? null)}
            />
          </Field>

          <Field label="Note" htmlFor="pos_notes">
            <Textarea id="pos_notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" />
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
                const err = await onComplete({
                  customer_id: customerId,
                  payment_method: paymentMethod,
                  notes: notes.trim() || null,
                });
                setSubmitting(false);
                if (err) setError(err);
              }}
            >
              {submitting ? "Sinasave…" : "Kumpletuhin ang Benta"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReceiptView({ receipt, onClose }: { receipt: Receipt; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-sibol-green/50 p-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6">
        <div>
          <p className="text-center font-extrabold text-lg text-sibol-green">SAGANANI.PH</p>
          <p className="text-center text-xs text-sibol-green/60">
            {new Date(receipt.at).toLocaleString("en-PH")}
          </p>
          <div className="my-4 flex flex-col gap-2 border-y border-dashed border-sibol-green/20 py-4">
            {receipt.lines.map((line) => (
              <div key={line.product_id} className="flex justify-between text-sm">
                <span>
                  {line.name} x{line.qty}
                </span>
                <span>{formatPeso(line.qty * line.unit_price)}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between font-extrabold text-sibol-green">
            <span>Total</span>
            <span>{formatPeso(receipt.total)}</span>
          </div>
          <p className="mt-2 text-sm text-sibol-green/60">Payment: {receipt.paymentMethod}</p>
        </div>
        <div className="no-print mt-6 flex gap-3">
          <Button variant="outline" className="flex-1" type="button" onClick={() => window.print()}>
            I-print
          </Button>
          <Button className="flex-1" type="button" onClick={onClose}>
            Bagong Benta
          </Button>
        </div>
      </div>
    </div>
  );
}
