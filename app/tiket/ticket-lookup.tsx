"use client";

import { useRef, useState, useTransition } from "react";
import { Receipt } from "@/components/receipt/receipt";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Stamp } from "@/components/ui/stamp";
import { lookupTicket, type Ticket } from "@/app/pesan/actions";
import { CONTACT, EVENT, SHOWS, formatRupiah } from "@/lib/event";
import { downloadReceiptPdf } from "@/lib/pdf";

const CARD = "relative mx-auto flex w-full max-w-[720px] flex-col gap-6 rounded-lg border-2 border-border-default bg-bg-surface bg-paper p-6 shadow-sticker-l lg:p-12";

export function TicketLookup() {
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [ticket, setTicket] = useState<Ticket>();
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState(false);
  const [pdfError, setPdfError] = useState<string>();
  const receipt = useRef<HTMLDivElement>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(undefined);
    setPdfError(undefined);
    start(async () => {
      try {
        const r = await lookupTicket(code, email);
        if (r.ok) setTicket(r.ticket);
        else { setTicket(undefined); setError(r.error); }
      } catch {
        setTicket(undefined);
        setError("Koneksi bermasalah. Coba lagi ya.");
      }
    });
  }

  async function download() {
    if (!receipt.current || !ticket) return;
    setBusy(true);
    setPdfError(undefined);
    try {
      await downloadReceiptPdf(receipt.current, `e-tiket-${ticket.code}.pdf`);
    } catch (e) {
      setPdfError(e instanceof Error ? e.message : "Gagal membuat PDF. Coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  const valid = ticket?.status === "valid";
  const details: [string, string][] = ticket
    ? [
        ["Show", `${SHOWS[ticket.show].label} · ${EVENT.dateShort} · ${SHOWS[ticket.show].start} WIB`],
        ["Kursi", `${ticket.seats.join(", ")} (${ticket.tier}${ticket.tierName !== ticket.tier ? ` · ${ticket.tierName}` : ""})`],
        ["Atas nama", ticket.buyer.name],
        ["Total", formatRupiah(ticket.total)],
      ]
    : [];

  return (
    <div className="flex flex-col gap-8">
      <form onSubmit={submit} className={CARD}>
        <div className="flex flex-col gap-2">
          <h1 className="type-h2 lg:type-h1 text-text-brand">Cek tiket</h1>
          <p className="type-body-l text-text-primary">Masukkan kode booking (5 karakter) dan email yang kamu pakai waktu pesan.</p>
        </div>
        <Field label="Kode booking" required maxLength={5} autoComplete="off" autoCapitalize="characters" spellCheck={false} value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
        <Field label="Email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        {error && <Alert type="error" title="Tiket tidak ditemukan">{error}</Alert>}
        <Button type="submit" icon="arrow-right" loading={pending} fullWidth>Cek Tiket</Button>
      </form>

      {ticket && (
        // keyed + focused on mount so screen readers land on each new result (aria-live misses freshly mounted regions)
        <section key={ticket.code} ref={(el) => el?.focus()} tabIndex={-1} aria-label="Hasil cek tiket" className={`${CARD} focus:outline-none`}>
          <div className="absolute right-4 top-4 lg:right-8 lg:top-8">
            <Stamp color={valid ? "green" : "red"} rotate={-10}>{valid ? "BERHASIL" : "BATAL"}</Stamp>
          </div>
          <div className="min-w-0 pt-10 lg:pt-0">
            <p className="type-caption text-text-secondary">Kode booking</p>
            <p className="type-h2 break-words text-text-strong">{ticket.code}</p>
          </div>
          <dl className="flex flex-col gap-2.5">
            {details.map(([k, v]) => (
              <div key={k} className="type-body-s flex justify-between gap-3">
                <dt className="text-text-secondary">{k}</dt>
                <dd className="min-w-0 break-words text-right text-text-strong">{v}</dd>
              </div>
            ))}
            <div className="type-body-s flex items-center justify-between gap-3">
              <dt className="text-text-secondary">Status</dt>
              <dd className={`type-caption rounded-full border-2 px-3 py-1 ${valid ? "border-border-brand bg-bg-brand-soft text-text-brand" : "border-border-danger bg-bg-danger-soft text-text-danger"}`}>
                {valid ? "Berhasil dipesan" : "Tidak berlaku"}
              </dd>
            </div>
          </dl>

          {valid ? (
            <>
              {pdfError && <Alert type="error" title="Gagal membuat PDF">{pdfError}</Alert>}
              <Button icon="download" fullWidth loading={busy} onClick={download}>Download E-Tiket (PDF)</Button>
            </>
          ) : (
            <Alert type="error" title="Tiket ini sudah tidak berlaku">
              Pesananmu dibatalkan, jadi tiket ini nggak bisa dipakai masuk. Kalau merasa ini keliru, hubungi {CONTACT.persons.map((p) => `${p.name} (${p.phone} / Line ${p.line})`).join(" atau ")}, atau DM Instagram {CONTACT.instagram}.
            </Alert>
          )}
        </section>
      )}

      {valid && (
        <div aria-hidden="true" inert className="fixed -left-[10000px] top-0">
          <Receipt ref={receipt} ticket={ticket} />
        </div>
      )}
    </div>
  );
}
