import { memo } from "react";
import { Icon } from "@/components/ui/icon";
import { tierPriceLabel, type Tier } from "@/lib/event";
import type { Seat as SeatData } from "@/lib/seats";

export const TIER_BG: Record<Tier, string> = {
  "Tipe 1": "bg-seat-tipe1",
  "Tipe 2": "bg-seat-tipe2",
  "Tipe 3": "bg-seat-tipe3",
  "Tipe 4": "bg-seat-tipe4",
  VIP: "bg-seat-vip",
};

export type SeatState = "available" | "selected" | "taken" | "locked";

const BASE = "relative before:absolute before:-inset-0.5 before:content-[''] flex size-(--s) items-center justify-center rounded-t-sm rounded-b-[3px] border transition-[background-color,border-color,box-shadow,scale] duration-(--duration-fast) ease-(--ease-out-soft)";

// Hover/focus ring is on the button; the tooltip shows on hover or focus of the wrapper.
export const SeatButton = memo(function SeatButton({ seat, state }: { seat: SeatData; state: SeatState }) {
  const price = tierPriceLabel(seat.tier);
  const label =
    state === "taken" ? `${seat.id}, terisi`
    : state === "locked" ? "VIP, terkunci"
    : `${seat.id}, ${seat.tier}${price ? `, ${price}` : ""}, tersedia`;
  const clickable = state === "available" || state === "selected";
  const look =
    state === "selected" ? "border-border-default bg-seat-selected text-text-on-brand"
    : state === "taken" ? "border-border-default bg-seat-taken text-text-on-brand"
    : state === "locked" ? "border-border-default bg-seat-vip text-text-secondary"
    : `border-border-default ${TIER_BG[seat.tier]}`;
  const interactive = clickable ? "hover:scale-[1.08] hover:border-2 hover:border-border-brand hover:shadow-sticker-s focus-visible:border-2 focus-visible:border-border-brand focus-visible:shadow-sticker-s" : "cursor-not-allowed";
  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        data-id={clickable ? seat.id : undefined}
        disabled={!clickable}
        aria-pressed={clickable ? state === "selected" : undefined}
        aria-label={label}
        className={`${BASE} ${look} ${interactive} p-0 disabled:opacity-100`}
      >
        {state === "selected" && <Icon name="check" size={14} className="animate-pop" />}
        {state === "taken" && <Icon name="x" size={14} />}
        {state === "locked" && <Icon name="lock" size={12} />}
      </button>
      <span
        aria-hidden
        className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 translate-y-1 -translate-x-1/2 opacity-0 transition-[opacity,translate] duration-(--duration-fast) ease-(--ease-out-soft) whitespace-nowrap rounded-sm bg-bg-inverse px-2 py-1 text-text-on-brand type-caption group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100"
      >
        {state === "locked" ? "VIP · terkunci" : `${seat.id} · ${seat.tier}${price ? ` · ${price}` : ""}`}
      </span>
    </span>
  );
});
