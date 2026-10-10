"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { useEffect, useRef, useState, useTransition } from "react";
import { submitPayment } from "@/app/pesan/actions";
import { BottomBar, CheckoutCard, CheckoutShell, OrderSummary, stepHref, useOrderLines, useStepGuard, type Cta } from "@/components/checkout/shell";
import { CopyButton } from "@/components/checkout/copy-button";
import { RevealText } from "@/components/site/reveal-text";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PaymentOption } from "@/components/ui/payment-option";
import { Upload } from "@/components/ui/upload";
import { useBooking, type PayMethod } from "@/lib/booking";
import { BANK, HOLD_MINUTES, MAX_PROOF_BYTES, MAX_PROOF_INPUT_BYTES, PROOF_TYPES } from "@/lib/event";
import { compressImage } from "@/lib/compress-image";

const mmss = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
};

export default function BayarPage() {
  const ok = useStepGuard(4);
  const router = useRouter();
  const { show, booking, update } = useBooking();
  const { total } = useOrderLines();
  const [now, setNow] = useState(0); // 0 until mounted (Date.now() is not allowed during prerender)
  const [fileError, setFileError] = useState<string>();
  const [submitError, setSubmitError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const [file, setFile] = useState<File | null>(null); // kept in memory only, never persisted
  const pick = useRef(0); // increments per file pick so stale compressions are ignored

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);

  if (!ok) return null;

  const remaining = booking.holdUntil === null || now === 0 ? HOLD_MINUTES * 60_000 : booking.holdUntil - now;
  const again = () => {
    update({ seats: [], orderId: null, heldSeats: [], holdUntil: null, total: null });
    router.push(stepHref(show, 3));
  };
  const seatsText = booking.seats.join(" & ");
  const n = booking.seats.length;

  if (remaining <= 0) {
    return (
      <CheckoutShell step={4}>
        <CheckoutCard>
          <Alert type="error" title="Waktu pembayaran habis">
            Kursi {seatsText} sudah dilepas. Pilih kursi lagi untuk melanjutkan.
          </Alert>
          <div>
            <Button onClick={again}>Pilih kursi lagi</Button>
          </div>
        </CheckoutCard>
      </CheckoutShell>
    );
  }

  async function onFile(f: File) {
    const id = ++pick.current;
    setSubmitError(undefined);
    setFile(null); // disables submit while processing
    const tooBig = "File terlalu besar. Kirim screenshot bukti bayarnya ya.";
    if (!PROOF_TYPES.includes(f.type)) return reject("Format harus JPG, PNG, atau PDF.");
    let out = f;
    if (f.type === "application/pdf") {
      if (f.size > MAX_PROOF_BYTES) return reject("PDF maksimal 1 MB. Kirim screenshot bukti bayarnya saja ya.");
    } else {
      if (f.size > MAX_PROOF_INPUT_BYTES) return reject(tooBig);
      out = await compressImage(f);
      if (id !== pick.current) return; // a newer pick superseded this one
      if (out.size > MAX_PROOF_BYTES) return reject(tooBig);
    }
    setFileError(undefined);
    setFile(out);
  }
  function reject(msg: string) {
    setFileError(msg);
    setFile(null);
  }

  function submit() {
    if (!file || !booking.orderId) return;
    setSubmitError(undefined);
    const fd = new FormData();
    fd.set("orderId", booking.orderId);
    fd.set("method", booking.method);
    fd.set("proof", file);
    startTransition(async () => {
      try {
        const r = await submitPayment(fd);
        if (r.ok) {
          update({ code: r.code, paidAt: r.paidAt });
          router.push(stepHref(show, 5));
        } else setSubmitError(r.error);
      } catch {
        setSubmitError("Koneksi bermasalah atau file terlalu besar. Coba lagi ya.");
      }
    });
  }

  const cta: Cta = { label: "Kirim Bukti Pembayaran", onClick: submit, disabled: !file || remaining <= 0, loading: pending };
  const method = booking.method;
  const rows: [string, string, boolean][] = [
    ["Bank", BANK.name, false],
    ["No. rekening", BANK.account, true],
    ["Atas nama", BANK.holder, false],
    ["Total transfer", total, true],
  ];

  return (
    <CheckoutShell
      step={4}
      aside={<OrderSummary />}
      bottomBar={<BottomBar info={`Total · ${n} kursi`} cta={{ ...cta, label: "Kirim Bukti" }} />}
    >
      {/* Visual countdown is hidden from AT so the ticking number isn't read out; announce once at 1 minute. */}
      {booking.priceChanged && (
        <Alert type="info" title="Harga diperbarui">Masa presale sudah selesai, jadi totalnya disesuaikan. Cek lagi total di bawah ya.</Alert>
      )}
      <div aria-hidden="true" data-reveal="fade">
        <Alert type="warning" title={`Selesaikan dalam ${mmss(remaining)}`}>
          Kalau waktu habis, kursi {seatsText} dilepas lagi.
        </Alert>
      </div>
      <p className="sr-only">Selesaikan pembayaran dalam {HOLD_MINUTES} menit. Kalau waktu habis, kursi {seatsText} dilepas lagi.</p>
      <p role="status" className="sr-only">{remaining <= 60_000 ? "Sisa waktu pembayaran 1 menit." : ""}</p>

      <CheckoutCard>
        <RevealText as="h1" text="Pilih metode pembayaran" className="type-h4 text-text-brand lg:type-h3" />
        <div role="radiogroup" aria-label="Metode pembayaran" data-reveal-stagger data-reveal="scale" className="flex flex-col gap-4 lg:flex-row [&>*]:lg:flex-1">
          <PaymentOption name="method" value="qris" checked={method === "qris"} onChange={(v) => update({ method: v as PayMethod })} title="QRIS" description="Scan pakai e-wallet atau m-banking apa saja" icon="qr-code" />
          <PaymentOption name="method" value="transfer" checked={method === "transfer"} onChange={(v) => update({ method: v as PayMethod })} title="Transfer Bank" description="Transfer ke rekening Blu by BCA" icon="bank" />
        </div>

        {method === "qris" ? (
          <div data-reveal="up" className="flex flex-col items-center gap-6 rounded-md border-2 border-border-brand bg-bg-brand-soft p-6 lg:flex-row lg:items-start">
            <Image src="/QRIS.webp" alt="Kode QRIS untuk membayar tiket" width={552} height={552} sizes="(min-width: 1024px) 280px, 80vw" className="size-auto w-full max-w-[280px] shrink-0 rounded-md border-2 border-border-default bg-bg-surface" />
            <div className="flex min-w-0 flex-1 flex-col gap-3 self-stretch">
              <p className="type-caption text-text-primary">Total bayar</p>
              <p className="type-h2 text-text-strong">{total}</p>
              <ol className="flex flex-col gap-3">
                {["Buka e-wallet atau m-banking kamu.", "Scan QR, bayar persis sesuai total.", "Screenshot bukti bayar, lalu upload di bawah."].map((t, i) => (
                  <li key={t} className="type-body-m flex items-center gap-3 text-text-primary">
                    <span aria-hidden="true" className="type-label flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-border-default bg-bg-accent text-text-strong">{i + 1}</span>
                    {t}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        ) : (
          <div data-reveal="up" className="flex flex-col gap-6 rounded-md border-2 border-border-brand bg-bg-brand-soft p-6">
            {rows.map(([label, value, copy]) => (
              <div key={label} className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 flex-col gap-0.5">
                  <p className="type-caption text-text-primary">{label}</p>
                  <p className={`${label === "Total transfer" ? "type-h4" : "type-body-l"} break-words text-text-strong`}>{value}</p>
                </div>
                {copy && <CopyButton value={value} label={label} />}
              </div>
            ))}
            <p className="type-caption text-text-primary">Transfer persis sesuai total ya.</p>
          </div>
        )}

        <div data-reveal="up" className="flex flex-col gap-5 lg:gap-6">
        <h2 className="type-h4 text-text-strong">Upload bukti pembayaran</h2>
        <Upload
          accept="image/jpeg,image/png,application/pdf"
          file={file}
          error={fileError}
          onFile={onFile}
        />
        {submitError && (
          <Alert type="error" title="Bukti belum terkirim">
            {submitError}
            {submitError.startsWith("Waktu pembayaran habis") && (
              <div className="mt-2"><Button variant="secondary" onClick={again}>Pilih kursi lagi</Button></div>
            )}
          </Alert>
        )}
        </div>

        <div data-reveal="up" className="hidden justify-end lg:flex">
          <Button icon="arrow-right" onClick={cta.onClick} disabled={cta.disabled} loading={cta.loading}>
            {cta.label}
          </Button>
        </div>
      </CheckoutCard>
    </CheckoutShell>
  );
}
