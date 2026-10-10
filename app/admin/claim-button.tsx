"use client";

import { useOptimistic, useState, useTransition } from "react";
import { Icon } from "@/components/ui/icon";
import { setClaimed } from "./actions";
import { formatWib } from "./status-chip";

const BTN = "type-caption min-h-11 min-w-11 rounded-md border-2 border-border-default bg-bg-surface text-text-strong hover:bg-bg-muted disabled:cursor-not-allowed disabled:border-border-subtle disabled:bg-bg-disabled disabled:text-text-disabled";

export function ClaimButton({ id, code, claimedAt, valid, size }: { id: string; code: string; claimedAt: string | null; valid: boolean; size: "sm" | "lg" }) {
  const [at, setAt] = useOptimistic(claimedAt);
  const [pending, start] = useTransition();
  const [error, setError] = useState(false);
  const lg = size === "lg";

  function toggle(claimed: boolean) {
    setError(false);
    start(async () => {
      setAt(claimed ? new Date().toISOString() : null);
      const r = await setClaimed(id, claimed);
      if (!r.ok) setError(true); // optimistic value reverts when the transition ends
    });
  }

  return (
    <div className="flex flex-col items-start gap-1" aria-busy={pending || undefined}>
      {at ? (
        <>
          <span className="type-caption inline-block rounded-full border-2 border-border-brand bg-bg-brand-soft px-2.5 py-0.5 text-text-brand">
            Diambil{lg && ` · ${formatWib(at)}`}
          </span>
          {!lg && <span className="type-caption whitespace-nowrap text-text-secondary">{formatWib(at)}</span>}
          <button type="button" onClick={() => toggle(false)} disabled={pending} aria-label={`Batalkan tiket ${code} diambil`} className={`${BTN} ${lg ? "px-4 py-3" : "px-1.5"}`}>
            Batalkan
          </button>
        </>
      ) : (
        <>
          <button type="button" onClick={() => toggle(true)} disabled={!valid || pending} aria-label={`Tandai tiket ${code} sudah diambil`} className={`${BTN} ${lg ? "px-4 py-3" : "px-1.5"}`}>
            {lg ? "Tandai tiket sudah diambil" : "Tandai diambil"}
          </button>
          {!valid && <p className="type-caption text-text-secondary">Pesanan tidak berlaku</p>}
        </>
      )}
      {pending && <p className="type-caption flex items-center gap-1 text-text-secondary"><Icon name="loader" size={12} className="animate-spin" />Menyimpan…</p>}
      {error && <p role="alert" className="type-caption text-text-danger">Gagal menyimpan. Coba lagi.</p>}
    </div>
  );
}
