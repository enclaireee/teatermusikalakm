import { Icon, type IconName } from "@/components/ui/icon";
import type { Tier } from "@/lib/event";
import { TIER_BG } from "./seat";

export function SeatLegend({ tier }: { tier: Tier }) {
  const items: { label: string; swatch: string; icon?: IconName; dash?: boolean }[] = [
    { label: "Tersedia", swatch: TIER_BG[tier] },
    { label: "Kategori lain", swatch: `${TIER_BG[tier]} relative after:absolute after:inset-0 after:rounded-[inherit] after:bg-bg-surface/40`, dash: true },
    { label: "INVITATION", swatch: "bg-seat-vip text-text-strong", icon: "lock" },
    { label: "Dipilih", swatch: "bg-seat-selected text-text-on-brand", icon: "check" },
    { label: "Terisi", swatch: "bg-seat-taken text-text-on-brand", icon: "x" },
  ];
  return (
    <ul className="flex flex-wrap gap-x-3 gap-y-2 lg:gap-x-5">
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-2 text-text-primary type-caption">
          <span className={`flex size-5 items-center justify-center rounded-t-sm rounded-b-[3px] border border-border-default ${i.swatch}`}>
            {i.icon && <Icon name={i.icon} size={12} />}
            {i.dash && <span className="relative z-10 h-0.5 w-2 rounded-full bg-current" />}
          </span>
          {i.label}
        </li>
      ))}
    </ul>
  );
}
