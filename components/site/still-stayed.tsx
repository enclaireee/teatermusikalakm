import { Arrow, Burst, Scribble, Swoosh, Tape } from "@/components/site/hero-art";
import { INNER } from "@/components/site/decor";

const DONE = ["tidur cukup", "saldo aman sampai akhir bulan", "kelas jadi (udah nyampe kampus)", "UKT masuk akal", "deadline santai", "nongkrong tiap weekend"];
const CLIP = "[clip-path:polygon(0%_2.5%,4%_0%,9%_2%,15%_0.5%,22%_2.5%,30%_0%,38%_2%,47%_0.5%,55%_2.5%,63%_0%,71%_2%,80%_0.5%,88%_2.5%,95%_0%,100%_2%,100%_100%,0%_100%)]";

/** Static dark "zine page": a ticked-off notebook list and the big statement. No motion beyond reveal + marker draw. */
export function StillStayed() {
  return (
    <section className="relative isolate overflow-hidden bg-bg-inverse px-4 py-16 lg:px-20 lg:py-24">
      <div aria-hidden className="bg-graph absolute inset-0 -z-10 opacity-30" />
      <div aria-hidden className="bg-grain" />
      <div className={`${INNER} flex flex-col gap-12 lg:flex-row lg:items-center lg:gap-16`}>
        {/* notebook */}
        <div data-reveal="up" className="relative -rotate-1 lg:w-[440px] lg:shrink-0 lg:-rotate-2">
          <div className="[filter:drop-shadow(6px_6px_0_#404040)]">
            <div className={`relative bg-bg-page bg-paper pb-8 pl-16 pr-4 pt-10 text-text-strong ${CLIP}`}>
              <div aria-hidden className="absolute inset-0 [background:repeating-linear-gradient(transparent_0_31px,rgb(70_110_200/0.35)_31px_32px)] [background-position:0_8px]" />
              <div aria-hidden className="absolute inset-y-0 left-12 w-0.5 bg-bg-danger/70" />
              {[18, 50, 82].map((t) => <span key={t} aria-hidden className="absolute left-3 size-4 rounded-full bg-bg-inverse" style={{ top: `${t}%` }} />)}
              <p className="relative font-heading text-[28px] leading-8">Things that college life did:</p>
              <ul className="relative mt-2">
                {DONE.map((t, i) => (
                  <li key={t} className="flex items-start gap-3 font-heading text-[22px] leading-8">
                    <span aria-hidden className="mt-1.5 size-5 shrink-0 -rotate-3 rounded-sm border-2 border-border-default" />
                    <s className="relative no-underline">
                      <span className="sr-only">(dicoret) </span>
                      {t}
                      <svg aria-hidden viewBox="0 0 120 24" preserveAspectRatio="none" fill="none" strokeWidth={3} strokeLinecap="round" className="mk pointer-events-none absolute inset-0 h-full w-full overflow-visible stroke-bg-danger" style={{ "--d": `${300 + i * 250}ms` } as React.CSSProperties}>
                        <path pathLength={1} vectorEffect="non-scaling-stroke" d="M2 14C20 4 40 24 60 12S100 6 118 16" />
                      </svg>
                    </s>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <Tape className="!-left-3 !top-0" />
        </div>

        <Arrow className="pointer-events-none absolute left-[420px] top-[30%] hidden w-24 xl:block" />

        {/* statement */}
        <div className="relative min-w-0 lg:flex-1">
          <Burst className="right-0 -top-8 size-16 rotate-12 lg:-top-16 lg:size-24" still />
          <h2 data-reveal="up" className="type-h1 sm:type-display-l xl:type-display-xl text-text-accent">
            {/* {" "} keeps real spaces between the stacked lines so the heading reads "but i still stayed." */}
            <span className="block -rotate-2">but i</span>{" "}
            <span className="block rotate-1">still</span>{" "}
            <span className="block -rotate-1">
              <span className="relative inline-block">
                stayed.
                <Swoosh className="absolute -bottom-3 left-0 h-4 w-full" />
              </span>
            </span>
          </h2>
          <p className="type-body-l mt-8 text-text-on-brand">…dan dari situ cerita ini lahir.</p>
          <div aria-hidden className="absolute bottom-0 right-2 flex gap-1 rotate-6">
            <Scribble className="h-12 w-8" />
            <Scribble className="mt-3 h-12 w-8 rotate-12" />
          </div>
        </div>
      </div>
    </section>
  );
}
