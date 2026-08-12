"use client";

import { useTransition } from "react";
import { deleteSupplier } from "./actions";

export function DeleteButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (confirm("Alisin ang supplier na ito?")) {
          startTransition(() => deleteSupplier(id));
        }
      }}
      className="font-bold text-lupang-sunog hover:underline disabled:opacity-50"
    >
      Delete
    </button>
  );
}
