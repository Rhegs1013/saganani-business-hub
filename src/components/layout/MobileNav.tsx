"use client";

import { useState } from "react";
import { Logo } from "@/components/Logo";
import { NavLinks } from "@/components/layout/NavLinks";

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label="Open menu"
        onClick={() => setOpen(true)}
        className="tap-target flex items-center justify-center rounded-xl border border-sibol-green/20 px-3"
      >
        <span className="text-2xl leading-none">☰</span>
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex">
          <button
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-sibol-green/50"
          />
          <div className="relative flex h-full w-[82%] max-w-xs flex-col gap-6 overflow-y-auto bg-sibol-green px-4 py-5">
            <div className="flex items-center justify-between">
              <Logo size={34} />
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setOpen(false)}
                className="tap-target flex items-center justify-center rounded-xl text-bigas-cream"
              >
                <span className="text-2xl leading-none">✕</span>
              </button>
            </div>
            <NavLinks onNavigate={() => setOpen(false)} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
