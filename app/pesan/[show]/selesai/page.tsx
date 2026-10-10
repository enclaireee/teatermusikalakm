"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { CheckoutShell, useOrderLines, useStepGuard } from "@/components/checkout/shell";
import { CopyButton } from "@/components/checkout/copy-button";
import { Receipt } from "@/components/receipt/receipt";
import { RevealText } from "@/components/site/reveal-text";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Stamp } from "@/components/ui/stamp";
import { useBooking } from "@/lib/booking";
import type { Ticket } from "@/app/pesan/actions";
import { EVENT, SHOWS, TIERS } from "@/lib/event";
import { downloadReceiptPdf } from "@/lib/pdf";

export default function SelesaiPage() {
  const ok = useStepGuard(5);
  const { show, booking } = useBooking();
  const { total } = useOrderLines();
  const receipt = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  if (!ok) return null;

  const { code, buyer, seats, tier } = booking;
  const tierName = booking.tierName ?? tier;
  const ticket: Ticket | null =
    buyer && code && tier && booking.paidAt && booking.total !== null
      ? { code, show, tier, tierName: tierName ?? tier, seats, buyer, method: booking.method, total: booking.total, status: "valid", paidAt: booking.paidAt }
      : null;
  const details: [string, string][] = [
    ["Show", `${SHOWS[show].label} · ${EVENT.dateShort} · ${SHOWS[show].start} WIB`],
    ["Kursi", `${seats.join(", ")}${tier ? ` (${tier} · ${TIERS[tier].title})` : ""}`],
    ["Total", total],
  ];

  async function download() {
    if (!receipt.current || !ticket) {
      setError("Datanya belum lengkap untuk membuat PDF. Coba muat ulang halaman ini.");
      return;
    }
    setBusy(true);
    setError(undefined);
    try {
      await downloadReceiptPdf(receipt.current, `tiket-${ticket.code}.pdf`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal membuat PDF. Coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <CheckoutShell step={5}>
      <div className="relative mx-auto flex w-full max-w-[720px] flex-col items-center gap-6 rounded-lg border-2 border-border-default bg-bg-surface bg-paper p-6 pt-20 shadow-sticker-l lg:p-12 lg:pt-12">
        <Image src="/decorative-star.webp" alt="" width={72} height={72} className="animate-enter-scale absolute left-4 top-6 w-12 lg:left-20 lg:top-12 lg:w-[72px]" />
        <div className="absolute right-4 top-6 lg:right-12 lg:top-10">
          <Stamp color="red" rotate={-10} className="animate-stamp [animation-delay:300ms]">VALID!</Stamp>
        </div>
        <div className="animate-pop flex size-28 items-center justify-center rounded-full border-[3px] border-border-default bg-bg-accent shadow-sticker">
          <Icon name="check-circle" size={64} className="text-text-brand" />
        </div>
        <RevealText as="h1" text="Yeay, tiketmu sudah valid!" className="type-h2 lg:type-h1 text-balance text-center text-text-brand" />
        <p data-reveal="up" className="type-body-l text-center text-text-primary">
          Bukti pembayaranmu sudah kami terima. PDF di bawah ini adalah tiket masukmu, jadi download dan simpan ya. Kode booking juga jangan sampai hilang, dipakai buat cek tiket.
        </p>

        <div data-reveal="scale" className="flex w-full items-center justify-between gap-3 rounded-md border-2 border-dashed border-border-default bg-bg-accent-soft px-5 py-4">
          <div className="min-w-0">
            <p className="type-caption text-text-secondary">Kode booking</p>
            <p className="type-h3 lg:type-h2 break-words text-text-strong">{code}</p>
          </div>
          {code && <CopyButton value={code} label="kode booking" />}
        </div>

        <dl data-reveal-stagger data-reveal="up" className="flex w-full flex-col gap-2.5">
          {details.map(([k, v]) => (
            <div key={k} className="type-body-s flex justify-between gap-3">
              <dt className="text-text-secondary">{k}</dt>
              <dd className="text-right text-text-strong">{v}</dd>
            </div>
          ))}
          <div className="type-body-s flex items-center justify-between gap-3">
            <dt className="text-text-secondary">Status</dt>
            <dd className="type-caption rounded-full border-2 border-border-brand bg-bg-brand-soft px-3 py-1 text-text-brand">Valid</dd>
          </div>
        </dl>

        {error && (
          <div className="w-full">
            <Alert type="error" title="Gagal membuat PDF">{error}</Alert>
          </div>
        )}
        <div data-reveal-stagger data-reveal="up" className="flex w-full flex-col gap-3 lg:flex-row lg:justify-center">
          <Button icon="download" fullWidth loading={busy} onClick={download}>Download Tiket (PDF)</Button>
          <Button variant="secondary" icon="ticket" href="/tiket" fullWidth>Cek tiket</Button>
        </div>
        <Button variant="ghost" href="/">Kembali ke Beranda</Button>
      </div>

      {ticket && (
        <div aria-hidden="true" className="fixed -left-[10000px] top-0">
          <Receipt ref={receipt} ticket={ticket} />
        </div>
      )}
    </CheckoutShell>
  );
}
