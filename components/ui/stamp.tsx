const COLORS = {
  red: "border-border-danger text-text-danger",
  green: "border-border-brand text-text-brand",
} as const;

/** Stylescape stamp (CONFIRMED, DITERIMA, …). Rotate −6° to −10° when placed. */
export function Stamp({ color = "green", rotate = -8, children, className = "" }: { color?: "red" | "green"; rotate?: number; children: React.ReactNode; className?: string }) {
  return (
    <span
      className={`type-h3 inline-block rounded-sm border-4 px-4 py-1.5 uppercase ${COLORS[color]} ${className}`}
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      {children}
    </span>
  );
}
