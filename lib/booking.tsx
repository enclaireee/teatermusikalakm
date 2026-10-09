"use client";

// Checkout state for one show, kept in sessionStorage so a refresh doesn't lose the order.
// ponytail: browser-only mock; the backend phase replaces this with server-side orders + seat holds.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ShowId } from "./event";

export type Buyer = { name: string; email: string; phone: string; org: string };
export type PayMethod = "qris" | "transfer";
export type Proof = { name: string; size: number; type: string };

export type Booking = {
  buyer: Buyer | null; // set when step 1 (Data Diri) is submitted
  qty: number;
  seats: string[]; // seat ids, e.g. "C9"
  vipUnlocked: boolean;
  holdUntil: number | null; // epoch ms; set when entering payment
  method: PayMethod;
  proof: Proof | null;
  code: string | null; // booking code; set when proof is submitted
  paidAt: number | null;
};

const EMPTY: Booking = { buyer: null, qty: 2, seats: [], vipUnlocked: false, holdUntil: null, method: "qris", proof: null, code: null, paidAt: null };

type Ctx = {
  show: ShowId;
  booking: Booking;
  ready: boolean; // false until sessionStorage has been read (avoid redirecting too early)
  update: (patch: Partial<Booking>) => void;
  reset: () => void;
};

const BookingContext = createContext<Ctx | null>(null);
const key = (show: ShowId) => `akm-booking-${show}`;

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

/** Furthest checkout step this booking may open (1 = Data Diri … 4 = Selesai). */
export function allowedStep(b: Booking): number {
  if (b.code) return 4;
  if (b.buyer && b.seats.length === b.qty) return 3;
  if (b.buyer) return 2;
  return 1;
}

export function makeBookingCode(show: ShowId): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I
  const rand = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `AKM-S${show}-${rand}`;
}
