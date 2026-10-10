import { TIER_BG } from "@/components/seat/seat";
import { formatRupiah, TIERS, type Tier } from "@/lib/event";

export type TierInfo = { name: string; price: number | null; priceNormal: number | null };

/** `info` undefined = unknown (DB down): shows the tier key and "—". */
export function TierCard({ tier, info, presale }: { tier: Tier; info?: TierInfo; presale?: boolean }) {
  const price = info?.price;
  const promo = !!presale && info?.price != null && info.priceNormal != null && info.priceNormal !== info.price;
  const t = TIERS[tier];
  const named = !!info?.name && info.name !== tier;
  return (
    <div className="flex min-w-0 flex-col gap-2 rounded-md border-2 border-border-default bg-bg-surface bg-paper p-4 shadow-sticker transition-[translate,box-shadow] duration-(--duration-base) ease-(--ease-out-soft) hover:-translate-y-0.5 hover:shadow-sticker-l lg:w-70 lg:p-5">
      <div aria-hidden className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <span key={i} className={`size-6 rounded-t-sm rounded-b-[3px] border border-border-default ${TIER_BG[tier]}`} />
        ))}
      </div>
      <h3 className="type-h3 text-text-strong">{named ? info.name : tier}</h3>
      {named && <p className="type-label text-text-brand">{tier}</p>}
      <p className="type-caption text-text-secondary">{t.title} · {t.rows}</p>
      {promo && <span className="type-caption w-fit rounded-full border-2 border-border-default bg-bg-accent px-2 py-0.5 text-text-strong">PRESALE</span>}
      <p className="flex flex-wrap items-baseline gap-x-1.5">
        <span className="type-h4 lg:type-h3 text-text-brand">{price === undefined ? "—" : price === null ? "Segera" : formatRupiah(price)}</span>
        {promo && <s className="type-caption text-text-secondary"><span className="sr-only">harga normal </span>{formatRupiah(info!.priceNormal)}</s>}
        <span className="type-caption text-text-secondary">/ kursi</span>
      </p>
    </div>
  );
}
