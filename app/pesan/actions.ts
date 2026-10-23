"use server";

// Checkout server actions. Every input is untrusted: validate here, let Postgres enforce the seat rules
// (hold_seats / submit_order in backend.md), and return only shaped, user-facing results.
import type { PayMethod } from "@/lib/booking";
import { isShowId, MAX_PROOF_BYTES, MAX_TICKETS, type ShowId, type Tier } from "@/lib/event"; // MAX_PROOF_BYTES must match the payment-proofs bucket limit
import { clientId, RATE_LIMITED, rateLimited } from "@/lib/rate-limit";
import { normalizeReferralCode, REFERRAL_CODE_MAX, REFERRAL_DISCOUNT } from "@/lib/referral";
import { SEATS } from "@/lib/seats";
import { supabase } from "@/lib/supabase";
import { checkField, validateBuyer } from "@/lib/validate";

export type HoldInput = {
  show: string;
  tier: string;
  seats: string[]; // seat ids, e.g. "C9"; qty = seats.length (1..MAX_TICKETS)
  buyer: { name: string; email: string; phone: string; org?: string };
  referralCode?: string | null; // optional; validated and priced by Postgres
  prevOrderId?: string | null; // the buyer's previous hold to release (changing seats)
};
export type HoldResult =
  | { ok: true; orderId: string; heldUntil: number; total: number } // heldUntil: epoch ms
  | { ok: false; error: string; lost?: string[]; referralInvalid?: boolean }; // lost: seats someone else took first

export type SubmitResult =
  | { ok: true; code: string; paidAt: number }
  | { ok: false; error: string; reset?: "referral" | "price" }; // reset: send the buyer back to step 1

export type Ticket = {
  code: string;
  show: ShowId;
  tier: Tier;
  tierName: string; // marketing name, e.g. "Hemat Tipis"
  seats: string[];
  buyer: { name: string; email: string; phone: string };
  method: PayMethod;
  total: number;
  status: "valid" | "invalid";
  paidAt: number; // epoch ms
};
export type LookupResult = { ok: true; ticket: Ticket } | { ok: false; error: string };
export type ReferralResult = { ok: true; code: string; label: string; discount: number } | { ok: false; error: string };

const SALE_TIERS = ["Platinum", "Gold", "Silver", "Bronze"];
const PROOF_EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "application/pdf": "pdf" };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CODE = /^[A-HJ-NP-Z2-9]{5}$/;
const BUCKET = "payment-proofs";

const GENERIC = "Maaf, ada gangguan di sistem kami. Coba lagi sebentar lagi ya.";
const EXPIRED = "Waktu pembayaran habis dan kursimu sudah dilepas. Pilih kursi lagi ya.";
const REFERRAL_INVALID = "Kode tidak valid.";
const REFERRAL_INVALID_LONG = "Kode referral sudah tidak berlaku. Kembali ke langkah 1 untuk lanjut dengan harga normal ya.";
const PRICE_CHANGED = "Harga tiket berubah sejak kamu memilih. Kembali ke langkah 1 untuk melihat harga terbaru ya.";
const REFERRAL_RE = /^[A-Z0-9-]{3,32}$/;

type DbError = { message: string; details?: string | null; code?: string };
const fail = (error: string) => ({ ok: false as const, error });

/** null = no code, false = malformed input, otherwise the normalized code. */
function cleanReferral(value: unknown): string | null | false {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string") return false;
  const code = normalizeReferralCode(value);
  if (!code) return null;
  return code.length <= REFERRAL_CODE_MAX && REFERRAL_RE.test(code) ? code : false;
}
// Message and code only: Postgres error details can echo buyer data.
function logError(where: string, e: unknown) {
  const { message, code } = (e ?? {}) as { message?: string; code?: string };
  console.error(`[checkout] ${where}`, code ?? "", message ?? String(e));
}

