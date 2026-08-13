"use client";

import { useState, useTransition } from "react";
import { Combobox } from "@/components/Combobox";
import { Button } from "@/components/ui";
import { linkBarcodeToProduct } from "@/app/(dashboard)/pricing/actions";

type ProductOption = { id: string; name: string; unit: string };

// Shown when a scanned barcode doesn't match any product. Offers linking it
// to an existing product (fast path for "we already sell this, just never
// scanned it before") or creating a brand-new product with the barcode
// pre-filled in Pricing Master.
export function UnknownBarcodeSheet({
  barcode,
  products,
  onClose,
  onLinked,
}: {
  barcode: string;
  products: ProductOption[];
  onClose: () => void;
  onLinked: (productId: string) => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-sibol-green/50 sm:items-center">
      <div className="w-full max-w-md rounded-t-3xl bg-bigas-cream p-6 sm:rounded-3xl">
        <p className="font-extrabold text-lg text-sibol-green">Hindi Nakilalang Barcode</p>
        <p className="mt-1 font-mono text-sm text-sibol-green/60">{barcode}</p>

        <div className="mt-5 flex flex-col gap-4">
          <div>
            <p className="mb-2 text-sm font-bold text-sibol-green">I-link sa existing na produkto</p>
            <Combobox
              name="link_product"
              options={products.map((p) => ({ id: p.id, label: p.name, sublabel: p.unit }))}
              placeholder="Hanapin ang produkto…"
              onSelect={(option) => setSelectedId(option?.id ?? null)}
            />
            <Button
              type="button"
              variant="accent"
              size="sm"
              className="mt-3 w-full"
              disabled={!selectedId || pending}
              onClick={() => {
                if (!selectedId) return;
                setError(null);
                startTransition(async () => {
                  try {
                    await linkBarcodeToProduct(selectedId, barcode);
                    onLinked(selectedId);
                  } catch (e) {
                    setError(e instanceof Error ? e.message : "May problema sa pag-link.");
                  }
                });
              }}
            >
              {pending ? "Sinasave…" : "I-link ang Barcode"}
            </Button>
          </div>

          {error ? (
            <p className="rounded-xl bg-lupang-sunog/10 px-3.5 py-2.5 text-sm font-bold text-lupang-sunog">{error}</p>
          ) : null}

          <div className="border-t border-sibol-green/10 pt-4 text-center">
            <p className="mb-2 text-sm text-sibol-green/60">o kung bagong produkto talaga ito</p>
            <a
              href={`/pricing/new?barcode=${encodeURIComponent(barcode)}`}
              className="tap-target inline-flex w-full items-center justify-center rounded-xl border-2 border-sibol-green px-5 font-bold text-sibol-green hover:bg-sibol-green/5"
            >
              Gumawa ng Bagong Produkto
            </a>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="tap-target rounded-xl px-5 font-bold text-sibol-green/60 hover:text-sibol-green"
          >
            Kanselahin
          </button>
        </div>
      </div>
    </div>
  );
}
