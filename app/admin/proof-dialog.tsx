"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Icon } from "@/components/ui/icon";
import type { AdminOrder } from "@/lib/admin";
import { SHOWS, formatRupiah } from "@/lib/event";
import { proofLink } from "./actions";
import { MarkToggle } from "./mark-toggle";
import { HargaChip, METHOD_LABEL } from "./status-chip";

type View = { s: "loading" } | { s: "error"; msg: string } | { s: "ok"; url: string; kind: "image" | "pdf"; broken?: boolean };

const BTN = "type-label min-h-11 min-w-11 rounded-md border-2 border-border-default bg-bg-surface px-3 hover:bg-bg-accent-soft";

export function ProofButton({ order, variant = "compact" }: { order: AdminOrder; variant?: "compact" | "full" }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [view, setView] = useState<View>({ s: "loading" });
  const o = order;
  const titleId = useId();

  useEffect(() => {
    const d = ref.current;
    return () => {
      document.body.style.overflow = "";
      if (d?.open) d.close();
    };
  }, []);

  async function load() {
    setView({ s: "loading" });
    try {
      const r = await proofLink(o.id);
      setView(r.ok ? { s: "ok", url: r.url, kind: r.kind } : { s: "error", msg: r.error });
    } catch {
      setView({ s: "error", msg: "Gagal memuat bukti." });
    }
  }

  function open() {
    ref.current?.showModal();
    document.body.style.overflow = "hidden";
    void load();
  }

  if (!o.proofPath) {
    return <button type="button" disabled aria-label={`Pesanan ${o.code} belum ada bukti`} className={`${BTN} cursor-not-allowed text-text-secondary opacity-60`}>—</button>;
  }

  const fallback = view.s === "ok" && (
    <a href={view.url} target="_blank" rel="noopener noreferrer" className="type-label inline-flex min-h-11 items-center text-text-brand underline">Buka di tab baru</a>
  );
  const details: [string, React.ReactNode][] = [
    ["Pembeli", o.buyer.name],
    ["Kursi", `${SHOWS[o.show].label} · ${o.tier} · ${o.seats.join(", ")}`],
    ["Total", formatRupiah(o.total)],
    ["Metode", o.method ? METHOD_LABEL[o.method] : "—"],
    ["Harga", <HargaChip key="h" presale={o.presale} referral={o.referral} />],
    ...(o.referral
      ? [[`Kode referral`, `${o.referralCode ?? "—"} · −${formatRupiah(o.discountPerTicket)}/tiket`] as [string, string]]
      : []),
  ];

  return (
    <>
      <button
        type="button"
        onClick={open}
        aria-label={`Lihat bukti pesanan ${o.code}`}
        className={variant === "full" ? "type-label-button min-h-11 w-fit rounded-md border-2 border-border-default bg-bg-surface px-6 py-3 text-text-strong hover:bg-bg-accent-soft" : BTN}
      >
        {variant === "full" ? "Lihat bukti" : "Lihat"}
      </button>
      <dialog
        ref={ref}
        aria-labelledby={titleId}
        onClose={() => { document.body.style.overflow = ""; setView({ s: "loading" }); }}
        onClick={(e) => { if (e.target === e.currentTarget) ref.current?.close(); }}
        className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100vw-1rem)] max-w-5xl overflow-y-auto rounded-md border-2 border-border-default bg-bg-surface bg-paper p-0 text-text-primary shadow-sticker backdrop:bg-black/60"
      >
        <div className="flex items-center justify-between gap-3 border-b-2 border-border-default p-3">
          <h2 id={titleId} className="type-h4 min-w-0 break-words text-text-strong">Bukti {o.code}</h2>
          <button type="button" onClick={() => ref.current?.close()} className={`${BTN} shrink-0`}>Tutup</button>
        </div>
        <div className="grid gap-4 p-3 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="flex min-h-[60dvh] min-w-0 items-center justify-center border-2 border-border-default bg-bg-muted lg:h-[75dvh]">
            {view.s === "loading" && (
              <p role="status" className="type-body-m flex animate-pulse items-center gap-2 text-text-secondary"><Icon name="loader" size={20} className="animate-spin" />Memuat bukti…</p>
            )}
            {view.s === "error" && (
              <div className="flex flex-col items-start gap-3 p-3">
                <Alert type="error" title={view.msg} />
                <button type="button" onClick={load} className={BTN}>Coba lagi</button>
              </div>
            )}
            {view.s === "ok" && view.kind === "image" && !view.broken && (
              // eslint-disable-next-line @next/next/no-img-element -- signed external URL, not optimisable
              <img src={view.url} referrerPolicy="no-referrer" alt={`Bukti pembayaran ${o.code}`} onError={() => setView({ ...view, broken: true })} className="max-h-[60dvh] max-w-full object-contain lg:max-h-full" />
            )}
            {view.s === "ok" && view.kind === "pdf" && (
              <iframe src={view.url} referrerPolicy="no-referrer" allow="" title={`Bukti pembayaran ${o.code}`} className="h-[60dvh] w-full lg:h-full" />
            )}
            {view.s === "ok" && view.broken && (
              <div className="flex flex-col items-start gap-2 p-3">
                <p className="type-body-s text-text-primary">Gambar tidak bisa ditampilkan.</p>
                {fallback}
              </div>
            )}
          </div>
          <div className="flex min-w-0 flex-col gap-4">
            <dl className="type-body-s flex flex-col gap-3">
              {details.map(([k, v]) => (
                <div key={k} className="min-w-0">
                  <dt className="type-caption text-text-secondary">{k}</dt>
                  <dd className="break-words text-text-strong">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="flex flex-col gap-1">
              <h3 className="type-label text-text-strong">Cek admin</h3>
              <MarkToggle id={o.id} code={o.code} checked={o.checked} size="lg" />
            </div>
            {fallback}
          </div>
        </div>
      </dialog>
    </>
  );
}
