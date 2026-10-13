import type { Tier } from "@/lib/event";

// [x, y, w, h] of each ticket category in a 60×52 sketch of the hall (stage on top, row A nearest).
const AREAS: Record<Exclude<Tier, "VIP">, [number, number, number, number][]> = {
  Platinum: [[16, 8, 28, 12], [16, 26, 28, 4]],
  Gold: [[16, 32, 28, 18]],
  Silver: [[2, 8, 12, 22], [46, 8, 12, 22]],
  Bronze: [[2, 32, 12, 18], [46, 32, 12, 18]],
};
const HALL: [number, number, number, number][] = [...Object.values(AREAS).flat(), [16, 21, 28, 4]]; // + invitation band

/** Tiny hall sketch with one ticket category lit in its seat colour. Decorative. */
export function TierMinimap({ tier, disabled }: { tier: Exclude<Tier, "VIP">; disabled?: boolean }) {
  return (
    <svg aria-hidden viewBox="0 0 60 52" className={`h-14 w-auto shrink-0 sm:h-16 ${disabled ? "opacity-40" : ""}`}>
      <rect x="10" y="1" width="40" height="4" rx="2" className="fill-bg-danger" />
      {HALL.map(([x, y, w, h], i) => <rect key={i} x={x} y={y} width={w} height={h} rx="2" className="fill-bg-muted stroke-border-subtle" strokeWidth="1" />)}
      {AREAS[tier].map(([x, y, w, h], i) => <rect key={i} x={x} y={y} width={w} height={h} rx="2" strokeWidth="1.5" className="stroke-border-default" style={{ fill: `var(--color-seat-${tier.toLowerCase()})` }} />)}
    </svg>
  );
}
