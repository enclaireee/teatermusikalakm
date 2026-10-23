import Link from "next/link";
import type { AdminOrder } from "@/lib/admin";
import { EVENT, SHOWS, formatRupiah } from "@/lib/event";
import { BuyerChip, HargaChip, METHOD_LABEL, formatWib } from "../status-chip";

const LINK = "text-text-brand underline break-all";

export function OrderSummary({ order: o }: { order: AdminOrder }) {
  const harga = o.referral ? `Referral (${o.presale ? "Presale" : "Normal"})` : o.presale ? "Presale" : "Normal";
  const rows: [string, React.ReactNode][] = [
    ["Show", `${SHOWS[o.show].label} · ${EVENT.dateShort} · ${SHOWS[o.show].start} WIB`],
    ["Kursi", `${o.tier} · ${o.seats.join(", ")}`],
    ["Jumlah tiket", o.qty],
    ["Tipe harga", harga],
    ...(o.referral
      ? [
          ["Kode referral", o.referralCode ?? "—"],
          ["Diskon per tiket", formatRupiah(o.discountPerTicket)],
        ] as [string, string][]
      : []),
    ["Total", formatRupiah(o.total)],
    ["Metode", o.method ? METHOD_LABEL[o.method] : "—"],
    ["Status pembeli", <BuyerChip key="s" status={o.status} />],
    ["Dibayar", formatWib(o.paidAt)],
    ["Dibuat", formatWib(o.createdAt)],
    ["Nama", o.buyer.name],
    ["Email", <a key="e" href={`mailto:${o.buyer.email}`} className={LINK}>{o.buyer.email}</a>],
    ["WhatsApp", <a key="w" href={`tel:${o.buyer.phone}`} className={LINK}>{o.buyer.phone}</a>],
    ["Instansi", o.buyer.org || "—"],
  ];
  return (
    <div className="flex flex-col gap-4">
      <Link href="/admin" className="type-label inline-flex min-h-11 w-fit items-center text-text-brand underline">← Semua pesanan</Link>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="type-h3 break-words text-text-strong">{o.code}</h1>
        <HargaChip presale={o.presale} referral={o.referral} />
      </div>
      <dl className="type-body-s grid gap-3 md:grid-cols-2">
        {rows.map(([k, v]) => (
          <div key={k} className="min-w-0">
            <dt className="type-caption text-text-secondary">{k}</dt>
            <dd className="break-words text-text-strong tabular-nums">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
