import { memo } from "react";
import { Icon } from "@/components/ui/icon";
import type { Tier } from "@/lib/event";
import type { Seat as SeatData } from "@/lib/seats";

export const TIER_BG: Record<Tier, string> = {
  "Platinum": "bg-seat-platinum",
  "Gold": "bg-seat-gold",
  "Silver": "bg-seat-silver",
  "Bronze": "bg-seat-bronze",
  VIP: "bg-seat-vip",
};

export type SeatState = "available" | "selected" | "taken" | "other" | "reserved";

const BASE = "relative before:absolute before:-inset-0.5 before:content-[''] flex size-(--s) items-center justify-center rounded-t-sm rounded-b-[3px] border transition-[background-color,border-color,box-shadow,scale] duration-(--duration-fast) ease-(--ease-out-soft)";

// Hover/focus ring is on the button; the tooltip shows on hover or focus of the wrapper.
export const SeatButton = memo(function SeatButton({ seat, state }: { seat: SeatData; state: SeatState }) {
  const label =
    state === "taken" ? `${seat.id}, terisi`
    : state === "reserved" ? `${seat.id}, VIP, tamu undangan`
    : state === "other" ? `${seat.id}, ${seat.tier}, bukan kategori pilihanmu`
    : `${seat.id}, ${seat.tier}, ${state === "selected" ? "dipilih" : "tersedia"}`;
  const clickable = state === "available" || state === "selected";
  const look =
    state === "selected" ? "border-border-default bg-seat-selected text-text-on-brand"
    : state === "taken" ? "border-border-default bg-seat-taken text-text-on-brand"
    : state === "reserved" ? "border-border-default bg-seat-vip text-text-secondary"
    : state === "other" ? `border-border-default opacity-60 text-text-strong ${TIER_BG[seat.tier]}`
    : `border-border-default ${TIER_BG[seat.tier]}`;
  const interactive = clickable ? "hover:scale-[1.08] hover:border-2 hover:border-border-brand hover:shadow-sticker-s focus-visible:border-2 focus-visible:border-border-brand focus-visible:shadow-sticker-s" : "cursor-not-allowed";
  const tip = state === "reserved" ? "VIP · tamu undangan" : state === "other" ? `${seat.id} · ${seat.tier} · bukan pilihanmu` : state === "taken" ? `${seat.id} · terisi` : `${seat.id} · ${seat.tier}`;
  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        data-id={clickable ? seat.id : undefined}
        disabled={!clickable}
        aria-pressed={clickable ? state === "selected" : undefined}
        aria-label={label}
        className={`${BASE} ${look} ${interactive} p-0 ${state === "other" ? "" : "disabled:opacity-100"}`}
      >
        {state === "selected" && <Icon name="check" size={14} className="animate-pop" />}
        {state === "taken" && <Icon name="x" size={14} />}
        {state === "reserved" && <Icon name="lock" size={12} />}
        {state === "other" && <span className="h-0.5 w-2 rounded-full bg-current" />}
      </button>
      <span
        aria-hidden
        className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 translate-y-1 -translate-x-1/2 opacity-0 transition-[opacity,translate] duration-(--duration-fast) ease-(--ease-out-soft) whitespace-nowrap rounded-sm bg-bg-inverse px-2 py-1 text-text-on-brand type-caption group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100"
      >
        {tip}
      </span>
    </span>
  );
});
