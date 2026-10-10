import "server-only";
import { createHmac } from "node:crypto";
import { headers } from "next/headers";
import { network } from "@/lib/network";
import { supabase } from "@/lib/supabase";

// Fixed-window limit per client network, counted in Postgres (rate_hit, backend.md step 9) so it holds across
// every server instance. [max hits, window in seconds].
// ponytail: generous, because mobile CGNAT and campus wifi put many real buyers behind one IP. hold_seats also caps
// live holds per client (backend.md step 9). A distributed attacker still gets through; next step is a captcha (e.g. Turnstile).
const LIMITS = {
  hold: [40, 600],
  submit: [10, 600], // a real buyer submits once or twice; each "paid" fake still needs a proof the committee rejects
  lookup: [30, 600],
  login: [10, 900],
} as const;

export const RATE_LIMITED = "Terlalu banyak percobaan dari jaringanmu. Tunggu beberapa menit, lalu coba lagi ya.";

/** Keyed hash of the caller's network, or null when the IP is unknown (then no limit applies). */
export async function clientId(): Promise<string | null> {
  const h = await headers();
  // Vercel sets x-forwarded-for to the real client IP (first entry). Behind another proxy, make sure it does the same.
  const ip = (h.get("x-forwarded-for")?.split(",")[0] || h.get("x-real-ip") || "").trim();
  if (!ip) return null;
  // Never the raw IP: a plain sha256 of an IPv4 address is trivially reversible.
  return createHmac("sha256", process.env.SUPABASE_SECRET_KEY ?? "").update(network(ip)).digest("base64url").slice(0, 22);
}

/** True when this client went over the limit for `action`. Fails open: a DB error never blocks a buyer. */
export async function rateLimited(action: keyof typeof LIMITS): Promise<boolean> {
  const id = await clientId();
  if (!id) return false;
  const [limit, windowS] = LIMITS[action];
  try {
    const { data, error } = await supabase().rpc("rate_hit", { p_key: `${action}:${id}`, p_limit: limit, p_window_s: windowS });
    if (error) throw error;
    return data === false;
  } catch (e) {
    console.error("[rate-limit]", action, (e as { message?: string } | null)?.message ?? String(e));
    return false;
  }
}
