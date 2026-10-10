import { INNER } from "@/components/site/decor";
import { Arrow, Burst, Pin, Scribble, Swoosh, Tape } from "@/components/site/hero-art";
import { RevealText } from "@/components/site/reveal-text";
import { EVENT } from "@/lib/event";

const LOGLINE = "Aku, Kau & Musik itu IP karya mahasiswa Stage Performing Arts, Produksi Media UI angkatan 2024, bareng Juzzer, band asal UI. Ini tugas akhir sekaligus penilaian magang kami di Jakarta Movin.";
const NOTE = "Nyatuin harapan, cerita hidup, dan musik jadi satu panggung.";
const PARTNERS = [
  { initial: "S", name: "Stage UI", desc: "Penggagas dan produksi. Peminatan Stage Performing Arts, Produksi Media, Sekolah Vokasi UI.", color: "bg-bg-accent text-text-strong" },
  { initial: "J", name: "Juzzer", desc: "Band asal UI. Lagu-lagunya jadi tulang punggung cerita, dibawakan live.", color: "bg-bg-danger text-text-on-brand" },
  { initial: "M", name: "Jakarta Movin", desc: "Rumah produksi teater musikal yang mensupervisi produksi ini.", color: "bg-bg-brand text-text-on-brand" },
];

const PAPER = "border-2 border-border-default bg-bg-page bg-paper p-5 text-text-strong shadow-sticker lg:p-6";
const STICKER = "border-[3px] border-border-default shadow-sticker";

/** Corkboard "Ini acara apa sih?" section: logline, sinopsis, theme and partners. */
export function Tentang() {
  return (
    <section id="tentang" aria-labelledby="tentang-title" className="relative isolate scroll-mt-20 overflow-hidden bg-cork px-4 py-12 lg:px-20 lg:py-20 lg:shadow-[inset_0_0_0_10px_var(--color-cork-dark)]">
      <div aria-hidden className="bg-grain" />
      <div className={`${INNER} flex flex-col gap-8 lg:gap-10`}>
        <Burst className="-right-3 top-0 hidden size-[70px] rotate-12 md:block lg:right-[8%] lg:-top-4" dur={12} />
        <Burst className="hidden size-[100px] -rotate-12 lg:-left-10 lg:bottom-[34%] lg:block" dur={14} delay={5} />

        <div className="flex flex-col items-start gap-5 lg:grid lg:grid-cols-12 lg:items-center lg:gap-6">
          <RevealText as="h2" id="tentang-title" text="Ini acara apa sih?" className={`${STICKER} type-h2 lg:type-h1 -rotate-2 bg-bg-brand px-4 py-2 text-text-on-brand lg:col-span-6 lg:w-fit`} />
          <p data-reveal="scale" className={`${STICKER} type-h4 rotate-2 bg-bg-accent px-3 py-1 text-text-strong lg:col-span-4 lg:col-start-8 lg:rotate-3`}>TEMA: {EVENT.theme}</p>
        </div>

        <div className="relative">
          <Arrow className="pointer-events-none absolute right-[16%] top-1/2 hidden w-20 rotate-[20deg] lg:block" />
          <div data-reveal-stagger data-reveal="scale" className="grid gap-6 md:grid-cols-2 lg:grid-cols-12 lg:items-start">
            <div className={`relative -rotate-1 lg:col-span-5 lg:-rotate-2 ${PAPER}`}>
              <Pin />
              <p className="type-label mb-2 text-text-brand">LOGLINE</p>
              <p className="type-body-m">{LOGLINE}</p>
            </div>

            <div className={`relative rotate-1 !bg-bg-accent-soft lg:col-span-5 lg:col-start-6 lg:py-10 ${PAPER}`}>
              <Tape />
              <Tape className="!left-auto !-right-4 !rotate-[30deg]" />
              <p className="type-label mb-2 text-text-brand">SINOPSIS</p>
              <p className="type-body-m lg:type-body-l">
                Seorang mahasiswa berjuang merebut beasiswa penuh lewat bakat dan kerja keras, di tengah UKT yang nggak masuk akal. Lewat akting dan live music, kami mau bilang:{" "}
                <mark className="bg-bg-accent px-1 text-text-strong">
                  keterbatasan biaya nggak boleh memadamkan{" "}
                  <span className="relative inline-block">
                    mimpi
                    <Swoosh className="absolute -bottom-2 left-0 h-3 w-full !stroke-bg-danger" />
                  </span>
                  .
                </mark>
              </p>
            </div>

            <div className={`${STICKER} type-h4 relative w-56 rotate-1 bg-bg-accent p-4 pb-12 text-text-strong md:rotate-3 lg:col-span-2 lg:w-auto lg:rotate-4`}>
              <Pin />
              {NOTE}
              <Scribble className="absolute bottom-2 right-3 h-9 w-6 rotate-12" />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <h3 data-reveal="scale" className={`${STICKER} type-h3 -rotate-1 w-fit bg-bg-surface px-4 py-1 text-text-strong`}>Di balik panggung</h3>
          <ul data-reveal="up" className="grid gap-4 md:grid-cols-3 lg:gap-6">
            {PARTNERS.map((p, i) => (
              <li key={p.name} className={`flex min-w-0 gap-3 md:flex-col ${["-rotate-1 lg:-rotate-[1.5deg]", "rotate-1", "-rotate-1"][i]} ${PAPER}`}>
                <span aria-hidden className={`grid size-12 shrink-0 place-items-center rounded-full border-2 border-border-default font-heading text-2xl ${p.color}`}>{p.initial}</span>
                <div className="min-w-0">
                  <h4 className="type-h4">{p.name}</h4>
                  <p className="type-body-s mt-1 text-text-primary">{p.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
