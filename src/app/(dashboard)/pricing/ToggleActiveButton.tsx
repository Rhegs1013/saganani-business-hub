"use client";

import { useTransition } from "react";
import { toggleProductActive } from "./actions";

export function ToggleActiveButton({ id, isActive }: { id: string; isActive: boolean }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => toggleProductActive(id, !isActive))}
      className="font-bold text-sibol-green/60 hover:text-sibol-green hover:underline disabled:opacity-50"
    >
      {isActive ? "Deactivate" : "Activate"}
    </button>
  );
}
