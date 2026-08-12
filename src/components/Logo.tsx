import { clsx } from "clsx";

// Placeholder for the abstract flowing "S" mark. Swap the <span> below for
// an <Image src="/logo.svg" .../> once Regie drops the real logo file into
// /public/logo.svg (see the Technical README, "Adding the real logo").
export function Logo({ size = 40, showWordmark = true }: { size?: number; showWordmark?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        aria-hidden
        className="flex items-center justify-center rounded-xl border-2 border-dashed border-butil-gold bg-sibol-green font-extrabold text-butil-gold"
        style={{ width: size, height: size, fontSize: size * 0.45 }}
        title="Logo placeholder — replace with the SAGANANI.PH mark (/public/logo.svg)"
      >
        S
      </span>
      {showWordmark ? (
        <span className={clsx("font-extrabold leading-tight text-sibol-green")}>
          <span className="block text-base sm:text-lg">SAGANANI.PH</span>
          <span className="block font-tagline text-xs italic font-medium text-lupang-sunog">
            Sagana sa Bahay, Sagana sa Buhay
          </span>
        </span>
      ) : null}
    </div>
  );
}
