"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { holdSeats } from "@/app/pesan/actions";
import { BottomBar, CheckoutCard, CheckoutShell, OrderSummary, stepHref, useStepGuard } from "@/components/checkout/shell";
import { SeatLegend } from "@/components/seat/seat-legend";
import { SeatMap } from "@/components/seat/seat-map";
import { RevealText } from "@/components/site/reveal-text";
import { Alert } from "@/components/ui/alert";
import { useBooking } from "@/lib/booking";
import { EVENT, HOLD_MINUTES, SHOWS, TIERS } from "@/lib/event";
import { useAvailability } from "@/lib/use-availability";

export default function KursiPage() {
  const ok = useStepGuard(3);
  return ok ? <Kursi /> : null;
}

function Kursi() {
  const { show, booking, update } = useBooking();
  const router = useRouter();
  const avail = useAvailability(show);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  const { qty, seats, tier, buyer, heldSeats } = booking;
  const taken = useMemo(() => (avail.data?.taken ?? []).filter((id) => !heldSeats.includes(id)), [avail.data, heldSeats]); // own hold is not "taken"
  if (!tier || !buyer) return null; // useStepGuard guarantees both
  const done = seats.length === qty;

  const next = () => {
    if (booking.orderId && booking.holdUntil && booking.holdUntil > Date.now() && [...seats].sort().join() === [...heldSeats].sort().join()) {
      router.push(stepHref(show, 4));
      return;
    }
    setError(undefined);
    startTransition(async () => {
      try {
        const r = await holdSeats({ show, tier, seats, buyer, prevOrderId: booking.orderId });
        if (r.ok) {
          const price = r.total / seats.length;
          update({ orderId: r.orderId, heldSeats: seats, holdUntil: r.heldUntil, total: r.total, price, priceChanged: booking.price !== null && price !== booking.price });
          router.push(stepHref(show, 4));
        } else {
          setError(r.error);
          // a failed hold rolls back in SQL, so the previous hold (heldSeats) is still ours: keep it out of "taken"
          if (r.lost?.length) update({ seats: seats.filter((s) => !r.lost!.includes(s)), holdUntil: null, total: null });
          avail.refresh();
        }
      } catch {
        setError("Koneksi bermasalah. Coba lagi ya.");
      }
    });
  };
  const cta = { label: "Lanjut ke Pembayaran", disabled: !done, loading: pending, onClick: next };

  return (
    <CheckoutShell
      step={3}
      aside={<OrderSummary cta={cta} note={`Kursi ditahan ${HOLD_MINUTES} menit setelah kamu lanjut.`} />}
      bottomBar={<BottomBar info={seats.length ? `${seats.length} kursi · ${seats.join(", ")}` : `Pilih ${qty} kursi`} cta={{ ...cta, label: "Lanjut" }} />}
    >
      <CheckoutCard>
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <RevealText as="h1" text={`Pilih ${qty} kursi`} className="type-h2 text-text-brand" />
            <p data-reveal="fade" className="type-body-s text-text-secondary">
              {SHOWS[show].label} · {EVENT.dateShort} · {SHOWS[show].start} WIB
            </p>
            <p data-reveal="fade" className="type-body-s text-text-secondary">
              {tier}{booking.tierName && booking.tierName !== tier ? ` · ${booking.tierName}` : ""} · {TIERS[tier].title} · {TIERS[tier].rows}
            </p>
          </div>
          <span data-reveal="fade" aria-live="polite" className={`type-label shrink-0 rounded-full border-2 border-border-default px-3.5 py-1.5 ${done ? "bg-bg-brand text-text-on-brand" : "bg-bg-accent text-text-on-accent"}`}>
            {seats.length}/{qty} dipilih
          </span>
        </div>
        {error && <Alert type="error" title="Kursi belum bisa ditahan">{error}</Alert>}
        {avail.error && !avail.data && (
          <Alert type="error" title="Status kursi belum bisa dimuat">
            Cek koneksimu, lalu <button type="button" onClick={avail.refresh} className="underline">coba lagi</button>.
          </Alert>
        )}
        <div data-reveal="fade"><SeatLegend tier={tier} /></div>
        <div data-reveal="fade" aria-busy={avail.loading}>
          <SeatMap tier={tier} taken={taken} selected={seats} max={qty} onChange={(s) => update({ seats: s })} />
        </div>
      </CheckoutCard>
    </CheckoutShell>
  );
}
