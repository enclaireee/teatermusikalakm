"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Footer } from "@/components/site/footer";
import { Navbar } from "@/components/site/navbar";
import { Button } from "@/components/ui/button";
import { Stepper } from "@/components/ui/stepper";
import { allowedStep, useBooking } from "@/lib/booking";
import { EVENT, SHOWS, formatRupiah } from "@/lib/event";

export type Step = 1 | 2 | 3 | 4 | 5;
const STEP_PATH: Record<Step, string> = { 1: "pilih-tiket", 2: "data-diri", 3: "kursi", 4: "bayar", 5: "selesai" };

export function stepHref(show: string, step: Step) {
  return `/pesan/${show}/${STEP_PATH[step]}`;
}

/** Redirects to the furthest allowed step when a page is opened too early. Returns true once the page may render. */
export function useStepGuard(step: Step): boolean {
  const { booking, ready, show } = useBooking();
  const router = useRouter();
  const allowed = allowedStep(booking) as Step;
  // Step 1 is always open (it starts a new order). A finished booking otherwise only shows the success page.
  const ok = ready && (step === 1 || (booking.code ? step === 5 : allowed >= step));
  useEffect(() => {
    if (ready && !ok) router.replace(stepHref(show, booking.code ? 5 : allowed));
  }, [ready, ok, allowed, booking.code, router, show]);
  return ok;
}

export type Cta = { label: string; onClick?: () => void; href?: string; disabled?: boolean; loading?: boolean; type?: "button" | "submit"; form?: string };

function CtaButton({ cta, fullWidth }: { cta: Cta; fullWidth?: boolean }) {
  return (
    <Button
      type={cta.type ?? "button"}
      form={cta.form}
      href={cta.href}
      onClick={cta.onClick}
      disabled={cta.disabled}
      loading={cta.loading}
      icon="arrow-right"
      fullWidth={fullWidth}
    >
      {cta.label}
    </Button>
  );
}

/** "Nama × n" + total: the server total once seats are held, otherwise unit price × qty (display only). */
export function useOrderLines() {
  const { booking } = useBooking();
  const { tier, qty, price, total: held } = booking;
  const n = booking.seats.length || qty;
  const amount = held ?? (price === null ? null : price * n);
  const lines = tier ? [{ label: `${tier} × ${n}`, value: formatRupiah(amount) }] : [];
  return { lines, total: formatRupiah(amount) };
}

/** Desktop aside card (Figma "Order Summary"). */
export function OrderSummary({ cta, note }: { cta?: Cta; note?: string }) {
  const { booking, show } = useBooking();
  const { lines, total } = useOrderLines();
  const rows: [string, string][] = [
    ["Tanggal", EVENT.dateShort],
    ["Lokasi", EVENT.venueShort],
    ["Pemesan", booking.buyer?.name || "—"],
    ["Kursi", booking.seats.length ? booking.seats.join(", ") : `${booking.qty} kursi, dipilih di langkah 3`],
  ];
  return (
    <section aria-label="Ringkasan pesanan" className="flex flex-col gap-4 rounded-lg border-2 border-border-default bg-bg-surface bg-paper p-6 shadow-sticker">
      <h2 className="type-h3 text-text-brand">Ringkasan Pesanan</h2>
      <div className="flex items-center gap-3">
        <div className="flex size-16 shrink-0 items-center justify-center rounded-md border-2 border-border-default bg-bg-brand">
          <Image src="/logo-akm.webp" alt="" width={700} height={516} sizes="52px" className="w-13" />
        </div>
        <div>
          <p className="type-body-m text-text-strong">{EVENT.name}</p>
          <p className="type-caption text-text-secondary">
            {SHOWS[show].label} · {SHOWS[show].time} WIB
          </p>
        </div>
      </div>
      <hr className="border-t-2 border-border-subtle" />
      <dl className="flex flex-col gap-2">
        {rows.map(([k, v]) => (
          <div key={k} className="type-body-s flex justify-between gap-3">
            <dt className="text-text-secondary">{k}</dt>
            <dd className="text-right text-text-strong">{v}</dd>
          </div>
        ))}
      </dl>
      <hr className="border-t-2 border-dashed border-border-subtle" />
      {lines.map((l) => (
        <div key={l.label} className="type-body-s flex justify-between">
          <span>{l.label}</span>
          <span>{l.value}</span>
        </div>
      ))}
      <div className="flex items-center justify-between">
        <span className="type-h4 text-text-strong">Total</span>
        <span className="type-h3 text-text-brand">{total}</span>
      </div>
      {cta && <CtaButton cta={cta} fullWidth />}
      {note && <p className="type-caption text-center text-text-secondary">{note}</p>}
    </section>
  );
}

