import type { AdminOrder } from "@/lib/admin";
import { SHOWS, formatRupiah } from "@/lib/event";
import { CHECK_LABEL, CHECK_STYLE, type CheckKey } from "./status-chip";

const CARD = "min-w-0 rounded-md border-2 border-border-default bg-bg-surface bg-paper";
const GRID = "grid grid-cols-3 divide-x-2 divide-border-default";
const NUM = "type-h4 min-[400px]:type-h3 tabular-nums";

export function Summary({ orders }: { orders: AdminOrder[] }) {
  const tickets = (s: "1" | "2") => orders.filter((o) => o.show === s).reduce((n, o) => n + o.qty, 0);
  const count = (c: boolean | null) => orders.filter((o) => o.checked === c).length;
  const tiket: [string, number][] = [
    ["Pesanan", orders.length],
    [`Show 1 (${SHOWS["1"].start})`, tickets("1")],
    [`Show 2 (${SHOWS["2"].start})`, tickets("2")],
  ];
  const cek: [CheckKey, number, string][] = [
    ["belum", count(null), "text-text-strong"],
    ["valid", count(true), "text-text-brand"],
    ["tidak", count(false), "text-text-danger"],
  ];
  const referral = orders.filter((o) => o.referral);
  const referralTickets = referral.reduce((n, o) => n + o.qty, 0);
  const referralDiscount = referral.reduce((n, o) => n + o.qty * o.discountPerTicket, 0);
  const ref: [string, string][] = [
    ["Pesanan", String(referral.length)],
    ["Tiket", String(referralTickets)],
    ["Potongan", formatRupiah(referralDiscount)],
  ];
  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <section className={CARD} aria-labelledby="sum-tiket">
        <h2 id="sum-tiket" className="type-label border-b-2 border-border-default px-3 py-2 text-text-strong">Tiket</h2>
        <dl className={GRID}>
          {tiket.map(([label, n]) => (
            <div key={label} className="flex min-w-0 flex-col gap-1 p-3">
              <dt className="type-caption text-text-secondary">{label}</dt>
              <dd className={`${NUM} text-text-strong`}>{n}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section className={CARD} aria-labelledby="sum-cek">
        <h2 id="sum-cek" className="type-label border-b-2 border-border-default px-3 py-2 text-text-strong">Cek admin</h2>
        <dl className={GRID}>
          {cek.map(([k, n, color]) => (
            <div key={k} className="flex min-w-0 flex-col items-start gap-1 p-3">
              <dt className={`type-caption max-w-full truncate rounded-full border-2 px-2 py-0.5 ${CHECK_STYLE[k]}`}>{CHECK_LABEL[k]}</dt>
              <dd className={`${NUM} ${color}`}>{n}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section className={CARD} aria-labelledby="sum-referral">
        <h2 id="sum-referral" className="type-label border-b-2 border-border-default px-3 py-2 text-text-strong">Referral</h2>
        <dl className={GRID}>
          {ref.map(([label, value]) => (
            <div key={label} className="flex min-w-0 flex-col gap-1 p-3">
              <dt className="type-caption text-text-secondary">{label}</dt>
              <dd className={`${NUM} text-text-strong`}>{value}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
