import { SeatButton, TIER_BG, type SeatState } from "@/components/seat/seat";
import { Icon, type IconName } from "@/components/ui/icon";
import { MAX_CENTER, MAX_SIDE, SEAT_ROWS, type Seat } from "@/lib/seats";

const slotsWidth = (n: number) => `calc(var(--s) * ${n} + ${4 * (n - 1)}px)`;

function Block({ seats, slots, align, taken }: { seats: Seat[]; slots: number; align: string; taken: Set<string> }) {
  return (
    <div className={`flex shrink-0 gap-1 ${align}`} style={{ width: slotsWidth(slots) }}>
      {seats.map((s) => {
        const state: SeatState = s.tier === "VIP" ? "reserved" : taken.has(s.id) ? "taken" : "available";
        return <SeatButton key={s.id} seat={s} state={state} />;
      })}
    </div>
  );
}

const LEGEND: { label: string; swatch: string; icon?: IconName }[] = [
  { label: "Platinum", swatch: TIER_BG.Platinum },
  { label: "Gold", swatch: TIER_BG.Gold },
  { label: "Silver", swatch: TIER_BG.Silver },
  { label: "Bronze", swatch: TIER_BG.Bronze },
  { label: "INVITATION", swatch: "bg-seat-vip text-text-strong", icon: "lock" },
  { label: "Terisi", swatch: "bg-seat-taken text-text-on-brand", icon: "x" },
];

/** Read-only plan for admins, same look as the buyer's seat map: occupied seats are dark with an ✕. */
export function SeatPlan({ taken }: { taken: string[] }) {
  const set = new Set(taken);
  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-wrap gap-x-4 gap-y-2">
        {LEGEND.map((i) => (
          <li key={i.label} className="flex items-center gap-2 text-text-primary type-caption">
            <span className={`flex size-5 items-center justify-center rounded-t-sm rounded-b-[3px] border border-border-default ${i.swatch}`}>
              {i.icon && <Icon name={i.icon} size={12} />}
            </span>
            {i.label}
          </li>
        ))}
      </ul>
      <div className="overflow-x-auto rounded-md bg-bg-muted p-1 lg:bg-transparent lg:p-0">
        <div className="mx-auto flex w-max flex-col items-center gap-1.5 px-2 pt-8 pb-2 [--s:24px]">
          <div className="flex h-9 w-[600px] items-center justify-center rounded-md border border-border-default bg-seat-stage text-text-strong type-label">PANGGUNG</div>
          <div className="h-2.5" />
          {SEAT_ROWS.map((r) => {
            const label = <span className="w-5 text-center text-text-secondary type-caption" aria-hidden>{r.row}</span>;
            return (
              <div key={r.row} role="group" aria-label={`Baris ${r.row}`} className="flex items-center gap-4">
                {label}
                <Block seats={r.left} slots={MAX_SIDE} align="justify-end" taken={set} />
                <Block seats={r.center} slots={MAX_CENTER} align="justify-center" taken={set} />
                <Block seats={r.right} slots={MAX_SIDE} align="justify-start" taken={set} />
                {label}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