/** Mobile sticky CTA bar (Figma "Bottom Bar"). */
export function BottomBar({ info, cta }: { info: string; cta: Cta }) {
  const { total } = useOrderLines();
  return (
    <div className="animate-enter sticky bottom-0 z-30 flex flex-col gap-3 border-t-2 border-border-default bg-bg-surface px-4 py-3 sm:flex-row sm:items-center lg:hidden">
      <div className="flex min-w-0 items-center justify-between gap-3 sm:flex-1 sm:flex-col sm:items-start sm:justify-start sm:gap-0">
        <p className="type-caption min-w-0 text-text-secondary sm:w-full sm:truncate">{info}</p>
        <p className="type-h3 shrink-0 text-text-brand">{total}</p>
      </div>
      <div className="[&>*]:w-full sm:[&>*]:w-auto">
        <CtaButton cta={cta} />
      </div>
    </div>
  );
}

const BACK: Record<Step, { label: string; step: Step | null }> = {
  1: { label: "Kembali", step: null },
  2: { label: "Kembali", step: 1 },
  3: { label: "Kembali", step: 2 },
  4: { label: "Kembali", step: 3 },
  5: { label: "Beranda", step: null },
};

/**
 * Page frame for every checkout step: navbar (no CTA), back link + stepper, two-column main
 * (content + 320px aside on desktop), optional mobile bottom bar, footer.
 */
export function CheckoutShell({ step, aside, bottomBar, children }: { step: Step; aside?: React.ReactNode; bottomBar?: React.ReactNode; children: React.ReactNode }) {
  const { show } = useBooking();
  const back = BACK[step];
  return (
    <>
      <Navbar cta={false} />
      <div className="mx-auto w-full max-w-[1440px] flex-1">
        <div data-reveal="fade" className="flex flex-col gap-4 px-4 pt-4 lg:flex-row lg:items-center lg:justify-between lg:px-20 lg:pt-6">
          <div className="lg:w-40">
            <Button variant="ghost" icon="arrow-left" iconStart href={back.step ? stepHref(show, back.step) : "/"}>
              {back.label}
            </Button>
          </div>
          <Stepper step={step} />
          <div className="hidden lg:block lg:w-40" />
        </div>
        <main className="flex flex-col gap-4 px-4 pb-6 pt-4 lg:flex-row lg:items-start lg:gap-6 lg:px-20 lg:pb-24 lg:pt-8">
          <div className="flex min-w-0 flex-1 flex-col gap-4 lg:gap-6">{children}</div>
          {aside && <aside data-reveal="right" className="hidden w-80 shrink-0 flex-col gap-4 lg:sticky lg:top-28 lg:flex">{aside}</aside>}
        </main>
      </div>
      {bottomBar}
      <Footer />
    </>
  );
}

/** Shared card frame for checkout content. */
export function CheckoutCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`flex flex-col gap-5 rounded-lg border-2 border-border-default bg-bg-surface bg-paper p-5 shadow-sticker lg:gap-6 lg:p-8 ${className}`}>{children}</section>;
}
