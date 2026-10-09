import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Stamp } from "@/components/ui/stamp";
import { EVENT, SHOWS, type ShowId } from "@/lib/event";
import { seatsLeft } from "@/lib/seats";

/** Show card (Figma Show Card: Default / Hover / Sold Out). */
export function ShowCard({ id }: { id: ShowId }) {
  const show = SHOWS[id];
  const left = seatsLeft(id);
  const sold = left === 0;
  return (
    <article className={`group relative flex min-w-0 flex-col gap-4 rounded-lg border-2 border-border-default bg-bg-surface bg-paper p-6 shadow-sticker reveal transition-[translate,background-color,box-shadow,border-color] duration-(--duration-base) ease-(--ease-out-soft) ${sold ? "" : "hover:-translate-y-1 hover:border-border-brand hover:bg-bg-accent-soft hover:shadow-sticker-l focus-within:border-border-brand focus-within:bg-bg-accent-soft focus-within:shadow-sticker-l"}`}>
      <div className="flex items-center justify-between gap-2">
        <h3 className={`type-h4 rounded-sm border-2 border-border-default px-3 py-1 uppercase text-text-strong ${sold ? "bg-bg-disabled" : "bg-bg-accent"}`}>{show.label}</h3>
        <span className={`type-caption rounded-full px-3 py-1 ${sold ? "bg-bg-danger-soft text-text-danger" : "bg-bg-brand-soft text-text-brand"}`}>
          {sold ? "Habis" : `Sisa ${left} kursi`}
        </span>
      </div>
      <p className="flex flex-wrap items-baseline gap-x-2">
        <span className={`type-h1 ${sold ? "text-text-secondary" : "text-text-strong"}`}>{show.time}</span>
        <span className="type-h4 text-text-secondary">WIB</span>
      </p>
      <p className="type-body-m flex items-center gap-2"><Icon name="calendar" size={20} className="shrink-0 text-text-secondary" />{EVENT.date}</p>
      <p className="type-body-m flex items-center gap-2"><Icon name="map-pin" size={20} className="shrink-0 text-text-secondary" />{EVENT.venue}</p>
      <hr className="border-t-2 border-dashed border-border-subtle" />
      {sold ? (
        <Button disabled fullWidth>Tiket Habis</Button>
      ) : (
        <Button href={`/pesan/${id}/data-diri`} icon="arrow-right" fullWidth>Pilih {show.label}</Button>
      )}
      {sold && <Stamp color="red" rotate={-8} className="absolute right-6 top-16">SOLD OUT</Stamp>}
    </article>
  );
}
