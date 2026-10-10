import { EVENT } from "@/lib/event";
import { RevealText } from "@/components/site/reveal-text";

const BULBS = Array.from({ length: 24 }, (_, i) => i);
const DELAYS = ["[animation-delay:0ms]", "[animation-delay:600ms]", "[animation-delay:1200ms]", "[animation-delay:1800ms]"];

function Bulbs({ className }: { className: string }) {
  return (
    <div aria-hidden className={`absolute inset-x-4 flex justify-between lg:inset-x-[22px] ${className}`}>
      {BULBS.map((i) => (
        <span key={i} className={`animate-twinkle ${DELAYS[i % 4]} size-[9px] rounded-full border border-border-default bg-bg-accent max-lg:nth-[n+12]:hidden lg:size-3`} />
      ))}
    </div>
  );
}

/** White marquee board with red border and yellow bulbs (Figma `marquee()`). */
export function Marquee() {
  return (
    <div data-reveal="scale" className="relative w-full max-w-[880px] overflow-hidden rounded-xl border-8 border-border-danger bg-bg-surface bg-paper px-5 py-9 text-center shadow-sticker-l lg:border-12 lg:px-16 lg:py-14">
      <Bulbs className="top-3 lg:top-[18px]" />
      <Bulbs className="bottom-[14px] lg:bottom-[18px]" />
      <div className="relative flex flex-col items-center gap-1 lg:gap-2">
        <RevealText as="p" text="TEATER MUSIKAL" className="type-h3 text-text-primary" delay={200} />
        {/* Hand-rolled RevealText markup so the mobile-only line break and nowrap "& MUSIK" are kept. */}
        <h1 data-reveal="text" aria-label="AKU KAU & MUSIK" style={{ "--d": "350ms" } as React.CSSProperties} className="type-h1 sm:type-display-l lg:type-display-xl max-w-full text-text-danger">
          <span aria-hidden className="rt-word"><span className="rt-inner" style={{ "--wi": 0 } as React.CSSProperties}>AKU</span></span>{" "}
          <span aria-hidden className="rt-word"><span className="rt-inner" style={{ "--wi": 1 } as React.CSSProperties}>KAU</span></span>
          <br className="lg:hidden" />{" "}
          <span aria-hidden className="rt-word whitespace-nowrap"><span className="rt-inner" style={{ "--wi": 2 } as React.CSSProperties}>&amp; MUSIK</span></span>
        </h1>
        <RevealText as="p" text={EVENT.theme} className="type-h3 lg:type-h2 text-text-brand" delay={650} />
      </div>
    </div>
  );
}
