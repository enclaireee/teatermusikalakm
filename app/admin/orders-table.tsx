import Link from "next/link";
import type { AdminOrder } from "@/lib/admin";
import { SHOWS, formatRupiah } from "@/lib/event";
import { ProofButton } from "./proof-dialog";
import { MarkToggle } from "./mark-toggle";
import { BuyerChip, HargaChip, METHOD_LABEL, formatWib } from "./status-chip";

const TH = "px-1.5 py-2 text-left md:px-3";
const TD = "px-1.5 py-2 align-middle md:px-3";

export function OrdersTable({ orders }: { orders: AdminOrder[] }) {
  return (
    <div className="overflow-x-auto rounded-md border-2 border-border-default bg-bg-surface">
      <table className="type-body-s w-full text-left text-text-primary">
        <caption className="sr-only">Daftar pesanan dibayar</caption>
        <thead className="border-b-2 border-border-default bg-bg-muted type-label text-text-strong">
          <tr>
            <th scope="col" className={TH}>Kode</th>
            <th scope="col" className={TH}>Pembeli</th>
            <th scope="col" className={TH}>Cek</th>
            <th scope="col" className={`${TH} hidden md:table-cell`}>Show</th>
            <th scope="col" className={`${TH} hidden md:table-cell`}>Kursi</th>
            <th scope="col" className={`${TH} hidden text-right md:table-cell`}>Total</th>
            <th scope="col" className={`${TH} hidden lg:table-cell`}>Metode</th>
            <th scope="col" className={`${TH} hidden lg:table-cell`}>Harga</th>
            <th scope="col" className={`${TH} hidden lg:table-cell`}>Status</th>
            <th scope="col" className={`${TH} hidden xl:table-cell`}>Dibayar</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} className="relative border-b border-border-subtle last:border-b-0 hover:bg-bg-accent-soft focus-within:bg-bg-accent-soft">
              <td className={TD}>
                <Link href={`/admin/${o.id}`} className="font-bold text-text-strong after:absolute after:inset-0">{o.code}</Link>
              </td>
              <td className={`${TD} max-w-48 min-w-0`}>
                <p className="truncate text-text-strong">{o.buyer.name}</p>
                <p className="type-caption text-text-secondary">{o.buyer.phone}</p>
                <p className="type-caption text-text-secondary md:hidden">{SHOWS[o.show].label} · {o.qty} tiket · {formatRupiah(o.total)}{o.presale ? " · Presale" : ""}</p>
                <div className="relative z-10 mt-1 w-fit"><ProofButton order={o} /></div>
              </td>
              <td className={`${TD} relative z-10`}>
                <MarkToggle id={o.id} code={o.code} checked={o.checked} size="sm" />
              </td>
              <td className={`${TD} hidden whitespace-nowrap md:table-cell`}>{SHOWS[o.show].label}</td>
              <td className={`${TD} hidden md:table-cell`}>{o.tier} · {o.seats.join(", ")}</td>
              <td className={`${TD} hidden text-right tabular-nums whitespace-nowrap md:table-cell`}>{formatRupiah(o.total)}</td>
              <td className={`${TD} hidden lg:table-cell`}>{o.method ? METHOD_LABEL[o.method] : "—"}</td>
              <td className={`${TD} hidden lg:table-cell`}><HargaChip presale={o.presale} /></td>
              <td className={`${TD} hidden lg:table-cell`}><BuyerChip status={o.status} /></td>
              <td className={`${TD} hidden whitespace-nowrap xl:table-cell`}>{formatWib(o.paidAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
