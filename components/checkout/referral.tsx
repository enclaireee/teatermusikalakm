"use client";

import { useState, useTransition } from "react";
import { Icon } from "@/components/ui/icon";
import { validateReferral } from "@/app/pesan/actions";
import { useBooking } from "@/lib/booking";
import { formatRupiah } from "@/lib/event";
import { normalizeReferralCode, REFERRAL_DISCOUNT } from "@/lib/referral";

const INPUT =
  "type-body-m min-h-11 w-full min-w-0 rounded-md border-2 px-4 py-3 text-text-strong placeholder:text-text-secondary transition-[border-color,background-color] duration-(--duration-fast) ease-(--ease-out-soft) focus:border-border-focus focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-border-focus";

/** Optional referral code on step 1. The code itself is neither shipped nor trusted: the server checks it. */
export function ReferralField() {
  const { booking, update } = useBooking();
  const [editing, setEditing] = useState(!booking.referralCode);
  const [value, setValue] = useState(booking.referralCode ?? "");
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();

  function apply(e: React.FormEvent) {
    e.preventDefault();
    const code = normalizeReferralCode(value);
    if (!code) {
      setError("Masukkan kode referral dulu ya.");
      return;
    }
    setError(undefined);
    start(async () => {
      try {
        const r = await validateReferral(code);
        if (!r.ok) {
          setError(r.error);
          return;
        }
        setValue(r.code);
        setEditing(false);
        // The code changes the order total, so any existing hold is stale. Keep orderId so the next
        // holdSeats releases it, but drop the seats and server total.
        update({
          referralCode: r.code,
          referralLabel: r.label,
          referralDiscount: r.discount,
          notice: null,
          seats: [],
          heldSeats: [],
          holdUntil: null,
          total: null,
          priceChanged: false,
        });
      } catch {
        setError("Koneksi bermasalah. Coba lagi ya.");
      }
    });
  }

  function remove() {
    setValue("");
    setEditing(true);
    setError(undefined);
    update({
      referralCode: null,
      referralLabel: null,
      referralDiscount: 0,
      notice: null,
      seats: [],
      heldSeats: [],
      holdUntil: null,
      total: null,
      priceChanged: false,
    });
  }

  if (booking.referralCode && !editing) {
    return (
      <section aria-label="Kode referral" className="rounded-md border-2 border-border-brand bg-bg-brand-soft p-3 lg:mx-auto lg:w-full lg:max-w-2xl">
        <div className="flex flex-wrap items-start gap-x-3 gap-y-2">
          <Icon name="check-circle" size={20} className="mt-0.5 shrink-0 text-text-brand" />
          <div className="min-w-0 flex-1">
            <p role="status" className="type-label text-text-strong">
              Kode berlaku, harga lebih murah {formatRupiah(booking.referralDiscount || REFERRAL_DISCOUNT)} per tiket
            </p>
            <p className="type-caption break-words text-text-primary">
              {booking.referralCode}
              {booking.referralLabel ? ` · ${booking.referralLabel}` : ""}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button type="button" onClick={() => { setEditing(true); setValue(booking.referralCode ?? ""); }} className="type-label inline-flex min-h-11 items-center px-2 text-text-brand underline">
              Ganti
            </button>
            <button type="button" onClick={remove} className="type-label inline-flex min-h-11 items-center px-2 text-text-danger underline">
              Hapus
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section aria-label="Kode referral" className="rounded-md border-2 border-border-default bg-bg-accent-soft p-3 lg:mx-auto lg:w-full lg:max-w-2xl">
      <form noValidate onSubmit={apply} className="flex flex-col gap-2">
        <label htmlFor="f-referral" className="type-label text-text-strong">
          Kode referral <span className="type-caption text-text-secondary">(opsional)</span>
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id="f-referral"
            name="referral"
            value={value}
            onChange={(e) => { setValue(e.target.value.toUpperCase()); setError(undefined); }}
            placeholder="Masukkan kode dari komunitasmu"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            maxLength={32}
            aria-invalid={error ? true : undefined}
            aria-describedby="f-referral-msg"
            className={`${INPUT} ${error ? "border-border-danger bg-bg-danger-soft" : "border-border-default bg-bg-surface hover:border-border-brand"}`}
          />
          <button
            type="submit"
            disabled={pending}
            aria-busy={pending || undefined}
            className="type-label-button inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-md border-2 border-border-default bg-bg-surface px-5 py-3 text-text-strong shadow-sticker transition-[background-color,box-shadow,translate] duration-(--duration-base) ease-(--ease-out-soft) hover:-translate-y-px hover:bg-bg-accent-soft hover:shadow-sticker-l active:translate-x-0.5 active:translate-y-0.5 active:shadow-sticker-s disabled:pointer-events-none disabled:border-border-subtle disabled:bg-bg-disabled disabled:text-text-disabled disabled:shadow-none"
          >
            {pending ? <><Icon name="loader" size={18} className="animate-spin" />Memeriksa…</> : "Terapkan"}
          </button>
        </div>
        <p id="f-referral-msg" role={error ? "alert" : undefined} className={`type-caption ${error ? "text-text-danger" : "text-text-secondary"}`}>
          {error ?? `Punya kode dari komunitas? Pakai di sini biar lebih hemat ${formatRupiah(REFERRAL_DISCOUNT)} per tiket.`}
        </p>
      </form>
    </section>
  );
}
