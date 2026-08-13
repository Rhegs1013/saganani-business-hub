"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { Html5Qrcode as Html5QrcodeType } from "html5-qrcode";

// Full-screen camera scanner used by the POS Sell and Restock screens.
// The html5-qrcode library is loaded lazily (browser-only) so this file
// stays safe to import from a server-rendered tree.
export function BarcodeScanner({
  onScan,
  onClose,
}: {
  onScan: (code: string) => void;
  onClose: () => void;
}) {
  const regionId = `barcode-scanner-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const scannerRef = useRef<Html5QrcodeType | null>(null);
  const handledRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    import("html5-qrcode").then(({ Html5Qrcode }) => {
      if (cancelled) return;
      const scanner = new Html5Qrcode(regionId, { verbose: false });
      scannerRef.current = scanner;

      scanner
        .start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 260, height: 160 } },
          (decodedText) => {
            if (handledRef.current) return;
            handledRef.current = true;
            scanner.stop().catch(() => {});
            onScan(decodedText.trim());
          },
          () => {
            // per-frame "no code found" - expected constantly, ignore
          },
        )
        .catch(() => {
          setError("Hindi ma-access ang camera. Payagan ang camera access sa browser settings.");
        });
    });

    return () => {
      cancelled = true;
      const scanner = scannerRef.current;
      if (scanner) {
        scanner
          .stop()
          .then(() => scanner.clear())
          .catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regionId]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-sibol-green/95 p-4">
      <div className="flex items-center justify-between pb-4">
        <p className="font-extrabold text-lg text-bigas-cream">I-scan ang Barcode</p>
        <button
          type="button"
          onClick={onClose}
          className="tap-target rounded-xl bg-bigas-cream/10 px-4 font-bold text-bigas-cream"
        >
          ✕ Isara
        </button>
      </div>

      {error ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <p className="max-w-xs rounded-xl bg-lupang-sunog/20 p-4 text-sm font-bold text-bigas-cream">{error}</p>
          <button
            type="button"
            onClick={onClose}
            className="tap-target rounded-xl bg-butil-gold px-5 font-bold text-sibol-green"
          >
            Bumalik
          </button>
        </div>
      ) : (
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center">
          <div id={regionId} className="w-full overflow-hidden rounded-2xl" />
          <p className="mt-4 text-center text-sm text-bigas-cream/80">
            Ituon ang camera sa barcode ng produkto
          </p>
        </div>
      )}
    </div>
  );
}
