"use client";
import { TIER_BG } from "@/components/seat/seat";
import { TIERS, formatRupiah, type Tier } from "@/lib/event";
import type { TierAvailability } from "@/lib/use-availability";

type Props = { name: string; info: TierAvailability | undefined; extraLeft?: number; tier: Tier; presale: boolean; checked: boolean; onChange: (tier: Tier) => void };

/** Radio card for one sale tier; sold-out or not-on-sale tiers are disabled. */
export function TierOption({ name, info, extraLeft = 0, tier, presale, checked, onChange }: Props) {
  const named = !!info?.name && info.name !== tier;
  const price = info?.price ?? null;
  const left = (info?.left ?? 0) + (info ? extraLeft : 0);
  const disabled = price === null || left <= 0;
  const onPresale = presale && price !== null && info?.priceNormal != null && info.priceNormal !== price;
  const state = disabled
    ? "cursor-not-allowed border-2 border-border-subtle bg-bg-disabled"
    : checked
      ? "cursor-pointer border-[3px] border-border-brand bg-bg-brand-soft shadow-sticker"
      : "cursor-pointer border-2 border-border-default bg-bg-surface hover:bg-bg-accent-soft hover:shadow-sticker";
  const muted = disabled ? "text-text-disabled" : checked ? "text-text-primary" : "text-text-secondary";
  const note = price === null ? "Belum dibuka" : left <= 0 ? "Habis" : `Sisa ${left} kursi`;
  return (
    <label className={`flex min-h-11 min-w-0 items-center gap-3 rounded-md px-4 py-4 transition-[background-color,border-color,box-shadow] duration-(--duration-base) ease-(--ease-out-soft) has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-3 has-[:focus-visible]:outline-border-focus sm:gap-4 sm:px-5 ${state}`}>
      <input type="radio" name={name} value={tier} checked={checked} disabled={disabled} onChange={() => onChange(tier)} className="sr-only" />
      <span aria-hidden="true" className={`flex size-[22px] shrink-0 items-center justify-center rounded-full border-2 bg-bg-surface ${checked ? "border-border-brand" : disabled ? "border-border-subtle" : "border-border-default"}`}>
        {checked && <span className="size-2.5 animate-pop rounded-full bg-bg-brand" />}
      </span>
      <span aria-hidden="true" className={`type-label flex size-9 shrink-0 items-center justify-center rounded-sm border-2 border-border-default ${TIER_BG[tier]} ${disabled ? "opacity-40" : ""}`}>
        {tier.charAt(0)}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className={`type-h4 ${disabled ? "text-text-disabled" : "text-text-strong"}`}>{named ? info.name : tier}</span>
        {named && <span className={`type-label ${muted}`}>{tier}</span>}
        <span className={`type-caption ${muted}`}>{TIERS[tier].title} · {TIERS[tier].rows}</span>
      </span>
      <span className="flex shrink-0 flex-col items-end gap-0.5 text-right">
        {onPresale && <span className="type-caption rounded-full border-2 border-border-default bg-bg-accent px-2 text-text-strong">PRESALE</span>}
        {onPresale && (
          <s className={`type-caption ${muted}`}>
            <span className="sr-only">harga normal </span>
            {formatRupiah(info!.priceNormal)}
          </s>
        )}
        <span className={`type-body-m ${disabled ? "text-text-disabled" : "text-text-strong"}`}>{formatRupiah(price)}</span>
        <span className={`type-caption ${disabled ? "text-text-strong" : muted}`}>{note}</span>
      </span>
    </label>
  );
}
