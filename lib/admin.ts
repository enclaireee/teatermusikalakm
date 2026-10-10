import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getAvailability } from "@/lib/availability";
import type { PayMethod } from "@/lib/booking";
import type { ShowId, Tier } from "@/lib/event";
import { SEATS } from "@/lib/seats";
import { supabase } from "@/lib/supabase";

// Admin session + data access for /admin (backend.md step 7). Every admin page and action calls
// requireAdmin() itself: layouts don't re-run on navigation and server actions can be called directly.

const COOKIE = "akm_admin";
const TTL_S = 12 * 60 * 60;
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function config() {
  const user = process.env.ADMIN_USER;
  const password = process.env.ADMIN_PASSWORD;
  const key = process.env.SUPABASE_SECRET_KEY;
  // A long password plus the login rate limit in app/admin/actions.ts (lib/rate-limit.ts).
  if (!user || !password || password.length < 12 || !key) return null;
  return { user, password, key };
}

// Hash first so timingSafeEqual gets equal lengths and leaks neither content nor length.
const sha = (s: string) => createHash("sha256").update(s).digest();
const same = (a: string, b: string) => timingSafeEqual(sha(a), sha(b));

// Keyed by the Supabase secret (never leaves the server) and bound to the current login,
// so changing ADMIN_USER or ADMIN_PASSWORD logs every admin out.
function sign(exp: number): string | null {
  const c = config();
  return c ? createHmac("sha256", c.key).update(`admin|${c.user}|${c.password}|${exp}`).digest("base64url") : null;
}

export const adminConfigured = () => config() !== null;

export function checkLogin(user: string, password: string): boolean {
  const c = config();
  if (!c) return false;
  const userOk = same(user, c.user);
  const passOk = same(password, c.password); // both always compared
  return userOk && passOk;
}

export async function startSession() {
  const exp = Math.floor(Date.now() / 1000) + TTL_S;
  const sig = sign(exp);
  if (!sig) throw new Error("Admin login is not configured");
  (await cookies()).set(COOKIE, `${exp}.${sig}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/admin",
    maxAge: TTL_S,
  });
}

export async function endSession() {
  (await cookies()).set(COOKIE, "", { path: "/admin", maxAge: 0 });
}

export async function isAdmin(): Promise<boolean> {
  await connection(); // the expiry check reads the clock: request time only, never prerendered
  const [expS, sig] = ((await cookies()).get(COOKIE)?.value ?? "").split(".");
  const exp = Number(expS);
  if (!sig || !Number.isInteger(exp) || exp * 1000 <= Date.now()) return false;
  const want = sign(exp);
  return want !== null && same(sig, want);
}

export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}

export type OrderStatus = "valid" | "invalid";
export type AdminOrder = {
  id: string;
  code: string;
  show: ShowId;
  tier: Exclude<Tier, "VIP">;
  qty: number;
  seats: string[]; // sorted like the seat map: row, then number
  buyer: { name: string; email: string; phone: string; org: string | null };
  method: PayMethod | null;
  total: number;
  status: OrderStatus;
  checked: boolean | null; // admin-only: null = not reviewed, true = valid, false = not valid
  presale: boolean; // bought at the presale price (backend.md step 8)
  claimedAt: string | null; // ISO; physical ticket picked up on D-day (backend.md step 10)
  createdAt: string; // ISO
  paidAt: string | null; // ISO
  proofPath: string | null;
};

type Row = {
  id: string; code: string; show_id: number; tier: AdminOrder["tier"]; qty: number;
  buyer_name: string; buyer_email: string; buyer_phone: string; buyer_org: string | null;
  method: PayMethod | null; total: number; status: OrderStatus; checked: boolean | null; presale: boolean | null; claimed_at: string | null;
  created_at: string; paid_at: string | null; proof_path: string | null; seats: { seat_id: string }[];
};
const COLS = "id, code, show_id, tier, qty, buyer_name, buyer_email, buyer_phone, buyer_org, method, total, status, checked, presale, claimed_at, created_at, paid_at, proof_path, seats(seat_id)";

const seatKey = (id: string) => (SEATS[id] ? SEATS[id].row.charCodeAt(0) * 1000 + SEATS[id].number : 0);
export const sortSeats = (ids: string[]) => [...ids].sort((a, b) => seatKey(a) - seatKey(b));

function toOrder(r: Row): AdminOrder {
  return {
    id: r.id, code: r.code, show: String(r.show_id) as ShowId, tier: r.tier, qty: r.qty,
    seats: sortSeats(r.seats.map((s) => s.seat_id)),
    buyer: { name: r.buyer_name, email: r.buyer_email, phone: r.buyer_phone, org: r.buyer_org },
    method: r.method, total: r.total, status: r.status, checked: r.checked, presale: r.presale === true, claimedAt: r.claimed_at,
    createdAt: r.created_at, paidAt: r.paid_at, proofPath: r.proof_path,
  };
}

/** Every paid order (valid or invalid), newest first. Unpaid holds are left out. */
export async function listOrders(): Promise<AdminOrder[]> {
  await requireAdmin();
  // ponytail: one unpaged query; at most 750 paid orders (one per seat), under PostgREST's 1000-row cap.
  const { data, error } = await supabase().from("orders").select(COLS).neq("status", "held").order("paid_at", { ascending: false }).returns<Row[]>();
  if (error) throw error;
  return data.map(toOrder);
}

export type AdminOrderDetail = {
  order: AdminOrder;
  taken: string[]; // seats the order can't move to: sold to others, live holds, broken
};

export async function getOrder(id: string): Promise<AdminOrderDetail | null> {
  await requireAdmin();
  if (!UUID.test(id)) return null;
  const db = supabase();
  const { data, error } = await db.from("orders").select(COLS).eq("id", id).neq("status", "held").maybeSingle<Row>();
  if (error) throw error;
  if (!data) return null;
  const order = toOrder(data);

  const avail = await getAvailability(order.show);
  const own = new Set(order.seats);
  return { order, taken: avail.taken.filter((s) => !own.has(s)) };
}

export type Pricing = {
  presale: boolean; // the manual switch (settings.presale)
  tiers: { tier: AdminOrder["tier"]; name: string; pricePresale: number | null; priceNormal: number | null }[];
};

/** The presale switch plus both prices per ticket category, for the admin price bar. */
export async function getPricing(): Promise<Pricing> {
  await requireAdmin();
  const db = supabase();
  const [settings, tiers] = await Promise.all([
    db.from("settings").select("presale").maybeSingle<{ presale: boolean }>(),
    db.from("tiers").select("tier, name, price_presale, price_normal").order("sort")
      .returns<{ tier: AdminOrder["tier"]; name: string | null; price_presale: number | null; price_normal: number | null }[]>(),
  ]);
  if (settings.error) throw settings.error;
  if (tiers.error) throw tiers.error;
  return {
    presale: settings.data?.presale === true,
    tiers: tiers.data.map((t) => ({ tier: t.tier, name: t.name ?? t.tier, pricePresale: t.price_presale, priceNormal: t.price_normal })),
  };
}
