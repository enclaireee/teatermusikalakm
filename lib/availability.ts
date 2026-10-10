import "server-only";
import type { ShowId, Tier } from "./event";
import { supabase } from "./supabase";

export type TierAvailability = {
  tier: Tier; // ticket category key: "Platinum" | "Gold" | "Silver" | "Bronze"
  title: string; // seat area description, e.g. "Tengah depan"
  name: string; // marketing name, e.g. "Hemat Tipis" (falls back to the key)
  price: number | null; // current price: presale while presale is active, else normal; null = not on sale
  priceNormal: number | null;
  left: number;
};
export type Availability = { presale: { active: boolean }; tiers: TierAvailability[]; taken: string[] };

/** Live seat availability for one show (no caching: holds change every minute). Throws on DB errors. */
export async function getAvailability(show: ShowId): Promise<Availability> {
  const { data, error } = await supabase().rpc("show_availability", { p_show: Number(show) });
  if (error) throw new Error(`show_availability failed: ${error.message}`);
  const d = data as Availability;
  return {
    presale: { active: d.presale.active },
    tiers: d.tiers.map(({ tier, title, name, price, priceNormal, left }) => ({ tier, title, name, price, priceNormal, left })),
    taken: d.taken,
  };
}
