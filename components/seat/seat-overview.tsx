import { SALE_TIERS, TIERS, type Tier } from "@/lib/event";
import { MAX_CENTER, MAX_SIDE, SEAT_ROWS, type Seat } from "@/lib/seats";
import { TIER_BG } from "./seat";

type Props = { tier: Tier | null; names: Partial<Record<Tier, string>> };

const SUMMARY = "Denah kursi, panggung di depan, baris A terdekat. " + (["Platinum", "Gold", "Silver", "Bronze", "VIP"] as Tier[]).map((t) => `${t === "VIP" ? "Invitation" : `${t} ${TIERS[t].title.toLowerCase()}`}, ${TIERS[t].rows}`).join("; ") + ".";

function Block({ seats, slots, align, tier }: { seats: Seat[]; slots: number; align: string; tier: Tier | null }) {
  return (
    <div className={`flex min-w-0 gap-px ${align}`} style={{ flex: slots }}>
      {seats.map((s) => (
        <span
          key={s.id}
          style={{ width: `${100 / slots}%` }}
          className={`aspect-square min-w-0 rounded-t-[2px] rounded-b-[1px] ${TIER_BG[s.tier]} ${tier && s.tier !== tier ? "opacity-40" : ""}`}
        />
      ))}
    </div>
  );
}

/** Read-only seat plan: shows where each ticket category sits; the chosen one is highlighted. */
export function SeatOverview({ tier, names }: Props) {
  const label = (t: Tier) => (names[t] && names[t] !== t ? `${names[t]} (${t})` : t);
  return (
    <div className="flex flex-col gap-3 rounded-md border-2 border-border-default bg-paper p-3 sm:p-4">
      <div role="img" aria-label={SUMMARY} className="flex flex-col gap-1">
        <div className="mb-1 flex h-7 items-center justify-center rounded-md border border-border-default bg-bg-danger text-text-on-brand type-label">PANGGUNG</div>
        {SEAT_ROWS.map((r) => (
          <div key={r.row} aria-hidden className="flex items-center gap-1.5">
            <span className="w-3 shrink-0 text-center text-text-secondary type-caption">{r.row}</span>
            <div className="flex min-w-0 flex-1 gap-1.5">
              <Block seats={r.left} slots={MAX_SIDE} align="justify-end" tier={tier} />
              <Block seats={r.center} slots={MAX_CENTER} align="justify-center" tier={tier} />
              <Block seats={r.right} slots={MAX_SIDE} align="justify-start" tier={tier} />
            </div>
          </div>
        ))}
      </div>
      <ul className="flex flex-wrap gap-x-3 gap-y-2">
        {[...SALE_TIERS.map((t) => ({ k: t, label: label(t), swatch: TIER_BG[t] })), { k: "VIP", label: "INVITATION", swatch: "bg-seat-vip" }].map((i) => (
          <li key={i.k} className={`flex items-center gap-2 type-caption ${i.k === tier ? "rounded-sm border-2 border-border-brand px-1.5 py-0.5 font-bold text-text-strong" : "text-text-primary"}`}>
            <span className={`size-5 shrink-0 rounded-t-sm rounded-b-[3px] border border-border-default ${i.swatch}`} />
            {i.label}{i.k === tier && " · pilihanmu"}
          </li>
        ))}
      </ul>
    </div>
  );
}
