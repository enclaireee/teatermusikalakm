"use client";

import { memo, useCallback, useMemo, useState } from "react";
import { MAX_CENTER, MAX_SIDE, SEAT_ROWS, SEATS, type Seat, type SeatRow } from "@/lib/seats";
import type { Tier } from "@/lib/event";
import { SeatButton, type SeatState } from "./seat";

type Props = { tier: Tier; taken: string[]; selected: string[]; max: number; onChange: (selected: string[]) => void };

const GAP = 4;
const slotsWidth = (n: number) => `calc(var(--s) * ${n} + ${GAP * (n - 1)}px)`;
const ZOOMS = [0.8, 0.9, 1, 1.2, 1.4];

function Block({ seats, slots, align, tier, taken, sel }: { seats: Seat[]; slots: number; align: string; tier: Tier; taken: Set<string>; sel: string }) {
  return (
    <div className={`flex shrink-0 gap-1 ${align}`} style={{ width: slotsWidth(slots) }}>
      {seats.map((s) => {
        const state: SeatState = s.tier === "VIP" ? "reserved" : s.tier !== tier ? "other" : sel.includes(` ${s.id} `) ? "selected" : taken.has(s.id) ? "taken" : "available";
        return <SeatButton key={s.id} seat={s} state={state} />;
      })}
    </div>
  );
}

// Memoised per row: only rows whose selection string / tier / taken set changes re-render.
const Row = memo(function Row({ r, tier, taken, sel }: { r: SeatRow; tier: Tier; taken: Set<string>; sel: string }) {
  const label = <span className="w-5 text-center text-text-secondary type-caption" aria-hidden>{r.row}</span>;
  return (
    <div role="group" aria-label={`Baris ${r.row}`} className="flex items-center gap-4">
      {label}
      <Block seats={r.left} slots={MAX_SIDE} align="justify-end" tier={tier} taken={taken} sel={sel} />
      <Block seats={r.center} slots={MAX_CENTER} align="justify-center" tier={tier} taken={taken} sel={sel} />
      <Block seats={r.right} slots={MAX_SIDE} align="justify-start" tier={tier} taken={taken} sel={sel} />
      {label}
    </div>
  );
});

export function SeatMap({ tier, taken, selected, max, onChange }: Props) {
  const takenSet = useMemo(() => new Set(taken), [taken]);
  const [zoomIdx, setZoomIdx] = useState(2);
  const [notice, setNotice] = useState("");

  // Centre the horizontal scroll once the viewport mounts (no-op when nothing overflows).
  const centre = useCallback((el: HTMLDivElement | null) => {
    if (el) el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
  }, []);

  const toggle = useCallback((e: React.MouseEvent) => {
    const id = (e.target as HTMLElement).closest<HTMLButtonElement>("button[data-id]")?.dataset.id;
    if (!id || SEATS[id]?.tier !== tier) return;
    const cur = selected, m = max, change = onChange;
    if (cur.includes(id)) { setNotice(""); change(cur.filter((x) => x !== id)); }
    else if (cur.length >= m) setNotice(`Maks. ${m} kursi. Batalkan salah satu dulu.`);
    else { setNotice(""); change([...cur, id]); }
  }, [selected, max, onChange, tier]);

  const zoomBtn = "flex size-11 items-center justify-center rounded-md border border-border-default bg-bg-surface text-text-strong type-h3 disabled:bg-bg-disabled disabled:text-text-disabled";

  return (
    <div>
      {/* Scrolls on desktop too: the map (~924px) is wider than the content column below ~1430px windows. */}
      <div ref={centre} className="overflow-x-auto rounded-md bg-bg-muted p-1 lg:bg-transparent lg:p-0">
        <div
          onClick={toggle}
          style={{ "--z": ZOOMS[zoomIdx] } as React.CSSProperties}
          className="mx-auto flex w-max flex-col items-center gap-1.5 px-2 pt-8 pb-2 [--s:24px] [transition:zoom_var(--duration-base)_var(--ease-out-soft)] [zoom:var(--z)] lg:[--s:20px] lg:[zoom:1]"
        >
          <div className="flex h-9 w-[600px] items-center justify-center rounded-md border border-border-default bg-seat-stage text-text-strong type-label">PANGGUNG</div>
          <div className="h-2.5" />
          {SEAT_ROWS.map((r) => {
            const sel = " " + selected.filter((id) => SEATS[id]?.row === r.row).join(" ") + " ";
            return <Row key={r.row} r={r} tier={tier} taken={takenSet} sel={sel} />;
          })}
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3 lg:hidden">
        <p className="min-w-0 text-text-secondary type-caption">← Geser untuk lihat semua kursi →</p>
        <div className="flex shrink-0 gap-2">
          <button type="button" aria-label="Perkecil" disabled={zoomIdx === 0} onClick={() => setZoomIdx((i) => i - 1)} className={zoomBtn}>−</button>
          <button type="button" aria-label="Perbesar" disabled={zoomIdx === ZOOMS.length - 1} onClick={() => setZoomIdx((i) => i + 1)} className={zoomBtn}>+</button>
        </div>
      </div>
      <p role="status" aria-live="polite" className="mt-2 min-h-4 text-text-danger type-caption">{notice}</p>
    </div>
  );
}
