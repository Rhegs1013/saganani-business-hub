"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { NAV_GROUPS } from "@/lib/nav";

export function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-6">
      {NAV_GROUPS.map((group) => (
        <div key={group.title}>
          <p className="mb-2 px-3 text-xs font-bold uppercase tracking-wide text-bigas-cream/50">
            {group.title}
          </p>
          <ul className="flex flex-col gap-1">
            {group.items.map((item) => {
              const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    className={clsx(
                      "tap-target flex items-center gap-3 rounded-xl px-3 py-2.5 font-bold text-sm transition-colors",
                      active
                        ? "bg-butil-gold text-sibol-green"
                        : "text-bigas-cream/90 hover:bg-white/10",
                    )}
                  >
                    <span aria-hidden className="text-lg">
                      {item.icon}
                    </span>
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
