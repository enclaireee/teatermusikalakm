import type { Metadata } from "next";
import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { Button } from "@/components/ui/button";
import { Icon, type IconName } from "@/components/ui/icon";
import { INNER, SECTION, Star, Valance } from "@/components/site/decor";
import { Polaroid } from "@/components/site/polaroid";
import { EVENT } from "@/lib/event";

export const metadata: Metadata = {
  title: "About Us",
  description: "Kenalan dengan pertunjukan, tim, dan cerita di balik Teater Musikal Aku, Kau & Musik.",
};

const MISI = [
  "Jadi wadah solusi lewat pementasan yang menjawab keresahan soal UKT.",
  "Menyuarakan harapan lewat kisah perjuangan meraih beasiswa.",
  "Mengajak publik dan mitra mendukung pendidikan generasi muda.",
];
const ENSEMBLE = ["Nallegra Linggar", "Kinara Syahla Naura", "Chella Ernawati", "M. Putra Januar", "Rifano Chandra Kurniawan", "Nathaniel Hans Gunawan"];
const PARTNERS: [string, string, IconName][] = [
  ["Stage UI", "Peminatan Stage Performing Arts, Produksi Media, Sekolah Vokasi UI. Penggagas dan produksi pertunjukan.", "ticket"],
  ["Juzzer", "Band asal UI. Lagu-lagunya jadi tulang punggung cerita, dibawakan live di panggung.", "music"],
  ["Jakarta Movin", "Rumah produksi teater musikal (Musikal Petualangan Sherina) yang mensupervisi produksi ini.", "users"],
];

const CARD = "reveal rounded-lg border-2 border-border-default p-6 shadow-sticker transition-[translate,box-shadow] duration-(--duration-base) ease-(--ease-out-soft) hover:-translate-y-0.5 hover:shadow-sticker-l lg:p-8";

