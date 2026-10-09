import { TIER_BG } from "@/components/seat/seat";
import { formatRupiah, TIERS, type Tier } from "@/lib/event";

export function TierCard({ tier }: { tier: Tier }) {
  const t = TIERS[tier];
  return (
    <div className="flex min-w-0 flex-col gap-2 rounded-md border-2 border-border-default bg-bg-surface bg-paper p-4 shadow-sticker transition-[translate,box-shadow] duration-(--duration-base) ease-(--ease-out-soft) hover:-translate-y-0.5 hover:shadow-sticker-l lg:w-70 lg:p-5">
      <div aria-hidden className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <span key={i} className={`size-6 rounded-t-sm rounded-b-[3px] border border-border-default ${TIER_BG[tier]}`} />
        ))}
      </div>
      <h3 className="type-h3 text-text-strong">{tier}</h3>
      <p className="type-caption text-text-secondary">{t.title} · {t.rows}</p>
      <p className="flex flex-wrap items-baseline gap-x-1.5">
        <span className="type-h4 lg:type-h3 text-text-brand">{formatRupiah(t.price)}</span>
        <span className="type-caption text-text-secondary">/ kursi</span>
      </p>
    </div>
  );
}
