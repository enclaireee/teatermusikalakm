import Link from "next/link";
import { getPricing, listOrders } from "@/lib/admin";
import { Filters } from "./filters";
import { Header } from "./header";
import { OrdersTable } from "./orders-table";
import { PresaleBar } from "./presale-bar";
import { Summary } from "./summary";

const one = (v: string | string[] | undefined) => (typeof v === "string" ? v : "");
const CEK = { belum: null, valid: true, tidak: false } as const;

// Reads the session cookie before rendering, so navigation here blocks (see layout.tsx).
export const instant = false;

export default async function AdminPage({ searchParams }: PageProps<"/admin">) {
  const [orders, pricing] = await Promise.all([listOrders(), getPricing()]); // both check the admin session first
  const sp = await searchParams;
  const q = one(sp.q).trim().slice(0, 100);
  const show = one(sp.show);
  const cek = one(sp.cek);
  const harga = one(sp.harga);

  const needle = q.toLowerCase();
  const matchesHarga = (o: (typeof orders)[number]) => {
    if (harga === "referral") return o.referral;
    // Referral is a discount on top of the active mode; keep the three options mutually exclusive so
    // "Presale"/"Normal" mean orders that did not also use a referral code.
    if (harga === "presale") return !o.referral && o.presale;
    if (harga === "normal") return !o.referral && !o.presale;
    return true;
  };
  const shown = orders.filter(
    (o) =>
      (!show || o.show === show) &&
      (!(cek in CEK) || o.checked === CEK[cek as keyof typeof CEK]) &&
      matchesHarga(o) &&
      (!needle || [o.code, o.buyer.name, o.buyer.email, o.buyer.phone, o.referralCode ?? "", ...o.seats].some((s) => s.toLowerCase().includes(needle))),
  );
  const filtered = orders.length > 0 && shown.length === 0;

  return (
    <main className="min-h-dvh bg-bg-page bg-paper">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-4 px-4 py-6 md:px-6">
        <Header />
        <PresaleBar pricing={pricing} />
        <Summary orders={orders} />
        <section className="flex flex-col gap-4 rounded-md border-2 border-border-default bg-bg-surface bg-paper p-3 md:p-6" aria-label="Daftar pesanan">
          <Filters q={q} show={show} cek={cek} harga={harga} />
          <p role="status" className="type-caption text-text-secondary">{shown.length} dari {orders.length} pesanan</p>
          {shown.length > 0 ? (
            <OrdersTable orders={shown} />
          ) : (
            <div className="flex flex-col items-center gap-2 rounded-md border-2 border-border-subtle p-6 text-center">
              <p className="type-body-m text-text-primary">{filtered ? "Tidak ada pesanan yang cocok." : "Belum ada pesanan yang dibayar."}</p>
              {filtered && <Link href="/admin" className="type-label inline-flex min-h-11 items-center text-text-brand underline">Reset filter</Link>}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
