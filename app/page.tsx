import type { Metadata } from "next";
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
import { EVENT, MAX_TICKETS, SALE_TIERS, SHOWS, SITE_URL, type ShowId } from "@/lib/event";
import { getAvailability } from "@/lib/availability";

const DESCRIPTION = `Beli tiket ${EVENT.fullName} — ${EVENT.date} di ${EVENT.venueShort}. ${EVENT.presentedBy}.`;

// "15.00 – 17.00" -> "2026-10-29T15:00:00+07:00" (WIB)
const iso = (t: string) => `2026-10-29T${t.trim().replace(".", ":")}:00+07:00`;

const JSON_LD = (Object.keys(SHOWS) as ShowId[]).map((id) => {
  const [start, end] = SHOWS[id].time.split("–");
  return {
    "@context": "https://schema.org",
    "@type": "TheaterEvent",
    name: `${EVENT.fullName} — ${SHOWS[id].label}`,
    description: DESCRIPTION,
    startDate: iso(start),
    endDate: iso(end),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    inLanguage: "id",
    image: `${SITE_URL}/opengraph-image.png`,
    location: {
      "@type": "Place",
      name: "Makara Art Center Universitas Indonesia",
      address: { "@type": "PostalAddress", addressLocality: "Depok", addressRegion: "Jawa Barat", addressCountry: "ID" },
    },
    organizer: { "@type": "Organization", name: "Stage UI", url: SITE_URL },
    performer: { "@type": "MusicGroup", name: "Juzzer" },
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/pesan/${id}/pilih-tiket`,
      priceCurrency: "IDR",
      availability: "https://schema.org/InStock",
    },
  };
});

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
      {a?.presale.active && <p className="type-caption text-center text-text-secondary">Harga presale.</p>}
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

// Canonical lives here, not in the root layout, so other routes don't inherit "/" as their canonical.
export const metadata: Metadata = { alternates: { canonical: "/" } };

export default function Home() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD).replace(/</g, "\\u003c") }} />
      <Navbar current="/" />
      <main>
        <Hero />
        <Tentang />
        <StillStayed />

        <section id="jadwal" className={`${SECTION} scroll-mt-20 overflow-hidden`}>
          <div className={`${INNER} flex flex-col items-center gap-6 lg:gap-10`}>
            <div className="flex flex-col items-center gap-2 text-center">
              <RevealText as="h2" text="Pilih Jadwal Nontonmu" className="type-h2 lg:type-h1 text-text-brand" />
              <p data-reveal="up" style={{ "--d": "150ms" } as React.CSSProperties} className="type-body-l text-text-secondary">Pilih show, isi data, pilih kursi, bayar. Maks. {MAX_TICKETS} tiket per transaksi.</p>
            </div>
            <div data-reveal-stagger data-reveal="scale" className="grid w-full grid-cols-1 gap-4 lg:max-w-[1120px] lg:grid-cols-2 lg:gap-8">
              <ShowCard id="1" />
              <ShowCard id="2" />
            </div>
            <div className="flex w-full flex-col items-center gap-4">
              <RevealText as="h2" text="Kategori & Harga Tiket" className="type-h3 lg:type-h2 text-center text-text-strong" />
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