/** Step 1 check: does this code exist, active and under its quota? Rate-limited against guessing. */
export async function validateReferral(input: string): Promise<ReferralResult> {
  const code = cleanReferral(input);
  if (code === false) return fail(REFERRAL_INVALID);
  if (!code) return fail("Masukkan kode referral dulu ya.");
  if (await rateLimited("referral")) return fail(RATE_LIMITED);

  try {
    const db = supabase();
    const { data, error } = await db
      .from("referral_codes")
      .select("code, label, is_active, max_uses")
      .eq("code", code)
      .maybeSingle<{ code: string; label: string; is_active: boolean; max_uses: number | null }>();
    if (error) throw error;
    if (!data || !data.is_active) return fail(REFERRAL_INVALID);

    if (data.max_uses !== null) {
      const { count, error: countErr } = await db
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("referral_code", data.code)
        .eq("status", "valid");
      if (countErr) throw countErr;
      if ((count ?? 0) >= data.max_uses) return fail(REFERRAL_INVALID);
    }

    return { ok: true, code: data.code, label: data.label, discount: REFERRAL_DISCOUNT };
  } catch (e) {
    const err = (e ?? {}) as DbError;
    // Before backend.md step 12 runs, the table does not exist. Say so instead of a scary generic error.
    if (err.code === "42P01" || err.code === "PGRST205") return fail("Kode referral belum aktif. Coba lagi nanti ya.");
    logError("validateReferral", e);
    return fail(GENERIC);
  }
}

export async function holdSeats(input: HoldInput): Promise<HoldResult> {
  const i = (input ?? {}) as Partial<HoldInput>;
  if (typeof i.show !== "string" || !isShowId(i.show)) return fail("Show tidak ditemukan.");
  if (typeof i.tier !== "string" || !SALE_TIERS.includes(i.tier)) return fail("Kategori tiket tidak tersedia.");
  const seats = i.seats;
  if (!Array.isArray(seats) || seats.length < 1 || seats.length > MAX_TICKETS) return fail(`Pilih 1 sampai ${MAX_TICKETS} kursi.`);
  if (new Set(seats).size !== seats.length) return fail("Ada kursi yang dipilih dua kali.");
  // SEATS has VIP seats too, but their tier is "VIP", which is never a sale tier, so this rejects them.
  if (!seats.every((id) => typeof id === "string" && SEATS[id]?.tier === i.tier)) return fail("Semua kursi harus dari kategori tiket yang sama.");
  const buyer = validateBuyer(i.buyer);
  if (!buyer.ok) return buyer;
  const referral = cleanReferral(i.referralCode);
  if (referral === false) return fail(REFERRAL_INVALID);
  const prev = typeof i.prevOrderId === "string" && UUID.test(i.prevOrderId) ? i.prevOrderId : null;
  if (await rateLimited("hold")) return fail(RATE_LIMITED); // stops one client from holding the whole house

  try {
    const args = {
      p_show: Number(i.show),
      p_tier: i.tier,
      p_seats: seats,
      p_name: buyer.buyer.name,
      p_email: buyer.buyer.email,
      p_phone: buyer.buyer.phone,
      p_org: buyer.buyer.org,
      p_prev_order: prev,
    };
    const hold = (a: typeof args & { p_client?: string | null; p_referral?: string | null }) =>
      supabase().rpc("hold_seats", a).single<{ order_id: string; held_until: string; total: number }>();
    const client = await clientId();
    let { data, error } = await hold({ ...args, p_client: client, p_referral: referral });
    // ponytail: PGRST202 = no hold_seats with p_client/p_referral yet (backend.md step 9/12 not run). Retry the
    // older signature so checkout keeps working, but never silently drop a referral code the buyer typed.
    if (error?.code === "PGRST202") {
      if (referral) return fail("Kode referral belum bisa dipakai. Coba lagi sebentar lagi atau lanjut tanpa kode ya.");
      ({ data, error } = await hold({ ...args, p_client: client }));
    }
    if (error || !data) return holdError(error ?? { message: "NO_DATA" });
    return { ok: true, orderId: data.order_id, heldUntil: Date.parse(data.held_until), total: data.total };
  } catch (e) {
    logError("holdSeats", e);
    return fail(GENERIC);
  }
}

