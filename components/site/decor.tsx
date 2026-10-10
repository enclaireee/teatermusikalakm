import Image from "next/image";

export const SECTION = "relative px-4 py-12 lg:px-20 lg:py-24";
export const INNER = "relative z-10 mx-auto w-full max-w-[1280px]";

/** Yellow decorative star (decorative, alt=""). Position/size via className. */
export function Star({ className = "" }: { className?: string }) {
  return <Image src="/decorative-star.webp" alt="" width={240} height={240} aria-hidden className={`pointer-events-none absolute select-none animate-float ${className}`} />;
}

function Scallops({ tile, h, className }: { tile: number; h: number; className: string }) {
  const r = Math.min(h * 0.45, tile / 2);
  const id = `scallop-${tile}-${h}`;
  return (
    <svg aria-hidden width="100%" height={h} className={`fill-bg-danger stroke-border-default ${className}`} strokeWidth={3}>
      <defs>
        <pattern id={id} width={tile} height={h} patternUnits="userSpaceOnUse">
          <path d={`M0 0H${tile}V${h - r}A${tile / 2} ${r} 0 0 1 0 ${h - r}Z`} />
        </pattern>
      </defs>
      <rect width="100%" height={h} fill={`url(#${id})`} stroke="none" />
    </svg>
  );
}

/** Red scalloped curtain valance across the top of a `relative overflow-hidden` parent. */
export function Valance({ tall = false }: { tall?: boolean }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-[5] animate-slide-down">
      <Scallops tile={78} h={tall ? 56 : 64} className="lg:hidden" />
      <Scallops tile={120} h={tall ? 96 : 120} className="hidden lg:block" />
    </div>
  );
}

/** Red side drapes for the hero. */
export function Drapes() {
  const cls = "pointer-events-none absolute inset-y-0 z-[6] hidden sm:block w-3.5 border-x-[3px] border-border-default bg-bg-danger lg:w-12";
  return (
    <>
      <div aria-hidden className={`${cls} left-0`} />
      <div aria-hidden className={`${cls} right-0`} />
    </>
  );
}
