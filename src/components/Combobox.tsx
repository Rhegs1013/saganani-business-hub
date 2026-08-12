"use client";

import { useId, useMemo, useRef, useState } from "react";
import { clsx } from "clsx";

export type ComboboxOption = { id: string; label: string; sublabel?: string };

export function Combobox({
  name,
  options,
  defaultValue,
  defaultLabel,
  placeholder,
  onSelect,
  required,
}: {
  name: string;
  options: ComboboxOption[];
  defaultValue?: string;
  defaultLabel?: string;
  placeholder?: string;
  onSelect?: (option: ComboboxOption | null) => void;
  required?: boolean;
}) {
  const [selectedId, setSelectedId] = useState(defaultValue ?? "");
  const [query, setQuery] = useState(defaultLabel ?? "");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || query === defaultLabel) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query, defaultLabel]);

  function selectOption(option: ComboboxOption) {
    setSelectedId(option.id);
    setQuery(option.label);
    setOpen(false);
    onSelect?.(option);
  }

  function handleBlur() {
    window.setTimeout(() => {
      if (!containerRef.current?.contains(document.activeElement)) {
        setOpen(false);
        if (!selectedId) {
          setQuery("");
        }
      }
    }, 120);
  }

  return (
    <div ref={containerRef} className="relative">
      <input type="hidden" name={name} value={selectedId} required={required} />
      <input
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        className="tap-target w-full rounded-xl border border-sibol-green/20 bg-white px-3.5 py-2.5 text-base text-sibol-green outline-none focus:border-butil-gold focus:ring-2 focus:ring-butil-gold/40"
        placeholder={placeholder}
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setSelectedId("");
          setOpen(true);
        }}
        onBlur={handleBlur}
      />
      {open && filtered.length > 0 ? (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-30 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-sibol-green/20 bg-white shadow-lg"
        >
          {filtered.map((o) => (
            <li key={o.id}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectOption(o)}
                className={clsx(
                  "flex w-full flex-col px-3.5 py-2.5 text-left hover:bg-butil-gold/10",
                  selectedId === o.id && "bg-butil-gold/20",
                )}
              >
                <span className="font-bold text-sibol-green">{o.label}</span>
                {o.sublabel ? <span className="text-xs text-sibol-green/60">{o.sublabel}</span> : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {open && filtered.length === 0 ? (
        <div className="absolute z-30 mt-1 w-full rounded-xl border border-sibol-green/20 bg-white px-3.5 py-2.5 text-sm text-sibol-green/60 shadow-lg">
          Walang nahanap
        </div>
      ) : null}
    </div>
  );
}
