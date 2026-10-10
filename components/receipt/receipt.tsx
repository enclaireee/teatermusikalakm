import { Stamp } from "@/components/ui/stamp";
import { CONTACT, EVENT, SHOWS, formatRupiah } from "@/lib/event";
import type { Ticket } from "@/app/pesan/actions";

const TZ = "Asia/Jakarta";
const fmtDate = (ms: number) => new Intl.DateTimeFormat("id-ID", { timeZone: TZ, day: "numeric", month: "short", year: "numeric" }).format(ms);
const fmtTime = (ms: number) => new Intl.DateTimeFormat("id-ID", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false }).format(ms);
const fmtStamp = (ms: number) => `${fmtDate(ms)}, ${fmtTime(ms)} WIB`;

// Scalloped curtain valance (same geometry as valance(800, 40, 10) in figma-plugin/code.js).
const W = 800, H = 40, N = 10, S = W / N, R = Math.min(H * 0.45, S / 2);
let VALANCE = `M0 0H${W}V${H - R}`;
for (let i = N; i > 0; i--) VALANCE += `A${S / 2} ${R} 0 0 1 ${(i - 1) * S} ${H - R}`;
VALANCE += "Z";

/** Fixed 800px A4-ratio E-Tiket (entry ticket). Pass `ref` to capture it for PDF. */
export function Receipt({ ticket, ref }: { ticket: Ticket; ref?: React.Ref<HTMLDivElement> }) {
  const { code, buyer, seats, method, tierName, total, paidAt } = ticket;
  const s = SHOWS[ticket.show];
  const perSeat = formatRupiah(total / seats.length);
  const valid = ticket.status === "valid";
  const pays = [
    ["Detail Pemesan", [["Nama", buyer.name], ["Email", buyer.email], ["WhatsApp", buyer.phone]]],
    ["Detail Acara", [["Show", s.label], ["Tanggal", EVENT.dateShort], ["Jam", `${s.time.replace(" – ", "–")} WIB`], ["Lokasi", EVENT.venue]]],
  ] as const;

  // no bg-paper here: html-to-image can't embed its SVG noise and the PDF background turns black
  return (
    <div ref={ref} className="relative flex min-h-[1131px] w-[800px] flex-col overflow-hidden border border-border-default bg-bg-surface">
      <header className="flex items-center justify-between bg-bg-brand px-10 py-8">
        <div className="flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element -- plain eager <img> so html-to-image captures it reliably */}
          <img src="/logo-akm.webp" alt="Logo Aku Kau & Musik" width={104} height={77} loading="eager" />
          <div>
            <h1 className="type-h1 text-text-accent">E-TIKET</h1>
            <p className="type-body-m text-text-on-brand">{EVENT.fullName}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <span className="type-caption text-text-on-brand">Kode booking</span>
          <span className="type-h3 text-text-accent">{code}</span>
          <span className="type-caption text-text-on-brand">Diterbitkan {fmtStamp(paidAt)}</span>
        </div>
      </header>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="block fill-bg-danger stroke-border-default" strokeWidth={3} aria-hidden>
        <path d={VALANCE} />
      </svg>

      <div className="flex flex-1 flex-col gap-6 px-10 py-8">
        <div className="flex items-center gap-3">
          <span className="type-body-m text-text-secondary">Status tiket:</span>
          <span className={`type-label rounded-full border px-3 py-1 ${valid ? "border-border-brand bg-bg-brand-soft text-text-brand" : "border-border-danger bg-bg-danger-soft text-text-danger"}`}>
            {valid ? "Berhasil dipesan" : "Tidak berlaku"}
          </span>
        </div>

        <div className="flex gap-6">
          {pays.map(([title, items]) => (
            <section key={title} className="flex min-w-0 flex-1 flex-col gap-2.5 rounded-md border border-border-default bg-bg-page p-5">
              <h2 className="type-h4 text-text-brand">{title}</h2>
              {items.map(([l, v]) => (
                <div key={l} className="flex justify-between gap-2">
                  <span className="type-body-s text-text-secondary">{l}</span>
                  <span className="type-body-s min-w-0 break-words text-right text-text-strong">{v}</span>
                </div>
              ))}
            </section>
          ))}
        </div>

        <table className="w-full border-separate border-spacing-0 overflow-hidden rounded-md border border-border-default text-left">
          <thead>
            <tr className="type-label bg-bg-brand-soft text-text-brand">
              <th className="px-5 py-3">Kursi</th>
              <th className="px-5 py-3">Kategori</th>
              <th className="px-5 py-3 text-right">Harga</th>
            </tr>
          </thead>
          <tbody className="type-body-s text-text-strong">
            {seats.map((id) => (
              <tr key={id}>
                <td className="px-5 py-3">{id}</td>
                <td className="px-5 py-3">{ticket.tier}{tierName !== ticket.tier ? ` · ${tierName}` : ""}</td>
                <td className="px-5 py-3 text-right">{perSeat}</td>
              </tr>
            ))}
            <tr className="type-label bg-bg-accent-soft">
              <td className="px-5 py-3">Total</td>
              <td className="px-5 py-3">{seats.length} tiket</td>
              <td className="px-5 py-3 text-right">{formatRupiah(total)}</td>
            </tr>
          </tbody>
        </table>

        <div className="type-body-s flex justify-between text-text-secondary">
          <span>Metode: {method === "qris" ? "QRIS" : "Transfer Bank"}</span>
          <span>Dibayar {fmtStamp(paidAt)}</span>
        </div>
      </div>

      <div className="relative flex items-center gap-6 border-t-2 border-dashed border-border-default bg-bg-accent-soft px-10 py-7">
        <span className="absolute -left-3.5 -top-3.5 size-7 rounded-full border-2 border-border-default bg-bg-muted" />
        <span className="absolute -right-3.5 -top-3.5 size-7 rounded-full border-2 border-border-default bg-bg-muted" />
        <div className="flex shrink-0 flex-col items-center gap-1 rounded-sm border-2 border-border-default bg-bg-surface px-6 py-4">
          <span className="type-caption text-text-secondary">Kode booking</span>
          <span className="type-h1 tracking-widest text-text-strong">{code}</span>
        </div>
        <div className="flex min-w-0 flex-col gap-1.5">
          <p className="type-label text-text-strong">PDF ini adalah tiket masukmu</p>
          <p className="type-body-s text-text-primary">
            Tunjukkan e-tiket ini beserta kode booking di pintu masuk. Simpan baik-baik dan jangan dibagikan ke siapa pun ya. Datang lebih awal, biar nggak buru-buru!
          </p>
        </div>
      </div>

      <footer className="type-caption flex flex-wrap justify-between gap-x-6 gap-y-1 bg-bg-brand-strong px-10 py-4">
        <span className="text-text-on-brand">{CONTACT.instagram} · {CONTACT.persons.map((p) => `${p.name} ${p.phone}`).join(" · ")}</span>
        <span className="text-text-accent">Presented by Juzzer × Stage UI</span>
      </footer>

      <div className="absolute right-10 top-[205px]">
        {valid ? <Stamp color="green">CONFIRMED</Stamp> : <Stamp color="red">BATAL</Stamp>}
      </div>
    </div>
  );
}
