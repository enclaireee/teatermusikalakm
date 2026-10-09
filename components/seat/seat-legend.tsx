import { Icon } from "@/components/ui/icon";

const ITEMS = [
  { label: "Tipe 1", swatch: "bg-seat-tipe1" },
  { label: "Tipe 2", swatch: "bg-seat-tipe2" },
  { label: "Tipe 3", swatch: "bg-seat-tipe3" },
  { label: "Tipe 4", swatch: "bg-seat-tipe4" },
  { label: "VIP", swatch: "bg-seat-vip" },
  { label: "Dipilih", swatch: "bg-seat-selected text-text-on-brand", icon: "check" },
  { label: "Terisi", swatch: "bg-seat-taken text-text-on-brand", icon: "x" },
] as const;

export function SeatLegend() {
  return (
    <ul className="flex flex-wrap gap-x-3 gap-y-2 lg:gap-x-5">
      {ITEMS.map((i) => (
        <li key={i.label} className="flex items-center gap-2 text-text-primary type-caption">
          <span className={`flex size-5 items-center justify-center rounded-t-sm rounded-b-[3px] border border-border-default ${i.swatch}`}>
            {"icon" in i && <Icon name={i.icon} size={12} />}
          </span>
          {i.label}
        </li>
      ))}
    </ul>
  );
}
