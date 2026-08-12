"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";

const TABS = [
  { href: "/reports", label: "Monthly P&L" },
  { href: "/reports/cash-flow", label: "Cash Flow" },
  { href: "/reports/balance-sheet", label: "Balance Sheet" },
];

export function ReportTabs() {
  const pathname = usePathname();

  return (
    <div className="mb-6 flex gap-2 overflow-x-auto">
      {TABS.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={clsx(
            "tap-target whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-bold transition-colors",
            pathname === tab.href
              ? "bg-sibol-green text-bigas-cream"
              : "border border-sibol-green/20 text-sibol-green hover:bg-sibol-green/5",
          )}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
