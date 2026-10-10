import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Drapes, Valance } from "@/components/site/decor";
import { Arrow, Burst, Pin, Scribble, Swoosh, Tape } from "@/components/site/hero-art";
import { EVENT, SHOWS } from "@/lib/event";

const d = (ms: number) => ({ "--d": `${ms}ms` }) as React.CSSProperties;
const STICKER = "border-[3px] border-border-default shadow-sticker rounded-sm type-h4 px-3 py-1 hover:animate-wiggle focus-within:animate-wiggle";

/** Home hero: textured "rebel poster" collage on green graph paper. */
export function Hero() {
  return (
    <section className="relative isolate min-h-[640px] overflow-hidden bg-bg-brand pb-12 pt-26 md:min-h-[720px] lg:pb-20 lg:pt-36 lg:min-h-0">
      <div aria-hidden className="bg-crumple absolute inset-0 z-0" />
      <div aria-hidden className="bg-graph absolute inset-0 z-0" />
      <div aria-hidden className="bg-halftone absolute inset-0 z-0" />
      <div aria-hidden className="absolute inset-0 z-0 bg-[image:radial-gradient(ellipse_at_30%_40%,transparent_40%,rgb(0_60_28/0.55))]" />
      <div aria-hidden className="bg-grain" />
      <Valance />
      <Drapes />

      <div className="relative mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-20">
        {/* decor (z-2) */}
        <Burst className="-right-5 top-2 size-[90px] rotate-12 md:right-0 md:top-6 md:size-[120px] lg:left-[400px] lg:right-auto lg:top-4 lg:size-[180px] xl:left-[490px]" dur={11} />
        <Burst className="-left-5 bottom-0 size-[70px] -rotate-[15deg] lg:-left-6 lg:bottom-24 lg:size-[110px]" dur={13} delay={4} />
        <Burst className="hidden size-[60px] rotate-6 xl:right-0 xl:top-[58%] xl:block" dur={14} delay={7} />
        <div aria-hidden className="pointer-events-none absolute right-3 top-[230px] z-[2] flex gap-1 rotate-[-12deg] md:left-auto md:right-8 md:top-0 md:rotate-[10deg] lg:right-[130px] lg:top-6 xl:right-[150px]">
          <Scribble className="h-12 w-8 md:h-16 md:w-11" />
          <Scribble className="mt-3 h-12 w-8 rotate-12 md:h-16 md:w-11" />
        </div>

        {/* content (z-3): mobile = one column, md = 12-col grid, lg+ = two flex columns */}
        <div className="hero-cta relative z-[3] flex flex-col items-center gap-5 md:grid md:grid-cols-12 md:items-start md:gap-x-4 md:gap-y-6 lg:flex lg:flex-row lg:gap-10">
          <h1 className="sr-only">Aku, Kau &amp; Musik — Teater Musikal</h1>

          {/* LEFT column */}
          <div className="max-lg:contents lg:relative lg:flex lg:min-w-0 lg:flex-1 lg:flex-col lg:gap-6">

            <div className="contents md:relative md:col-span-7 md:row-start-1 md:block md:w-fit">
              <Image src="/logo-akm.webp" alt="" aria-hidden width={700} height={516} priority className="h-auto w-[260px] max-w-full -rotate-6 animate-stamp [filter:drop-shadow(6px_6px_0_#404040)] sm:w-[300px] md:w-[380px] md:max-w-none md:shrink-0 lg:w-[440px]" />
              <p data-reveal="scale" style={d(0)} className={`${STICKER} -rotate-3 bg-bg-accent text-text-strong md:absolute md:-bottom-3 md:-right-4 md:-rotate-[4deg]`}>TEATER MUSIKAL</p>
            </div>

            <div data-reveal="scale" style={d(300)} className="relative w-full rotate-2 md:col-span-12 md:row-start-2 md:w-full md:rotate-[1.5deg] lg:-mt-2 lg:-rotate-2">
              <div className="[filter:drop-shadow(5px_5px_0_#404040)]">
                <p className="type-h3 lg:type-h2 bg-bg-surface bg-paper px-6 py-4 text-center text-text-strong [clip-path:polygon(0%_8%,4%_0%,9%_7%,15%_1%,22%_8%,30%_0%,38%_6%,47%_1%,55%_8%,63%_0%,71%_7%,80%_1%,88%_8%,95%_0%,100%_6%,100%_92%,95%_100%,88%_93%,80%_100%,71%_92%,63%_100%,55%_94%,47%_100%,38%_93%,30%_100%,22%_92%,15%_100%,9%_93%,4%_100%,0%_94%)] md:text-left">
                  {EVENT.theme.replace(/ Musik$/, " ")}
                  <span className="relative inline-block">
                    Musik
                    <Swoosh className="absolute -bottom-1 left-0 h-3 w-full" />
                  </span>
                </p>
              </div>
              <Tape />
            </div>

            <div className="flex w-full flex-col gap-4 max-md:order-last md:col-span-6 md:col-start-7 md:row-start-3 md:self-center lg:flex-row">
              <div className="w-full lg:w-auto lg:-rotate-1"><Button variant="accent" icon="arrow-right" href="#jadwal" fullWidth>Pilih Jadwal Show</Button></div>
              <div className="w-full rotate-1 lg:w-auto"><Button variant="secondary" href="#tentang" fullWidth>Tentang Pertunjukan</Button></div>
            </div>
          </div>

          {/* RIGHT column */}
          <div className="max-lg:contents lg:relative lg:mt-24 lg:flex lg:w-[300px] lg:shrink-0 lg:flex-col lg:gap-6 xl:w-[340px]">
            <p aria-hidden data-reveal="scale" style={d(150)} className={`${STICKER} hidden rotate-3 bg-bg-surface text-text-strong md:col-span-5 md:col-start-8 md:row-start-1 md:block md:w-fit md:self-center lg:rotate-[4deg] lg:self-start`}>{EVENT.date}</p>

            <div data-reveal="scale" style={d(450)} className="relative w-[280px] max-w-[calc(100%-2rem)] rotate-2 border-[3px] border-border-default bg-bg-accent-soft bg-paper p-4 shadow-sticker-l md:col-span-6 md:row-start-3 md:w-full md:max-w-none lg:rotate-3">
              <Pin />
              <h2 className="type-h4 text-text-strong">Info show</h2>
              <ul className="type-body-s mt-2 flex flex-col gap-1 text-text-strong">
                <li>{EVENT.date}</li>
                <li>{EVENT.venue}</li>
                <li>{`${SHOWS["1"].label} · ${SHOWS["1"].time} WIB`}</li>
                <li>{`${SHOWS["2"].label} · ${SHOWS["2"].time} WIB`}</li>
              </ul>
            </div>

            <p aria-hidden className={`${STICKER} hidden -rotate-3 bg-bg-danger text-text-on-brand lg:-mt-2 lg:block lg:w-fit lg:self-end`}>{EVENT.venue}</p>

            <div aria-hidden className="pointer-events-none hidden md:absolute md:left-[50%] md:top-[40%] md:block md:w-20 lg:hidden xl:absolute xl:-left-52 xl:top-24 xl:block xl:w-48">
              <span className="type-h4 hidden -rotate-[5deg] whitespace-nowrap text-right text-white xl:block">gas ngeng merapat!</span>
              <Arrow className="w-20 xl:ml-auto xl:w-28" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