function holdError(e: DbError): HoldResult {
  if (e.message === "SEATS_TAKEN") {
    const lost = (e.details ?? "").split(",").filter(Boolean);
    return { ok: false, error: `Kursi ${lost.join(", ")} baru saja diambil orang lain. Pilih kursi lain ya.`, lost };
  }
  if (e.message === "PRICE_NOT_SET") return fail("Kategori tiket ini belum dibuka. Coba lagi nanti ya.");
  if (e.message === "REFERRAL_INVALID") return { ok: false, error: REFERRAL_INVALID_LONG, referralInvalid: true };
  if (e.message === "QUOTA_FULL") return fail("Kuota kategori ini sudah habis. Kembali dan pilih kategori lain ya.");
  if (e.message === "TOO_MANY_HOLDS") return fail("Terlalu banyak pesanan yang belum dibayar dari jaringanmu. Selesaikan atau tunggu 10 menit, lalu coba lagi ya.");
  logError("hold_seats", e);
  return fail(GENERIC);
}

// Real file signatures, so a renamed file can't pass as an image/PDF just by its declared type.
async function sniffType(file: File): Promise<string | null> {
  const b = new Uint8Array(await file.slice(0, 4).arrayBuffer());
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
  if (b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46) return "application/pdf"; // %PDF
  return null;
}

export async function submitPayment(formData: FormData): Promise<SubmitResult> {
  const orderId = formData.get("orderId");
  const method = formData.get("method");
  const proof = formData.get("proof");
  if (typeof orderId !== "string" || !UUID.test(orderId)) return fail("Pesanan tidak ditemukan. Mulai pesan lagi ya.");
  if (method !== "qris" && method !== "transfer") return fail("Pilih metode pembayaran dulu.");
  if (!(proof instanceof File) || proof.size === 0) return fail("Unggah bukti pembayaran dulu.");
  if (proof.size > MAX_PROOF_BYTES) return fail("Ukuran file maksimal 1 MB.");
  const type = await sniffType(proof);
  if (!type) return fail("Format file harus JPG, PNG, atau PDF."); // stored with the sniffed type, not the declared one
  if (await rateLimited("submit")) return fail(RATE_LIMITED);

  try {
    const db = supabase();
    // Check the hold before uploading, so dead or bogus orders never put files in storage.
    const { data: order, error: readErr } = await db.from("orders").select(ORDER_COLS).eq("id", orderId).maybeSingle<OrderRow>();
    if (readErr) throw readErr;
    if (!order) return fail("Pesanan tidak ditemukan. Mulai pesan lagi ya.");
    // A retried submit whose first response got lost: the order is already paid, so hand back its code.
    // Safe: the order uuid is the bearer token for its own order. Nothing is uploaded again.
    const paid = paidResult(order);
    if (paid) return paid;
    if (order.status !== "held") return fail(NOT_HELD);
    if (!order.held_until || Date.parse(order.held_until) <= Date.now()) return fail(EXPIRED);

    const path = `${order.show_id}/${orderId}.${PROOF_EXT[type]}`;
    // ponytail: upsert false so a concurrent submit can't overwrite (and then delete) a proof it doesn't own.
    // Ceiling: if removing a failed upload also fails, a retry with the same file type hits "already exists" until the hold expires.
    const { error: upErr } = await db.storage.from(BUCKET).upload(path, proof, { contentType: type, upsert: false });
    if (upErr) {
      const again = await paidNow(orderId); // the first submit may have finished between our read and upload
      if (again) return again;
      logError("upload", upErr);
      return fail("Bukti pembayaran gagal diunggah. Coba lagi ya.");
    }

    const { data, error } = await db
      .rpc("submit_order", { p_order: orderId, p_method: method, p_proof_path: path })
      .single<{ code: string; paid_at: string }>();
    if (error) {
      const { error: rmErr } = await db.storage.from(BUCKET).remove([path]);
      if (rmErr) logError(`remove orphan proof ${path}`, rmErr);
      if (error.message === "ORDER_NOT_HELD") return (await paidNow(orderId)) ?? fail(NOT_HELD);
      return submitError(error);
    }
    return { ok: true, code: data.code, paidAt: Date.parse(data.paid_at) };
  } catch (e) {
    logError("submitPayment", e);
    return fail(GENERIC);
  }
}