export default function AboutPage() {
  return (
    <>
      <Navbar current="/about" />
      <main>
        <section className="relative overflow-hidden bg-bg-brand px-4 pb-12 pt-22 lg:px-20 lg:pb-20 lg:pt-35">
          <Valance tall />
          <div className={`${INNER} flex flex-col gap-3`}>
            <h1 className="animate-enter type-h1 lg:type-display-l text-text-accent">About Us</h1>
            <p className="animate-enter type-body-l text-text-on-brand [animation-delay:120ms]">Kenalan dulu sama pertunjukan, tim, dan cerita di balik Aku, Kau &amp; Musik.</p>
          </div>
        </section>

        <section className={SECTION}>
          <div className={`${INNER} flex flex-col items-center gap-8 lg:flex-row lg:gap-16`}>
            <div className="reveal flex min-w-0 flex-1 flex-col gap-4">
              <h2 className="type-h2 lg:type-h1 text-text-brand">Apa itu Aku, Kau &amp; Musik?</h2>
              <p className="type-body-l">Aku, Kau &amp; Musik adalah IP karya mahasiswa peminatan Stage Performing Arts, Produksi Media UI angkatan 2024, berkolaborasi dengan Juzzer, band asal UI. Proyek ini jadi tugas akhir sekaligus penilaian magang di Jakarta Movin.</p>
              <p className="type-body-l">Ceritanya tentang perjuangan mahasiswa meraih beasiswa penuh lewat bakat dan kerja keras, di tengah beratnya beban UKT. Lewat akting dan live music, kami mau bilang: keterbatasan biaya nggak boleh memadamkan mimpi.</p>
            </div>
            <div className="flex items-center justify-center -space-x-4 py-3 lg:-space-x-6">
              <Polaroid caption="Latihan perdana" rotate={-4} className="w-36 sm:w-44 lg:w-66" />
              <Polaroid caption="Live with Juzzer" rotate={3} className="w-36 sm:w-44 lg:w-66" />
            </div>
          </div>
        </section>

        <section className="flex justify-center overflow-hidden px-4 py-8 lg:px-20 lg:py-12">
          <div className="relative w-full max-w-[760px] -rotate-[1.5deg] border-2 border-border-default bg-bg-accent-soft bg-paper reveal p-6 shadow-sticker-l lg:p-10">
            <span aria-hidden className="absolute -top-2.5 left-1/2 h-[22px] w-24 -translate-x-1/2 bg-border-subtle/85" />
            <div className="flex flex-col gap-3">
              <p className="type-label text-text-danger">TEMA UTAMA</p>
              <h2 className="type-h2 lg:type-h1 text-text-brand">{EVENT.theme}</h2>
              <p className="type-body-l">Nyatuin harapan, cerita hidup, dan alunan musik jadi satu pementasan utuh, sebuah ruang bebas buat seniman dan penonton untuk saling connect dan berekspresi.</p>
            </div>
          </div>
        </section>

        <section className={SECTION}>
          <div className={`${INNER} grid gap-6 lg:grid-cols-2`}>
            <div className={`${CARD} flex flex-col gap-3 bg-bg-brand`}>
              <h2 className="type-h2 text-text-accent">Visi</h2>
              <p className="type-body-l text-text-on-brand">Menjadikan teater musikal seni yang terbuka dan dekat dengan anak muda, sekaligus menyuarakan realita perjuangan mahasiswa yang terhalang biaya pendidikan.</p>
            </div>
            <div className={`${CARD} flex flex-col gap-3 bg-bg-surface bg-paper`}>
              <h2 className="type-h2 text-text-brand">Misi</h2>
              <ol className="flex flex-col gap-3">
                {MISI.map((m, i) => (
                  <li key={m} className="flex gap-3">
                    <span className="type-label flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-border-default bg-bg-accent text-text-strong">{i + 1}</span>
                    <span className="type-body-m min-w-0">{m}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section className={`${SECTION} overflow-hidden bg-bg-inverse`}>
          <Star className="right-4 top-6 size-14 lg:right-[104px] lg:top-[60px] lg:size-24" />
          <div className={`${INNER} flex flex-col items-center gap-6 lg:gap-10`}>
            <h2 className="reveal type-h1 lg:type-display-l text-center text-text-accent">Meet Our Cast!</h2>
            <div className="flex flex-col items-center gap-6 lg:flex-row lg:gap-12">
              <Polaroid tall caption="Albian Athaya Putra as Athar" rotate={-3} className="w-60 lg:w-72" />
              <Polaroid tall caption="Yokhebed Chelsee Radeyla as Dinda" rotate={3} className="w-60 lg:w-72" />
            </div>
            <h3 className="reveal type-h3 text-text-accent">ENSEMBLE</h3>
            <ul className="reveal flex flex-wrap justify-center gap-3 [animation-range:entry_10%_cover_35%]">
              {ENSEMBLE.map((n) => (
                <li key={n} className="type-label rounded-full border-2 border-border-default bg-bg-surface px-4 py-2 text-text-strong">{n}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className={SECTION}>
          <div className={`${INNER} flex flex-col gap-6 lg:gap-10`}>
            <h2 className="reveal type-h2 lg:type-h1 text-text-brand">Di balik panggung</h2>
            <ul className="grid gap-6 lg:grid-cols-3">
              {PARTNERS.map(([t, d, icon]) => (
                <li key={t} className={`${CARD} flex min-w-0 flex-col gap-3 bg-bg-surface bg-paper`}>
                  <span className="flex size-12 items-center justify-center rounded-md border-2 border-border-default bg-bg-accent text-text-strong"><Icon name={icon} size={24} /></span>
                  <h3 className="type-h3 text-text-strong">{t}</h3>
                  <p className="type-body-m text-text-secondary">{d}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="bg-bg-accent px-4 py-12 lg:px-20 lg:py-20">
          <div className="mx-auto flex max-w-[1280px] flex-col items-center gap-6 text-center lg:gap-8">
            <h2 className="type-h1 lg:type-display-l text-text-brand">Udah siap nonton?</h2>
            <p className="type-body-l">{EVENT.date} · {EVENT.venueShort} · 2 show</p>
            <div className="w-full lg:w-auto"><Button icon="arrow-right" href="/#jadwal" fullWidth>Pilih Jadwal Show</Button></div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
