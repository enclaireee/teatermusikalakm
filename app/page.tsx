import { Suspense } from "react";
import { connection } from "next/server";
import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { INNER, SECTION } from "@/components/site/decor";
import { Hero } from "@/components/site/hero";
import { Tentang } from "@/components/site/tentang";
import { StillStayed } from "@/components/site/still-stayed";
import { ShowCard } from "@/components/site/show-card";
import { TierCard } from "@/components/site/tier-card";
import { RevealText } from "@/components/site/reveal-text";
import { MAX_TICKETS, SALE_TIERS } from "@/lib/event";
import { getAvailability } from "@/lib/availability";

const fmtUntil = (iso: string) => new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", day: "numeric", month: "long", year: "numeric" }).format(new Date(iso));

async function TierCards() {
  await connection(); // request-time only, never baked into the static shell
  let a: Awaited<ReturnType<typeof getAvailability>> | undefined;
  try {
    a = await getAvailability("1");
  } catch {
    // DB unreachable: show "—"
  }
  return (
    <>
      <TierList a={a} />
      {a?.presale.active && a.presale.until && <p className="type-caption text-center text-text-secondary">Harga presale sampai {fmtUntil(a.presale.until)}.</p>}
    </>
  );
}

function TierList({ a }: { a?: Awaited<ReturnType<typeof getAvailability>> }) {
  return (
    <ul data-reveal-stagger data-reveal="scale" className="grid w-full grid-cols-2 gap-4 lg:flex lg:flex-wrap lg:justify-center lg:gap-6">
      {SALE_TIERS.map((t) => {
        const x = a?.tiers.find((i) => i.tier === t);
        return (
          <li key={t} className="flex min-w-0 [&>div]:w-full lg:[&>div]:w-64">
            <TierCard tier={t} presale={a?.presale.active} info={a && { name: x?.name ?? t, price: x?.price ?? null, priceNormal: x?.priceNormal ?? null }} />
          </li>
        );
      })}
    </ul>
  );
}

export default function Home() {
  return (
    <>
      <Navbar current="/" />
      <main>
        <Hero />
        <Tentang />
        <StillStayed />

        <section id="jadwal" className={`${SECTION} scroll-mt-20 overflow-hidden`}>
          <div className={`${INNER} flex flex-col items-center gap-6 lg:gap-10`}>
            <div className="flex flex-col items-center gap-2 text-center">
              <RevealText as="h2" text="Pilih jadwal nontonmu" className="type-h2 lg:type-h1 text-text-brand" />
              <p data-reveal="up" style={{ "--d": "150ms" } as React.CSSProperties} className="type-body-l text-text-secondary">Pilih show, isi data, pilih kursi, bayar. Maks. {MAX_TICKETS} tiket per transaksi.</p>
            </div>
            <div data-reveal-stagger data-reveal="scale" className="grid w-full grid-cols-1 gap-4 lg:max-w-[1120px] lg:grid-cols-2 lg:gap-8">
              <ShowCard id="1" />
              <ShowCard id="2" />
            </div>
            <div className="flex w-full flex-col items-center gap-4">
              <RevealText as="h2" text="Kategori & harga tiket" className="type-h3 lg:type-h2 text-center text-text-strong" />
              <Suspense fallback={<TierList />}>
                <TierCards />
              </Suspense>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
