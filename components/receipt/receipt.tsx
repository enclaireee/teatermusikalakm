import { Icon } from "@/components/ui/icon";
import { Stamp } from "@/components/ui/stamp";
import { CONTACT, EVENT, SHOWS, formatRupiah, tierPriceLabel, totalLabel, type ShowId } from "@/lib/event";
import { SEATS } from "@/lib/seats";
import type { Buyer, PayMethod } from "@/lib/booking";

const TZ = "Asia/Jakarta";
const fmtDate = (ms: number) => new Intl.DateTimeFormat("id-ID", { timeZone: TZ, day: "numeric", month: "short", year: "numeric" }).format(ms);
const fmtTime = (ms: number) => new Intl.DateTimeFormat("id-ID", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false }).format(ms);
const fmtStamp = (ms: number) => `${fmtDate(ms)}, ${fmtTime(ms)} WIB`;

// Scalloped curtain valance (same geometry as valance(800, 40, 10) in figma-plugin/code.js).
const W = 800, H = 40, N = 10, S = W / N, R = Math.min(H * 0.45, S / 2);
let VALANCE = `M0 0H${W}V${H - R}`;
for (let i = N; i > 0; i--) VALANCE += `A${S / 2} ${R} 0 0 1 ${(i - 1) * S} ${H - R}`;
VALANCE += "Z";

export type ReceiptProps = {
  show: ShowId;
  buyer: Buyer;
  seats: string[];
  method: PayMethod;
  code: string;
  issuedAt: number;
  status: "pending" | "verified";
  ref?: React.Ref<HTMLDivElement>;
};

/** Fixed 800px A4-ratio e-receipt (mirrors receipt() in figma-plugin/code.js). Pass `ref` to capture it for PDF. */
export function Receipt({ show, buyer, seats, method, code, issuedAt, status, ref }: ReceiptProps) {
  const s = SHOWS[show];
  const tiers = seats.map((id) => SEATS[id]?.tier);
  const rows = seats.map((id, i) => ({ id, tier: tiers[i], price: tiers[i] ? tierPriceLabel(tiers[i]) : formatRupiah(null) }));
  const total = totalLabel(tiers.filter((t): t is NonNullable<typeof t> => !!t));
  const verified = status === "verified";
  const pays = [
    ["Detail Pemesan", [["Nama", buyer.name], ["Email", buyer.email], ["WhatsApp", buyer.phone]]],
    ["Detail Acara", [["Show", s.label], ["Tanggal", EVENT.dateShort], ["Jam", `${s.time.replace(" – ", "–")} WIB`], ["Lokasi", EVENT.venue]]],
  ] as const;

  return (
    <div ref={ref} className="relative flex min-h-[1131px] w-[800px] flex-col overflow-hidden border border-border-default bg-bg-surface bg-paper">
      <header className="flex items-center justify-between bg-bg-brand px-10 py-8">
        <div className="flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element -- plain eager <img> so html-to-image captures it reliably */}
          <img src="/logo-akm.webp" alt="Logo Aku, Kau & Musik" width={104} height={77} loading="eager" />
          <div>
            <h1 className="type-h1 text-text-accent">E-RECEIPT</h1>
            <p className="type-body-m text-text-on-brand">{EVENT.fullName}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <span className="type-caption text-text-on-brand">Kode booking</span>
          <span className="type-h3 text-text-accent">{code}</span>
          <span className="type-caption text-text-on-brand">Diterbitkan {fmtStamp(issuedAt)}</span>
        </div>
      </header>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="block fill-bg-danger stroke-border-default" strokeWidth={3} aria-hidden>
        <path d={VALANCE} />
      </svg>

      <div className="flex flex-1 flex-col gap-6 px-10 py-8">
        <div className="flex items-center gap-3">
          <span className="type-body-m text-text-secondary">Status pembayaran:</span>
          <span className={`type-label rounded-full border px-3 py-1 ${verified ? "border-border-brand bg-bg-brand-soft text-text-brand" : "border-border-accent bg-bg-accent-soft text-text-strong"}`}>
            {verified ? "Terverifikasi" : "Menunggu verifikasi"}
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
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="px-5 py-3">{r.id}</td>
                <td className="px-5 py-3">{r.tier}</td>
                <td className="px-5 py-3 text-right">{r.price}</td>
              </tr>
            ))}
            <tr className="type-label bg-bg-accent-soft">
              <td className="px-5 py-3">Total</td>
              <td className="px-5 py-3">{seats.length} tiket</td>
              <td className="px-5 py-3 text-right">{total}</td>
            </tr>
          </tbody>
        </table>

        <div className="type-body-s flex justify-between text-text-secondary">
          <span>Metode: {method === "qris" ? "QRIS" : "Transfer Bank"}</span>
          <span>Dibayar {fmtStamp(issuedAt)}</span>
        </div>
      </div>

      <div className="relative flex items-center gap-6 border-t-2 border-dashed border-border-default bg-bg-accent-soft px-10 py-7">
        <span className="absolute -left-3.5 -top-3.5 size-7 rounded-full border-2 border-border-default bg-bg-muted" />
        <span className="absolute -right-3.5 -top-3.5 size-7 rounded-full border-2 border-border-default bg-bg-muted" />
        <div className="flex size-[120px] shrink-0 items-center justify-center rounded-sm border border-border-default bg-bg-surface text-text-strong">
          <Icon name="qr-code" size={88} />
        </div>
        <div className="flex min-w-0 flex-col gap-1.5">
          <p className="type-label text-text-strong">Scan untuk cek status pesanan</p>
          <p className="type-body-s text-text-primary">
            E-receipt ini bukti pembayaran, bukan tiket masuk. E-tiket ber-QR dikirim via email &amp; WhatsApp setelah verifikasi. Datang lebih awal ya, biar nggak buru-buru!
          </p>
        </div>
      </div>

      <footer className="type-caption flex justify-between bg-bg-brand-strong px-10 py-4">
        <span className="text-text-on-brand">{CONTACT.instagram} · {CONTACT.email} · WA {CONTACT.whatsapp}</span>
        <span className="text-text-accent">Presented by Juzzer × Stage UI</span>
      </footer>

      <div className="absolute right-10 top-[205px]">
        {verified ? <Stamp color="green">CONFIRMED</Stamp> : <Stamp color="red">DITERIMA</Stamp>}
      </div>
    </div>
  );
}
