"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ReferralField } from "@/components/checkout/referral";
import { BottomBar, CheckoutCard, CheckoutShell, OrderSummary, stepHref } from "@/components/checkout/shell";
import { TierOption } from "@/components/checkout/tier-option";
import { RevealText } from "@/components/site/reveal-text";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Quantity } from "@/components/ui/quantity";
import { useBooking } from "@/lib/booking";
import { MAX_TICKETS, SALE_TIERS, SHOWS, type Tier } from "@/lib/event";
import { useAvailability } from "@/lib/use-availability";

const FORM_ID = "pilih-tiket-form";

export default function PilihTiketPage() {
  const { booking, ready, reset } = useBooking();
  const finished = !!booking.code;
  useEffect(() => {
    if (ready && finished) reset(); // a finished order starts a new one
  }, [ready, finished, reset]);
  if (!ready || finished) return null;
  return <Form />;
}

function Form() {
  const { show, booking, update } = useBooking();
  const router = useRouter();
  const [qty, setQty] = useState(booking.qty);
  const [tier, setTier] = useState<Tier | null>(booking.tier);
  const [error, setError] = useState<string>();
  const avail = useAvailability(show);
  const info = avail.data?.tiers.find((t) => t.tier === tier);
  // the API counts our own live hold as taken, so give those seats back for the tier we hold
  const own = (t: Tier | null) => (t && booking.tier === t ? booking.heldSeats.length : 0);
  const leftOf = (t: Tier | null) => {
    const i = avail.data?.tiers.find((x) => x.tier === t);
    return i ? i.left + own(t) : 0;
  };
  const maxQty = info ? Math.max(1, Math.min(MAX_TICKETS, leftOf(tier))) : MAX_TICKETS;
  const n = Math.min(qty, maxQty);
  const presale = avail.data?.presale;
  const discount = booking.referralCode ? booking.referralDiscount : 0;

  // Keep the display total on the live price. If the admin flips presale while this page is open,
  // the cards and the footer follow immediately (the server still recomputes the real total).
  const livePrice = info?.price;
  useEffect(() => {
    if (!info || booking.price === livePrice) return;
    update({
      price: livePrice,
      // an old hold was priced differently, so it can no longer be used as-is
      ...(booking.holdUntil ? { heldSeats: [], holdUntil: null, total: null, priceChanged: false } : {}),
    });
  }, [info, livePrice, booking.price, booking.holdUntil, update]);

  function checkTier(t: Tier | null): string | undefined {
    if (!t) return "Pilih kategori tiket dulu ya.";
    const i = avail.data?.tiers.find((x) => x.tier === t);
    if (!i) return avail.loading ? "Tunggu sebentar, kategori tiket masih dimuat." : "Kategori ini belum bisa dipilih. Coba muat ulang.";
    if (i.price === null) return "Kategori ini belum dibuka, pilih kategori lain ya.";
    if (leftOf(t) <= 0) return "Kategori ini sudah habis, pilih kategori lain ya.";
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = checkTier(tier);
    setError(err);
    if (err || !tier || !info) {
      document.getElementById("f-tier")?.focus();
      return;
    }
    // a different tier or quantity invalidates seats and hold; orderId stays so the next holdSeats releases it
    const changed = tier !== booking.tier || n !== booking.qty;
    update({
      tier, tierName: info.name, price: info.price, qty: n, priceChanged: false, notice: null,
      ...(changed ? { seats: [], holdUntil: null, total: null } : {}),
    });
    router.push(stepHref(show, 2));
  }

  return (
    <CheckoutShell
      step={1}
      topSlot={<ReferralField />}
      aside={<OrderSummary />}
      bottomBar={<BottomBar info={`${SHOWS[show].label} · ${n} tiket`} cta={{ label: "Lanjut Isi Data", type: "submit", form: FORM_ID }} />}
    >
      <CheckoutCard>
        <form id={FORM_ID} noValidate onSubmit={onSubmit} className="flex flex-col gap-5 lg:gap-6">
          <div className="flex flex-col gap-2">
            <RevealText as="h1" text="Pilih kategori tiket" className="type-h2 text-text-brand" />
            <p data-reveal="up" className="type-body-m text-text-secondary">Satu kategori per pesanan, maks. {MAX_TICKETS} tiket. Kursinya kamu pilih nanti.</p>
          </div>
          {booking.notice && <Alert type="warning" title="Cek lagi pesananmu">{booking.notice}</Alert>}
          {error && <div id="tier-error"><Alert type="error" title="Tiketnya belum bisa dilanjut">{error}</Alert></div>}
          <div data-reveal="up" className="flex flex-col gap-5 lg:gap-6">
            <div id="f-tier" tabIndex={-1} className="flex flex-col gap-2 focus:outline-none">
              <span className="type-label text-text-strong">
                Kategori tiket<span className="text-text-danger" aria-hidden="true"> *</span>
              </span>
              {presale?.active && (
                <p className="type-caption text-text-primary">Harga presale</p>
              )}
              {avail.loading && !avail.data ? (
                <p role="status" aria-busy="true" className="type-body-s rounded-md border-2 border-dashed border-border-subtle bg-bg-muted px-5 py-4 text-text-secondary">Memuat kategori tiket…</p>
              ) : avail.error && !avail.data ? (
                <div className="flex flex-col items-start gap-3">
                  <Alert type="error" title="Kategori tiket belum bisa dimuat">Cek koneksimu, lalu coba lagi.</Alert>
                  <Button variant="secondary" onClick={avail.refresh}>Coba lagi</Button>
                </div>
              ) : (
                <div role="radiogroup" aria-label="Kategori tiket" aria-invalid={!!error} aria-describedby={error ? "tier-error" : undefined} className="flex flex-col gap-3">
                  {SALE_TIERS.map((t) => (
                    <TierOption
                      key={t}
                      name="tier"
                      tier={t}
                      info={avail.data?.tiers.find((x) => x.tier === t)}
                      extraLeft={own(t)}
                      presale={!!presale?.active}
                      discount={discount}
                      checked={tier === t}
                      onChange={(v) => {
                        setTier(v);
                        setError(undefined);
                        setQty((q) => Math.min(q, Math.max(1, leftOf(v) || q)));
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <span className="type-label text-text-strong">
                Jumlah tiket<span className="text-text-danger" aria-hidden="true"> *</span>
              </span>
              <Quantity label="Jumlah tiket" value={n} min={1} max={maxQty} onChange={setQty} />
            </div>
          </div>
          <div data-reveal="up" className="hidden justify-end lg:flex">
            <Button type="submit" icon="arrow-right">Lanjut Isi Data</Button>
          </div>
        </form>
      </CheckoutCard>
    </CheckoutShell>
  );
}
