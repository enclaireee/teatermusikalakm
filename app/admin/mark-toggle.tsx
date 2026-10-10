"use client";

import { useOptimistic, useRef, useState, useTransition } from "react";
import { Icon } from "@/components/ui/icon";
import { setChecked } from "./actions";
import { CHECK_LABEL, checkKey, type CheckKey } from "./status-chip";

const KEYS: CheckKey[] = ["belum", "valid", "tidak"];
const VALUE: Record<CheckKey, boolean | null> = { belum: null, valid: true, tidak: false };
const SELECTED: Record<CheckKey, string> = {
  belum: "bg-bg-muted text-text-strong",
  valid: "bg-bg-brand-soft text-text-brand",
  tidak: "bg-bg-danger-soft text-text-danger",
};
const SHORT: Record<CheckKey, string> = { belum: "Belum", valid: "Valid", tidak: "Tidak" };

export function MarkToggle({ id, code, checked, size }: { id: string; code: string; checked: boolean | null; size: "sm" | "lg" }) {
  const [value, setValue] = useOptimistic(checkKey(checked));
  const [pending, start] = useTransition();
  const [error, setError] = useState(false);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  function pick(k: CheckKey) {
    if (k === value) return;
    setError(false);
    start(async () => {
      setValue(k);
      const r = await setChecked(id, VALUE[k]);
      if (!r.ok) setError(true); // optimistic value reverts when the transition ends
    });
  }

  function onKey(e: React.KeyboardEvent, i: number) {
    const d = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const n = (i + d + KEYS.length) % KEYS.length;
    refs.current[n]?.focus();
    pick(KEYS[n]);
  }

  return (
    <div className="flex flex-col gap-1">
      <div role="radiogroup" aria-label={`Cek admin untuk pesanan ${code}`} aria-busy={pending || undefined} className={`inline-flex w-fit max-w-full ${pending ? "cursor-wait" : ""}`}>
        {KEYS.map((k, i) => (
          <button
            key={k}
            ref={(el) => { refs.current[i] = el; }}
            type="button"
            role="radio"
            aria-checked={value === k}
            tabIndex={value === k ? 0 : -1}
            onClick={() => pick(k)}
            onKeyDown={(e) => onKey(e, i)}
            aria-label={CHECK_LABEL[k]}
            className={`type-caption relative focus-visible:z-10 min-h-11 min-w-11 border-2 border-border-default first:rounded-l-md last:rounded-r-md not-first:-ml-0.5 ${size === "lg" ? "px-4 py-3" : "px-1.5"} ${
              value === k ? `font-bold shadow-[inset_0_-3px_0_currentColor] ${SELECTED[k]}` : "bg-bg-surface text-text-primary hover:bg-bg-muted"
            }`}
          >
            {size === "lg" ? CHECK_LABEL[k] : SHORT[k]}
          </button>
        ))}
      </div>
      {pending && <p className="type-caption flex items-center gap-1 text-text-secondary"><Icon name="loader" size={12} className="animate-spin" />Menyimpan…</p>}
      {error && <p role="alert" className="type-caption text-text-danger">Gagal menyimpan. Coba lagi.</p>}
    </div>
  );
}
