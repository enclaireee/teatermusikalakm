"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BottomBar, CheckoutCard, CheckoutShell, OrderSummary, stepHref, useOrderLines, useStepGuard, type Cta } from "@/components/checkout/shell";
import { CopyButton } from "@/components/checkout/copy-button";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { PaymentOption } from "@/components/ui/payment-option";
import { Upload } from "@/components/ui/upload";
import { makeBookingCode, useBooking, type PayMethod } from "@/lib/booking";
import { BANK, HOLD_MINUTES, MAX_PROOF_BYTES, PROOF_TYPES } from "@/lib/event";

const mmss = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
};

export default function BayarPage() {
  const ok = useStepGuard(3);
  const router = useRouter();
  const { show, booking, update } = useBooking();
  const { total } = useOrderLines();
  const [now, setNow] = useState(0); // 0 until mounted (Date.now() is not allowed during prerender)
  const [error, setError] = useState<string>();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [file, setFile] = useState<File | null>(null); // kept in memory only, never persisted
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]); // simulated-upload timeouts
  const submitTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const clearUpload = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  useEffect(() => {
    if (ok && booking.holdUntil === null) update({ holdUntil: Date.now() + HOLD_MINUTES * 60_000 });
  }, [ok, booking.holdUntil, update]);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    return () => {
      timers.current.forEach(clearTimeout);
      clearTimeout(submitTimer.current);
    };
  }, []);

  if (!ok) return null;

  const remaining = booking.holdUntil === null || now === 0 ? HOLD_MINUTES * 60_000 : booking.holdUntil - now;
  const seatsText = booking.seats.join(" & ");
  const n = booking.seats.length;

  if (remaining <= 0) {
    return (
      <CheckoutShell step={3}>
        <CheckoutCard>
          <Alert type="error" title="Waktu pembayaran habis">
            Kursi {seatsText} sudah dilepas. Pilih kursi lagi untuk melanjutkan.
          </Alert>
          <div>
            <Button
              onClick={() => {
                update({ seats: [], holdUntil: null, proof: null });
                router.push(stepHref(show, 2));
              }}
            >
              Pilih kursi lagi
            </Button>
          </div>
        </CheckoutCard>
      </CheckoutShell>
    );
  }

  function onFile(f: File) {
    clearUpload();
    const reject = (msg: string) => {
      setError(msg);
      setUploading(false);
      update({ proof: null });
    };
    if (!PROOF_TYPES.includes(f.type)) return reject("Format harus JPG, PNG, atau PDF.");
    if (f.size > MAX_PROOF_BYTES) return reject("Maksimal 5 MB. Kompres foto atau pilih file lain.");
    setError(undefined);
    setFile(f);
    update({ proof: null });
    setUploading(true);
    setProgress(0);
    // Simulated upload (~1s): frontend-only mock, no network.
    for (let i = 1; i <= 10; i++) {
      timers.current.push(
        setTimeout(() => {
          setProgress(i * 10);
          if (i === 10) {
            setUploading(false);
            update({ proof: { name: f.name, size: f.size, type: f.type } });
          }
        }, i * 100),
      );
    }
  }

  function submit() {
    setSubmitting(true);
    const hold = booking.holdUntil;
    clearTimeout(submitTimer.current);
    submitTimer.current = setTimeout(() => {
      if (hold !== null && Date.now() >= hold) return setSubmitting(false); // hold expired meanwhile
      update({ code: makeBookingCode(show), paidAt: Date.now() });
      router.push(stepHref(show, 4));
    }, 1200);
  }

  const cta: Cta = { label: "Kirim Bukti Pembayaran", onClick: submit, disabled: !booking.proof || uploading, loading: submitting };
  const method = booking.method;
  const rows: [string, string, boolean][] = [
    ["Bank", BANK.name, false],
    ["No. rekening", BANK.account, true],
    ["Atas nama", BANK.holder, false],
    ["Total transfer", total, true],
  ];

  return (
    <CheckoutShell
      step={3}
      aside={
        <>
          <OrderSummary />
          <Alert type="info" title="Verifikasi manual">
            Panitia cek pembayaranmu maks. 1×24 jam. E-tiket dikirim setelah terverifikasi.
          </Alert>
        </>
      }
      bottomBar={<BottomBar info={`Total · ${n} kursi`} cta={{ ...cta, label: "Kirim Bukti" }} />}
    >
      {/* Visual countdown is hidden from AT so the ticking number isn't read out; announce once at 1 minute. */}
      <div aria-hidden="true">
        <Alert type="warning" title={`Selesaikan dalam ${mmss(remaining)}`}>
          Kalau waktu habis, kursi {seatsText} dilepas lagi.
        </Alert>
      </div>
      <p className="sr-only">Selesaikan pembayaran dalam {HOLD_MINUTES} menit. Kalau waktu habis, kursi {seatsText} dilepas lagi.</p>
      <p role="status" className="sr-only">{remaining <= 60_000 ? "Sisa waktu pembayaran 1 menit." : ""}</p>

      <CheckoutCard>
        <h1 className="type-h4 text-text-brand lg:type-h3">Pilih metode pembayaran</h1>
        <div role="radiogroup" aria-label="Metode pembayaran" className="flex flex-col gap-4 lg:flex-row [&>*]:lg:flex-1">
          <PaymentOption name="method" value="qris" checked={method === "qris"} onChange={(v) => update({ method: v as PayMethod })} title="QRIS" description="Scan pakai e-wallet atau m-banking apa saja" icon="qr-code" />
          <PaymentOption name="method" value="transfer" checked={method === "transfer"} onChange={(v) => update({ method: v as PayMethod })} title="Transfer Bank" description="Blu by BCA · dicek manual oleh panitia" icon="bank" />
        </div>

        {method === "qris" ? (
          <div className="flex flex-col items-center gap-6 rounded-md border-2 border-border-brand bg-bg-brand-soft p-6 lg:flex-row lg:items-start">
            <div className="flex size-[200px] shrink-0 flex-col items-center justify-center gap-2 rounded-md border-2 border-border-default bg-bg-surface">
              <Icon name="qr-code" size={120} className="text-text-strong" />
              <span className="type-caption text-text-secondary">QR placeholder</span>
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-3 self-stretch">
              <p className="type-caption text-text-secondary">Total bayar</p>
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
          <div className="flex flex-col gap-6 rounded-md border-2 border-border-brand bg-bg-brand-soft p-6">
            {rows.map(([label, value, copy]) => (
              <div key={label} className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 flex-col gap-0.5">
                  <p className="type-caption text-text-secondary">{label}</p>
                  <p className={`${label === "Total transfer" ? "type-h4" : "type-body-l"} break-words text-text-strong`}>{value}</p>
                </div>
                {copy && <CopyButton value={value} label={label} />}
              </div>
            ))}
            <p className="type-caption text-text-secondary">Transfer persis sesuai total supaya verifikasi lebih cepat.</p>
          </div>
        )}

        <h3 className="type-h4 text-text-strong">Upload bukti pembayaran</h3>
        <Upload
          accept="image/jpeg,image/png,application/pdf"
          file={uploading ? { name: file?.name ?? "", size: 0 } : booking.proof}
          uploading={uploading}
          progress={progress}
          error={error}
          onFile={onFile}
        />

        <div className="hidden justify-end lg:flex">
          <Button icon="arrow-right" onClick={cta.onClick} disabled={cta.disabled} loading={cta.loading}>
            {cta.label}
          </Button>
        </div>
      </CheckoutCard>
    </CheckoutShell>
  );
}
