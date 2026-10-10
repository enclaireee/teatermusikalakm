/* Decorative SVG/CSS bits for the hero poster collage. Everything here is aria-hidden. */

const BURST = "M196 100L156 115L183 148L141 141L148 183L115 156L100 196L85 156L52 183L59 141L17 148L44 115L4 100L44 85L17 52L59 59L52 17L85 44L100 4L115 44L148 17L141 59L183 52L156 85Z";

/** Yellow starburst with a hard shadow. Wrapper takes position/size/rotation; the svg floats. */
/** `still` drops the idle float (for sections that must not move on their own). */
export function Burst({ className = "", dur = 12, delay = 0, still = false }: { className?: string; dur?: number; delay?: number; still?: boolean }) {
  return (
    <div aria-hidden className={`pointer-events-none absolute z-[2] animate-pop ${className}`}>
      <svg viewBox="0 0 200 200" strokeWidth={5} strokeLinejoin="round" className={`size-full overflow-visible ${still ? "" : "animate-float"}`} style={still ? undefined : { animationDuration: `${dur}s`, animationDelay: `-${delay}s` }}>
        <path d={BURST} transform="translate(6 6)" className="fill-border-default stroke-border-default" />
        <path d={BURST} className="fill-bg-accent stroke-border-default" />
      </svg>
    </div>
  );
}

/** One hand-drawn "?" glyph. */
export function Scribble({ className = "" }: { className?: string }) {
  const d = "M10 28C8 8 40 2 46 20C51 36 28 42 28 58";
  return (
    <svg aria-hidden viewBox="0 0 60 90" fill="none" strokeLinecap="round" strokeLinejoin="round" className={`overflow-visible ${className}`}>
      <path d={d} strokeWidth={12} className="stroke-border-default" />
      <path d={d} strokeWidth={6} className="stroke-bg-accent" />
      <circle cx={28} cy={76} r={5} strokeWidth={3} className="fill-bg-accent stroke-border-default" />
    </svg>
  );
}

export function Arrow({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 120 80" fill="none" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" className={`overflow-visible stroke-white ${className}`}>
      <path d="M6 66C30 70 70 60 100 22M100 22L82 28M100 22L98 42" />
    </svg>
  );
}

/** Yellow underline swoosh; stretches to its box. */
export function Swoosh({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 240 20" preserveAspectRatio="none" fill="none" strokeWidth={5} strokeLinecap="round" className={`overflow-visible stroke-bg-accent ${className}`}>
      <path d="M4 12C40 4 90 16 140 6S210 10 236 4" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/** Red pushpin; place inside a `relative` parent. */
export function Pin() {
  return (
    <span aria-hidden className="absolute -top-3 left-1/2 z-10 size-5 -translate-x-1/2 rounded-full border-2 border-border-default bg-bg-danger">
      <span className="absolute left-0.5 top-0.5 size-1.5 rounded-full bg-white" />
    </span>
  );
}

/** Translucent masking tape; place inside a `relative` parent. */
export function Tape({ className = "" }: { className?: string }) {
  return <span aria-hidden className={`absolute -top-3 -left-4 z-10 h-6 w-16 -rotate-[30deg] border-x border-black/10 bg-bg-accent/70 ${className}`} />;
}
