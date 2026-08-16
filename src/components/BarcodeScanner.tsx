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

    if (!navigator.mediaDevices?.getUserMedia) {
      // One-time device-capability check on mount, not a render-loop risk,
      // so the setState-in-effect rule is intentionally bypassed here.
      /* eslint-disable-next-line react-hooks/set-state-in-effect */
      setError(
        "Hindi supported ng browser na ito ang pag-access sa camera. Subukan sa Chrome o Safari, at siguraduhing HTTPS ang link.",
      );
      return;
    }

    const config = { fps: 10, qrbox: { width: 260, height: 160 } };
    const onDecoded = (decodedText: string) => {
      if (handledRef.current) return;
      handledRef.current = true;
      scannerRef.current?.stop().catch(() => {});
      onScan(decodedText.trim());
    };
    const onFrame = () => {
      // per-frame "no code found" - expected constantly, ignore
    };

    import("html5-qrcode").then(async ({ Html5Qrcode }) => {
      if (cancelled) return;
      const scanner = new Html5Qrcode(regionId, { verbose: false });
      scannerRef.current = scanner;

      // Some mobile browsers/webviews mis-handle a bare `facingMode`
      // constraint and throw instead of falling back gracefully, so we
      // retry against an explicitly-enumerated back camera before giving up.
      try {
        await scanner.start({ facingMode: "environment" }, config, onDecoded, onFrame);
        return;
      } catch {
        // fall through to camera enumeration below
      }

      try {
        const cameras = await Html5Qrcode.getCameras();
        if (cancelled || cameras.length === 0) throw new Error("no-camera");
        const backCamera = cameras.find((c) => /back|rear|environment/i.test(c.label)) ?? cameras[cameras.length - 1];
        await scanner.start(backCamera.id, config, onDecoded, onFrame);
      } catch {
        if (!cancelled) {
          setError("Hindi ma-access ang camera. Payagan ang camera access sa browser settings.");
        }
      }
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
