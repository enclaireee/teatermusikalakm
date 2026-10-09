"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BottomBar, CheckoutCard, CheckoutShell, OrderSummary, stepHref, useStepGuard } from "@/components/checkout/shell";
import { InviteDialog } from "@/components/checkout/invite-dialog";
import { SeatLegend } from "@/components/seat/seat-legend";
import { SeatMap } from "@/components/seat/seat-map";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useBooking } from "@/lib/booking";
import { EVENT, HOLD_MINUTES, SHOWS } from "@/lib/event";

export default function KursiPage() {
  const ok = useStepGuard(2);
  const { show, booking, update } = useBooking();
  const router = useRouter();
  const [modal, setModal] = useState(false);
  const vipRef = useRef<HTMLDivElement>(null);
  const focusVip = useRef(false);
  const { vipUnlocked: unlocked } = booking;
  useEffect(() => {
    // the opener button unmounts on unlock, so move focus to the success alert
    if (unlocked && focusVip.current) {
      focusVip.current = false;
      vipRef.current?.focus();
    }
  }, [unlocked]);
  if (!ok) return null;

  const { qty, seats, vipUnlocked } = booking;
  const done = seats.length === qty;
  const next = () => {
    // ponytail: real holds move server-side; client only starts the hold once so step-bouncing can't extend it
    if (booking.holdUntil === null || booking.holdUntil <= Date.now()) update({ holdUntil: Date.now() + HOLD_MINUTES * 60_000 });
    router.push(stepHref(show, 3));
  };
  const cta = { label: "Lanjut ke Pembayaran", disabled: !done, onClick: next };

  return (
    <CheckoutShell
      step={2}
      aside={<OrderSummary cta={cta} note={`Kursi ditahan ${HOLD_MINUTES} menit setelah kamu lanjut.`} />}
      bottomBar={<BottomBar info={seats.length ? `${seats.length} kursi · ${seats.join(", ")}` : `Pilih ${qty} kursi`} cta={{ ...cta, label: "Lanjut" }} />}
    >
      <CheckoutCard>
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <h1 className="type-h2 text-text-brand">Pilih {qty} kursi</h1>
            <p className="type-body-s text-text-secondary">
              {SHOWS[show].label} · {EVENT.dateShort} · {SHOWS[show].start} WIB
            </p>
          </div>
          <span aria-live="polite" className={`type-label shrink-0 rounded-full border-2 border-border-default px-3.5 py-1.5 ${done ? "bg-bg-brand text-text-on-brand" : "bg-bg-accent text-text-on-accent"}`}>
            {seats.length}/{qty} dipilih
          </span>
        </div>
        <SeatLegend />
        {vipUnlocked && (
          <div ref={vipRef} tabIndex={-1} className="focus:outline-none">
            <Alert type="success" title="Kursi VIP terbuka">Kursi VIP (baris E–F tengah) sekarang bisa dipilih.</Alert>
          </div>
        )}
        <SeatMap show={show} selected={seats} max={qty} vipUnlocked={vipUnlocked} onChange={(s) => update({ seats: s })} />
        {!vipUnlocked && (
          <div className="flex flex-col gap-4 rounded-md border-2 border-dashed border-border-subtle bg-bg-muted px-5 py-4 lg:flex-row lg:items-center">
            <Icon name="key" size={24} className="shrink-0 text-text-primary" />
            <div className="min-w-0 flex-1">
              <p className="type-body-m text-text-strong">Punya kode undangan?</p>
              <p className="type-body-s text-text-secondary">Masukkan kode untuk membuka kursi VIP (baris E–F tengah).</p>
            </div>
            <Button variant="secondary" icon="key" onClick={() => setModal(true)}>Masukkan kode</Button>
          </div>
        )}
      </CheckoutCard>
      <InviteDialog
        open={modal}
        onClose={() => setModal(false)}
        onUnlock={() => {
          focusVip.current = true;
          update({ vipUnlocked: true });
          setModal(false);
        }}
      />
    </CheckoutShell>
  );
}
