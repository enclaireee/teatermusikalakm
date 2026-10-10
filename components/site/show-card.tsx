import { Suspense } from "react";
import { connection } from "next/server";
import { Button } from "@/components/ui/button";
import { Burst } from "@/components/site/hero-art";
import { Stamp } from "@/components/ui/stamp";
import { EVENT, SHOWS, type ShowId } from "@/lib/event";
import { getAvailability } from "@/lib/availability";

/** Show card; the live seat count only decides the sold-out state (no count is shown). */
export function ShowCard({ id }: { id: ShowId }) {
  return (
    <Suspense fallback={<ShowCardView id={id} />}>
      <LiveShowCard id={id} />
    </Suspense>
  );
}

async function LiveShowCard({ id }: { id: ShowId }) {
  await connection(); // always request-time, never baked into the static shell
  let left: number | undefined;
  try {
    left = (await getAvailability(id)).tiers.reduce((n, t) => n + t.left, 0);
  } catch {
    // DB unreachable: render the placeholder state
  }
  return <ShowCardView id={id} left={left} />;
}

/** Torn ADMIT ONE ticket: body + stub split by a perforation (stub right at md+, bottom on mobile). `left` undefined = unknown. */
function ShowCardView({ id, left }: { id: ShowId; left?: number }) {
  const show = SHOWS[id];
  const sold = left === 0;
  const end = show.time.split("–")[1]?.trim();
  const notch = "absolute size-8 rounded-full border-[3px] border-border-default bg-bg-page";
  return (
    <article className={`group relative flex min-w-0 flex-col border-[3px] border-border-default shadow-sticker-l transition-[rotate,translate,box-shadow] duration-(--duration-base) ease-(--ease-out-soft) md:flex-row ${id === "1" ? "-rotate-[1.5deg]" : "rotate-[1.5deg]"} ${sold ? "bg-bg-muted" : "bg-bg-page hover:-translate-y-1 hover:rotate-0 focus-within:-translate-y-1 focus-within:rotate-0"}`}>
      {/* body */}
      <div className={`relative min-w-0 flex-1 overflow-hidden p-4 md:p-5 lg:p-6 ${sold ? "text-text-primary" : "bg-paper text-text-strong"}`}>
        <span aria-hidden className="pointer-events-none absolute -bottom-6 -left-6 size-28 [background-image:radial-gradient(rgb(0_0_0/0.22)_1.5px,transparent_2px)] [background-size:8px_8px] [mask-image:radial-gradient(circle_at_0_100%,#000,transparent_70%)]" />
        <div className="relative flex flex-wrap items-center gap-2 pr-12 md:gap-3 md:pr-14">
          <h3 className={`type-label md:type-h4 -rotate-[4deg] border-[3px] border-border-default px-2.5 py-0.5 md:px-3 md:py-1 uppercase shadow-sticker-s ${sold ? "bg-bg-disabled text-text-strong" : "bg-bg-brand text-text-on-brand"}`}>{show.label}</h3>
          <span aria-hidden className="type-caption tracking-[0.2em] text-text-primary">ADMIT ONE</span>
        </div>
        {!sold && <Burst className="right-3 top-3 size-9 rotate-12 md:size-12" still />}
        <p className="relative mt-3 flex flex-wrap items-baseline gap-x-2 md:mt-4">
          <span className="type-h1 md:type-display-l -rotate-3">{show.start}</span>
          <span className="type-body-l md:type-h4">– {end} WIB</span>
        </p>
        <p className="type-body-s md:type-body-m relative mt-2 md:mt-3">{EVENT.date}</p>
        <p className="type-body-s md:type-body-m relative">{EVENT.venue}</p>
      </div>

      {/* stub */}
      <div className={`relative flex flex-col gap-2 border-t-[3px] border-dashed border-border-default p-4 md:w-52 md:gap-3 md:p-5 md:shrink-0 md:justify-center md:border-l-[3px] md:border-t-0 ${sold ? "" : "bg-bg-accent-soft bg-paper"}`}>
        <span aria-hidden className={`${notch} -left-[18px] -top-[18px] md:-left-4 md:-top-[19px]`} />
        <span aria-hidden className={`${notch} -right-[18px] -top-[18px] md:-left-4 md:right-auto md:top-auto md:-bottom-[19px]`} />
        <span aria-hidden className="bg-barcode h-7 w-full opacity-80 md:h-14" />
        <span aria-hidden className="type-caption -rotate-3 text-text-primary">No. 00{id}</span>
        {sold ? (
          <Button disabled fullWidth>Tiket Habis</Button>
        ) : (
          <Button href={`/pesan/${id}/pilih-tiket`} icon="arrow-right" fullWidth>Pilih {show.label}</Button>
        )}
      </div>
      {sold && <span aria-hidden><Stamp color="red" rotate={-10} className="absolute left-1/2 top-1/3 -translate-x-1/2 bg-bg-muted/80">SOLD OUT</Stamp></span>}
    </article>
  );
}
