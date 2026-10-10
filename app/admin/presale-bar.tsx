"use client";

import { useOptimistic, useRef, useState, useTransition } from "react";
import { TIER_BG } from "@/components/seat/seat";
import { Icon } from "@/components/ui/icon";
import type { Pricing } from "@/lib/admin";
import { formatRupiah } from "@/lib/event";
import { setPresale } from "./actions";

const MODES = [true, false] as const;
const LABEL = { true: "Presale", false: "Harga normal" } as const;

export function PresaleBar({ pricing }: { pricing: Pricing }) {
  const [on, setOn] = useOptimistic(pricing.presale);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  function pick(next: boolean): boolean {
    if (next === on || pending) return false;
    if (!window.confirm(`Ganti ke ${LABEL[`${next}`]}? Harga di situs publik akan langsung berubah.`)) return false;
    setMsg(null);
    start(async () => {
      setOn(next);
      const r = await setPresale(next);
      setMsg(r.ok ? { ok: true, text: `Mode harga diganti ke ${LABEL[`${next}`]}` } : { ok: false, text: "Gagal mengganti mode. Coba lagi." });
    });
    return true;
  }

  function onKey(e: React.KeyboardEvent, i: number) {
    const d = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const n = (i + d + MODES.length) % MODES.length;
    if (pick(MODES[n])) refs.current[n]?.focus();
  }

  return (
    <section aria-label="Harga tiket" className="flex flex-col gap-3 rounded-md border-2 border-border-default bg-bg-accent-soft bg-paper p-3 shadow-sticker-s md:p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="type-h4 text-text-strong">Harga tiket</h2>
          <p className="type-caption text-text-secondary">Mode aktif: {on ? "Presale" : "Harga normal"}</p>
          <p className="type-caption mt-1 flex items-start gap-1 text-text-danger">
            <Icon name="alert-circle" size={14} className="mt-px shrink-0" />
            Mengganti mode langsung mengubah harga di situs publik.
          </p>
        </div>
        <div className="flex flex-col gap-1">
          <div role="radiogroup" aria-label="Mode harga" aria-busy={pending || undefined} className={`inline-flex w-fit max-w-full ${pending ? "cursor-wait" : ""}`}>
            {MODES.map((m, i) => (
              <button
                key={`${m}`}
                ref={(el) => { refs.current[i] = el; }}
                type="button"
                role="radio"
                aria-checked={on === m}
                tabIndex={on === m ? 0 : -1}
                aria-disabled={pending || undefined}
                onClick={() => pick(m)}
                onKeyDown={(e) => onKey(e, i)}
                className={`type-label relative inline-flex min-h-11 items-center gap-1.5 border-2 border-border-default px-4 first:rounded-l-md last:rounded-r-md not-first:-ml-0.5 focus-visible:z-10 aria-disabled:cursor-wait ${
                  on === m ? "bg-bg-accent font-bold text-text-strong" : "bg-bg-surface text-text-primary hover:bg-bg-muted"
                }`}
              >
                {on === m && <Icon name="check" size={14} />}
                {LABEL[`${m}`]}
              </button>
            ))}
          </div>
          {pending && <p role="status" className="type-caption flex items-center gap-1 text-text-secondary"><Icon name="loader" size={12} className="animate-spin" />Menyimpan…</p>}
          {!pending && msg && (
            <p role={msg.ok ? "status" : "alert"} className={`type-caption ${msg.ok ? "text-text-brand" : "text-text-danger"}`}>{msg.text}</p>
          )}
        </div>
      </div>
      <ul className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {pricing.tiers.map((t) => {
          const [now, other] = on ? [t.pricePresale, t.priceNormal] : [t.priceNormal, t.pricePresale];
          return (
            <li key={t.tier} className="flex min-w-0 flex-col gap-0.5 rounded-md border-2 border-border-default bg-bg-surface p-2">
              <p className="type-label flex min-w-0 items-center gap-2 text-text-strong">
                <span aria-hidden className={`size-4 shrink-0 rounded-sm border border-border-default ${TIER_BG[t.tier]}`} />
                <span className="truncate">{t.name !== t.tier ? `${t.name} · ${t.tier}` : t.tier}</span>
              </p>
              <p className="type-body-m text-text-brand">{now === null ? "—" : formatRupiah(now)}</p>
              <p className="type-caption text-text-secondary">{on ? "Normal" : "Presale"}: {other === null ? "—" : formatRupiah(other)}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
