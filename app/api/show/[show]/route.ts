import { getAvailability } from "@/lib/availability";
import { isShowId } from "@/lib/event";

// GET /api/show/1 → Availability from lib/availability.ts: { presale: { active }, tiers: [{ tier, title, name, price, priceNormal, left }], taken }. Live data, never cached.
export async function GET(_req: Request, ctx: { params: Promise<{ show: string }> }) {
  const { show } = await ctx.params;
  if (!isShowId(show)) return Response.json({ error: "Show tidak ditemukan." }, { status: 404 });
  try {
    return Response.json(await getAvailability(show), { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("[api/show]", e);
    return Response.json({ error: "Gagal memuat ketersediaan kursi." }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