type OrderRow = { show_id: number; status: string; held_until: string | null; code: string | null; paid_at: string | null };
const ORDER_COLS = "show_id, status, held_until, code, paid_at";
const NOT_HELD = "Pesanan ini sudah tidak bisa dibayar. Hubungi panitia ya.";

function paidResult(o: OrderRow): SubmitResult | null {
  return o.status === "valid" && o.code && o.paid_at ? { ok: true, code: o.code, paidAt: Date.parse(o.paid_at) } : null;
}

async function paidNow(orderId: string): Promise<SubmitResult | null> {
  const { data } = await supabase().from("orders").select(ORDER_COLS).eq("id", orderId).maybeSingle<OrderRow>();
  return data ? paidResult(data) : null;
}

function submitError(e: DbError): SubmitResult {
  if (e.message === "HOLD_EXPIRED") return fail(EXPIRED);
  if (e.message === "ORDER_NOT_FOUND") return fail("Pesanan tidak ditemukan. Mulai pesan lagi ya.");
  if (e.message === "REFERRAL_INVALID") return { ok: false, error: REFERRAL_INVALID_LONG, reset: "referral" };
  if (e.message === "PRICE_CHANGED") return { ok: false, error: PRICE_CHANGED, reset: "price" };
  if (e.message === "PRICE_NOT_SET") return { ok: false, error: "Kategori tiket ini sudah tidak dijual. Kembali ke langkah 1 untuk pilih kategori lain ya.", reset: "price" };
  logError("submit_order", e);
  return fail(GENERIC);
}

const NOT_FOUND = "Tiket tidak ditemukan. Cek lagi kode booking dan email-nya ya.";

export async function lookupTicket(code: string, email: string): Promise<LookupResult> {
  const c = typeof code === "string" ? code.trim().toUpperCase() : "";
  const m = typeof email === "string" ? email.trim() : "";
  if (!CODE.test(c)) return fail("Kode booking terdiri dari 5 huruf/angka, contoh: K7M2Q.");
  const emailError = checkField("email", { name: "", email: m, phone: "", agree: true });
  if (emailError || m.length > 254) return fail(emailError ?? NOT_FOUND);
  if (await rateLimited("lookup")) return fail(RATE_LIMITED);

  try {
    const { data, error } = await supabase()
      .rpc("lookup_ticket", { p_code: c, p_email: m })
      .maybeSingle<{
        code: string; show_id: number; tier: Tier; tier_name: string; seats: string[];
        buyer_name: string; buyer_email: string; buyer_phone: string;
        method: PayMethod; total: number; status: string; paid_at: string;
      }>();
    if (error) throw error;
    if (!data || (data.status !== "valid" && data.status !== "invalid")) return fail(NOT_FOUND);
    return {
      ok: true,
      ticket: {
        code: data.code,
        show: String(data.show_id) as ShowId,
        tier: data.tier,
        tierName: data.tier_name,
        seats: data.seats,
        buyer: { name: data.buyer_name, email: data.buyer_email, phone: data.buyer_phone },
        method: data.method,
        total: data.total,
        status: data.status,
        paidAt: Date.parse(data.paid_at),
      },
    };
  } catch (e) {
    logError("lookupTicket", e);
    return fail(GENERIC);
  }
}
