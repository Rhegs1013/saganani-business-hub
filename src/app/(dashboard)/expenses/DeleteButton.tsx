"use client";

import { useTransition } from "react";
import { deleteExpense } from "./actions";

export function DeleteButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (confirm("Alisin ang gastos na ito?")) {
          startTransition(() => deleteExpense(id));
        }
      }}
      className="font-bold text-lupang-sunog hover:underline disabled:opacity-50"
    >
      Delete
    </button>
  );
}
