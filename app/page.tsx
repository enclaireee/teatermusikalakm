import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { Button } from "@/components/ui/button";
import { Icon, type IconName } from "@/components/ui/icon";
import { Drapes, INNER, SECTION, Star, Valance } from "@/components/site/decor";
import { Marquee } from "@/components/site/marquee";
import { ShowCard } from "@/components/site/show-card";
import { TierCard } from "@/components/site/tier-card";
import { EVENT, MAX_TICKETS, SHOWS, TIERS, type Tier } from "@/lib/event";

const CHIPS: [IconName, string][] = [
  ["calendar", EVENT.date],
  ["map-pin", EVENT.venue],
  ["clock", `2 show · ${SHOWS["1"].start} & ${SHOWS["2"].start} WIB`],
];

export default function Home() {
  return (
    <>
      <Navbar current="/" />
      <main>
        <section className="relative overflow-hidden bg-bg-brand px-4 pb-10 pt-26 lg:px-20 lg:pb-16 lg:pt-42">
          <Valance />
          <Drapes />
          <Star className="right-8 top-24 size-16 [animation-duration:11s] lg:right-[160px] lg:top-[260px] lg:size-[120px]" />
          <Star className="hidden size-20 [animation-delay:-4s] [animation-duration:13s] lg:left-[150px] lg:top-[520px] lg:block" />
          <div className="relative z-10 mx-auto flex max-w-[1280px] flex-col items-center gap-6 px-3 lg:gap-8 lg:px-0">
            <p className="type-label animate-enter text-center text-text-accent">{EVENT.presentedBy}</p>
            <Marquee />
            <ul className="flex animate-enter flex-col items-center gap-3 [animation-delay:240ms] lg:flex-row">
              {CHIPS.map(([icon, label]) => (
                <li key={label} className="type-label flex items-center gap-2 rounded-full border-2 border-border-default bg-bg-surface px-4 py-2 text-text-strong">
                  <Icon name={icon} size={20} className="shrink-0 text-text-brand" />
                  {label}
                </li>
              ))}
            </ul>
            <div className="flex w-full animate-enter flex-col gap-4 [animation-delay:340ms] lg:w-auto lg:flex-row">
              <Button variant="accent" icon="arrow-right" href="#jadwal" fullWidth>Pilih Jadwal Show</Button>
              <Button variant="secondary" href="/about" fullWidth>Tentang Pertunjukan</Button>
            </div>
          </div>
        </section>

        <section id="jadwal" className={`${SECTION} scroll-mt-20 overflow-hidden`}>
          <div className={`${INNER} flex flex-col items-center gap-6 lg:gap-10`}>
            <div className="flex flex-col items-center gap-2 text-center">
              <h2 className="reveal type-h2 lg:type-h1 text-text-brand">Pilih jadwal nontonmu</h2>
              <p className="reveal type-body-l text-text-secondary [animation-range:entry_10%_cover_35%]">Pilih show, isi data, pilih kursi, bayar. Maks. {MAX_TICKETS} tiket per transaksi.</p>
            </div>
            <div className="grid w-full grid-cols-1 gap-4 lg:max-w-[892px] lg:grid-cols-2 lg:gap-8">
              <ShowCard id="1" />
              <ShowCard id="2" />
            </div>
            <div className="flex w-full flex-col items-center gap-4">
              <h2 className="reveal type-h3 lg:type-h2 text-center text-text-strong">Kategori &amp; harga tiket</h2>
              <ul className="grid w-full grid-cols-2 gap-4 lg:flex lg:flex-wrap lg:justify-center lg:gap-6">
                {(Object.keys(TIERS) as Tier[]).map((t, i) => (
                  <li key={t} className={`reveal ${i % 2 ? "[animation-range:entry_10%_cover_35%]" : ""} flex min-w-0 [&>div]:w-full lg:[&>div]:w-70`}><TierCard tier={t} /></li>
                ))}
              </ul>
              <p className="type-caption text-center text-text-secondary">Harga masih placeholder. Kursi VIP (baris E–F tengah) khusus tamu undangan dengan kode.</p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
