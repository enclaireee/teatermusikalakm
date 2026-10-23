"use client";

// Checkout state for one show, kept in sessionStorage so a refresh doesn't lose the order.
// The order itself lives on the server (holdSeats / submitPayment); this is just the UI state between steps.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ShowId, Tier } from "./event";

export type Buyer = { name: string; email: string; phone: string; org: string };
export type PayMethod = "qris" | "transfer";

export type Booking = {
  buyer: Buyer | null; // set when step 1 (Data Diri) is submitted
  tier: Tier | null; // one tier per order
  tierName: string | null; // display name of the tier (e.g. "Platinum")
  price: number | null; // active unit price at selection time (display only; the server recomputes it)
  referralCode: string | null; // applied code, e.g. "KODEKOMUNITAS"
  referralLabel: string | null; // community name from referral_codes
  referralDiscount: number; // per ticket; 0 = no referral
  notice: string | null; // one-off message shown on step 1 after the server rejects a stale price/code
  qty: number;
  seats: string[]; // seat ids, e.g. "C9"
  orderId: string | null; // server order, set by holdSeats
  heldSeats: string[]; // seats held by that order (the API counts them as taken)
  holdUntil: number | null; // epoch ms, from the server
  priceChanged: boolean; // true when the server price differed from the one shown (e.g. presale ended)
  total: number | null; // server total after the hold (authoritative)
  method: PayMethod;
  code: string | null; // booking code; set when proof is submitted
  paidAt: number | null;
};

const EMPTY: Booking = { buyer: null, tier: null, tierName: null, price: null, referralCode: null, referralLabel: null, referralDiscount: 0, notice: null, qty: 1, seats: [], orderId: null, heldSeats: [], holdUntil: null, priceChanged: false, total: null, method: "qris", code: null, paidAt: null };

type Ctx = {
  show: ShowId;
  booking: Booking;
  ready: boolean; // false until sessionStorage has been read (avoid redirecting too early)
  update: (patch: Partial<Booking>) => void;
  reset: () => void;
};

const BookingContext = createContext<Ctx | null>(null);
const key = (show: ShowId) => `akm-booking-v4-${show}`;

export function BookingProvider({ show, children }: { show: ShowId; children: React.ReactNode }) {
  const [booking, setBooking] = useState<Booking>(EMPTY);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(key(show));
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from storage
      if (raw) setBooking({ ...EMPTY, ...JSON.parse(raw) });
    } catch {
      // storage unavailable or corrupt: start fresh
    }
    setReady(true);
  }, [show]);

  useEffect(() => {
    if (!ready) return;
    try {
      sessionStorage.setItem(key(show), JSON.stringify(booking));
    } catch {
      // private mode / quota: the flow still works in memory
    }
  }, [booking, ready, show]);

  const update = useCallback((patch: Partial<Booking>) => setBooking((b) => ({ ...b, ...patch })), []);
  const reset = useCallback(() => setBooking(EMPTY), []);
  const value = useMemo(() => ({ show, booking, ready, update, reset }), [show, booking, ready, update, reset]);
  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}

export function useBooking(): Ctx {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error("useBooking must be used inside <BookingProvider>");
  return ctx;
}

/** Furthest checkout step this booking may open (1 = Pilih Tiket … 5 = Selesai). */
export function allowedStep(b: Booking): number {
  if (b.code) return 5;
  if (b.tier && b.buyer && b.orderId && b.holdUntil !== null && b.seats.length === b.qty) return 4;
  if (b.tier && b.buyer) return 3;
  if (b.tier) return 2;
  return 1;
}
