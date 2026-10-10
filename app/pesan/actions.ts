"use server";

// Checkout server actions. Every input is untrusted: validate here, let Postgres enforce the seat rules
// (hold_seats / submit_order in backend.md), and return only shaped, user-facing results.
import type { PayMethod } from "@/lib/booking";
import { isShowId, MAX_PROOF_BYTES, type ShowId, type Tier } from "@/lib/event"; // MAX_PROOF_BYTES must match the payment-proofs bucket limit
import { SEATS } from "@/lib/seats";
import { supabase } from "@/lib/supabase";
import { checkField, validateBuyer } from "@/lib/validate";

export type HoldInput = {
  show: string;
  tier: string;
  seats: string[]; // seat ids, e.g. "C9"; qty = seats.length (1..4)
  buyer: { name: string; email: string; phone: string; org?: string };
  prevOrderId?: string | null; // the buyer's previous hold to release (changing seats)
};
export type HoldResult =
  | { ok: true; orderId: string; heldUntil: number; total: number } // heldUntil: epoch ms
  | { ok: false; error: string; lost?: string[] }; // lost: seats someone else took first

export type SubmitResult = { ok: true; code: string; paidAt: number } | { ok: false; error: string }; // paidAt: epoch ms

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

const SALE_TIERS = ["Platinum", "Gold", "Silver", "Bronze"];
const PROOF_EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "application/pdf": "pdf" };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CODE = /^[A-HJ-NP-Z2-9]{5}$/;
const BUCKET = "payment-proofs";

const GENERIC = "Maaf, ada gangguan di sistem kami. Coba lagi sebentar lagi ya.";
const EXPIRED = "Waktu pembayaran habis dan kursimu sudah dilepas. Pilih kursi lagi ya.";

type DbError = { message: string; details?: string | null };
const fail = (error: string) => ({ ok: false as const, error });
function logError(where: string, e: unknown) {
  console.error(`[checkout] ${where}`, e);
}

export async function holdSeats(input: HoldInput): Promise<HoldResult> {
  const i = (input ?? {}) as Partial<HoldInput>;
  if (typeof i.show !== "string" || !isShowId(i.show)) return fail("Show tidak ditemukan.");
  if (typeof i.tier !== "string" || !SALE_TIERS.includes(i.tier)) return fail("Kategori tiket tidak tersedia.");
  const seats = i.seats;
  if (!Array.isArray(seats) || seats.length < 1 || seats.length > 4) return fail("Pilih 1 sampai 4 kursi.");
  if (new Set(seats).size !== seats.length) return fail("Ada kursi yang dipilih dua kali.");
  // SEATS has VIP seats too, but their tier is "VIP", which is never a sale tier, so this rejects them.
  if (!seats.every((id) => typeof id === "string" && SEATS[id]?.tier === i.tier)) return fail("Semua kursi harus dari kategori tiket yang sama.");
  const buyer = validateBuyer(i.buyer);
  if (!buyer.ok) return buyer;
  const prev = typeof i.prevOrderId === "string" && UUID.test(i.prevOrderId) ? i.prevOrderId : null;

  try {
    const { data, error } = await supabase()
      .rpc("hold_seats", {
        p_show: Number(i.show),
        p_tier: i.tier,
        p_seats: seats,
        p_name: buyer.buyer.name,
        p_email: buyer.buyer.email,
        p_phone: buyer.buyer.phone,
        p_org: buyer.buyer.org,
        p_prev_order: prev,
      })
      .single<{ order_id: string; held_until: string; total: number }>();
    if (error) return holdError(error);
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
  if (e.message === "QUOTA_FULL") return fail("Kuota kategori ini sudah habis. Kembali dan pilih kategori lain ya.");
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
