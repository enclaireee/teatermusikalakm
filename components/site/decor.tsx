import { useId } from "react";
import Image from "next/image";
import "./drapes.css";

export const SECTION = "relative px-4 py-12 lg:px-20 lg:py-24";
export const INNER = "relative z-10 mx-auto w-full max-w-[1280px]";

/** Yellow decorative star (decorative, alt=""). Position/size via className. */
export function Star({ className = "" }: { className?: string }) {
  return <Image src="/decorative-star.webp" alt="" width={240} height={240} aria-hidden className={`pointer-events-none absolute select-none animate-float ${className}`} />;
}

/** One row of catenary swags (tile px wide, d px deep) filled with the pleat look. */
function Swags({ tile, d, className }: { tile: number; d: number; className: string }) {
  const uid = useId().replace(/\W/g, "");
  const pat = `swag-${uid}-${tile}`;
  const grad = `swag-g-${uid}-${tile}`;
  const h = d + 8;
  const edge = `M0 0 Q ${tile / 2} ${2 * d} ${tile} 0`;
  const fringe = `M0 3 Q ${tile / 2} ${2 * d + 3} ${tile} 3`;
  const folds = [0.25, 0.5, 0.75].map((f) => {
    const x = f * tile;
    const y = 4 * d * f * (1 - f) * 0.8;
    return `M${x} 0 Q${x + (f - 0.5) * 8} ${y * 0.5} ${x} ${y}`;
  });
  return (
    <svg aria-hidden width="100%" height={h} className={`valance-swag ${className}`}>
      <defs>
        <linearGradient id={grad} gradientUnits="userSpaceOnUse" x1="0" x2={tile / 6} spreadMethod="repeat">
          <stop offset="0" className="valance-stop-a" />
          <stop offset="0.3" className="valance-stop-b" />
          <stop offset="0.5" className="valance-stop-c" />
          <stop offset="0.72" className="valance-stop-b" />
          <stop offset="1" className="valance-stop-a" />
        </linearGradient>
        <pattern id={pat} width={tile} height={h} patternUnits="userSpaceOnUse">
          <path d={`${edge}Z`} fill={`url(#${grad})`} className="stroke-border-default" strokeWidth={2} />
          {folds.map((f) => (
            <path key={f} d={f} fill="none" className="stroke-bg-danger-strong" strokeOpacity={0.5} strokeWidth={1.5} />
          ))}
          <path d={fringe} fill="none" className="stroke-bg-accent" strokeWidth={2} strokeDasharray="3 6" />
        </pattern>
      </defs>
      <rect width="100%" height={h} fill={`url(#${pat})`} />
    </svg>
  );
}

/** Pleated red valance (trim, band, swags) across the top of a `relative overflow-hidden` parent. */
export function Valance({ tall = false }: { tall?: boolean }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-[5] animate-slide-down">
      <div className="valance-trim" />
      <div className="drape-fabric valance-band" />
      <Swags tile={78} d={tall ? 24 : 30} className="block lg:hidden" />
      <Swags tile={120} d={tall ? 44 : 56} className="hidden lg:block" />
    </div>
  );
}

/** Red side drapes with tie-backs for the hero. */
export function Drapes() {
  const cls = "drape pointer-events-none absolute inset-y-0 z-[6] w-3 md:w-5 lg:w-12 xl:w-16";
  const side = (pos: string, flip: string) => (
    <div aria-hidden className={`${cls} ${pos}`}>
      <div className={`absolute inset-0 ${flip}`}>
        <div className="drape-fabric drape-cloth" />
        <div className="drape-tie" />
      </div>
    </div>
  );
  return (
    <>
      {side("left-0", "")}
      {side("right-0", "scale-x-[-1]")}
    </>
  );
}
