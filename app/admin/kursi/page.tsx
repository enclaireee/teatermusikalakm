import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { getAvailability } from "@/lib/availability";
import { SHOWS, isShowId } from "@/lib/event";
import { SeatPlan } from "./seat-plan";

export const instant = false;

export default async function KursiAdminPage({ searchParams }: PageProps<"/admin/kursi">) {
  await requireAdmin();
  const { show: s } = await searchParams;
  const show = typeof s === "string" && isShowId(s) ? s : "1";
  const { taken, tiers } = await getAvailability(show);
  const left = tiers.reduce((n, t) => n + t.left, 0);

  return (
    <main className="min-h-dvh bg-bg-page bg-paper">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-4 px-4 py-6 md:px-6">
        <header className="flex items-center justify-between gap-3">
          <h1 className="type-h3 text-text-strong">Denah kursi</h1>
          <Link href="/admin" className="type-label inline-flex min-h-11 items-center text-text-brand underline">← Pesanan</Link>
        </header>
        <nav aria-label="Pilih show" className="flex gap-2">
          {(["1", "2"] as const).map((id) => (
            <Link key={id} href={`/admin/kursi?show=${id}`} aria-current={id === show ? "page" : undefined} className={`type-label inline-flex min-h-11 items-center rounded-md border-2 border-border-default px-4 ${id === show ? "bg-bg-brand text-text-on-brand" : "bg-bg-surface text-text-strong"}`}>
              {SHOWS[id].label} · {SHOWS[id].start}
            </Link>
          ))}
        </nav>
        <p role="status" className="type-body-m text-text-primary">
          {left} kursi tersedia · {tiers.map((t) => `${t.tier} ${t.left}`).join(" · ")}
        </p>
        <section className="rounded-md border-2 border-border-default bg-bg-surface bg-paper p-3 md:p-6">
          <SeatPlan taken={taken} />
        </section>
        <p className="type-caption text-text-secondary">“Terisi” = terjual + sedang ditahan (hold 10 menit). Data langsung dari database; muat ulang untuk memperbarui.</p>
      </div>
    </main>
  );
}
