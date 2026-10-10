"use server";

// Admin server actions. Each one checks the admin session itself (server actions are public POST endpoints)
// and treats every argument as untrusted.
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { adminConfigured, checkLogin, endSession, requireAdmin, startSession, UUID } from "@/lib/admin";
import { RATE_LIMITED, rateLimited } from "@/lib/rate-limit";
import { supabase } from "@/lib/supabase";
import { validateBuyer, type BuyerInput } from "@/lib/validate";

export type AdminResult = { ok: true } | { ok: false; error: string };
export type LoginState = { error?: string };

const fail = (error: string) => ({ ok: false as const, error });
const GENERIC = "Gagal menyimpan. Coba lagi.";
const NOT_FOUND = "Pesanan tidak ditemukan.";

// Message and code only: Postgres error details can echo buyer data.
function logError(where: string, e: unknown) {
  const { message, code } = (e ?? {}) as { message?: string; code?: string };
  console.error(`[admin] ${where}`, code ?? "", message ?? String(e));
}

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const user = formData.get("user");
  const password = formData.get("password");
  if (!adminConfigured()) return { error: "Login admin belum diatur (ADMIN_USER / ADMIN_PASSWORD, lihat backend.md)." };
  // Counts every attempt, before the password check: parallel requests would otherwise skip the delay below.
  if (await rateLimited("login")) return { error: RATE_LIMITED };
  if (typeof user !== "string" || typeof password !== "string" || !checkLogin(user, password)) {
    await new Promise((r) => setTimeout(r, 1000)); // slows guessing a little
    return { error: "Username atau password salah." };
  }
  await startSession();
  redirect("/admin");
}

export async function logout() {
  await endSession();
  redirect("/admin/login");
}

/** Admin-only review mark. null = not reviewed, true = valid, false = not valid. Buyers never see it. */
export async function setChecked(id: string, checked: boolean | null): Promise<AdminResult> {
  await requireAdmin();
  if (typeof id !== "string" || !UUID.test(id)) return fail(NOT_FOUND);
  if (checked !== null && typeof checked !== "boolean") return fail(GENERIC);
  return save("setChecked", supabase().from("orders").update({ checked }).eq("id", id).neq("status", "held").select("id"));
}

/** D-day: the buyer picked up the physical ticket (backend.md step 10). Only valid orders can be claimed. */
export async function setClaimed(id: string, claimed: boolean): Promise<AdminResult> {
  await requireAdmin();
  if (typeof id !== "string" || !UUID.test(id)) return fail(NOT_FOUND);
  if (typeof claimed !== "boolean") return fail(GENERIC);
  const q = supabase().from("orders").update({ claimed_at: claimed ? new Date().toISOString() : null }).eq("id", id);
  return save("setClaimed", (claimed ? q.eq("status", "valid") : q.neq("status", "held")).select("id"));
}

export async function updateBuyer(id: string, buyer: BuyerInput): Promise<AdminResult> {
  await requireAdmin();
  if (typeof id !== "string" || !UUID.test(id)) return fail(NOT_FOUND);
  const v = validateBuyer(buyer);
  if (!v.ok) return v;
  const { name, email, phone, org } = v.buyer;
  return save(
    "updateBuyer",
    supabase()
      .from("orders")
      .update({ buyer_name: name, buyer_email: email, buyer_phone: phone, buyer_org: org || null })
      .eq("id", id)
      .neq("status", "held")
      .select("id"),
  );
}

/** Move the order to other seats: same show, same ticket category, same count (see move_seats in backend.md). */
export async function moveSeats(id: string, seats: string[]): Promise<AdminResult> {
  await requireAdmin();
  if (typeof id !== "string" || !UUID.test(id)) return fail(NOT_FOUND);
  if (!Array.isArray(seats) || seats.length < 1 || seats.length > 4 || !seats.every((s) => typeof s === "string")) {
    return fail("Pilih kursi pengganti.");
  }
  try {
    const { error } = await supabase().rpc("move_seats", { p_order: id, p_seats: seats });
    if (error) {
      if (error.message === "SEATS_TAKEN") return fail(`Kursi ${error.details ?? ""} sudah terisi. Pilih kursi lain.`);
      if (error.message === "BAD_SEATS") return fail("Jumlah dan kategori kursi harus sama dengan pesanan.");
      if (error.message === "ORDER_NOT_FOUND" || error.message === "ORDER_NOT_PAID") return fail(NOT_FOUND);
      throw error;
    }
  } catch (e) {
    logError("moveSeats", e);
    return fail(GENERIC);
  }
  refresh();
  return { ok: true };
}

/** The manual presale switch (backend.md step 8). Changes prices and quotas on the public site immediately. */
export async function setPresale(on: boolean): Promise<AdminResult> {
  await requireAdmin();
  if (typeof on !== "boolean") return fail(GENERIC);
  return save("setPresale", supabase().from("settings").update({ presale: on }).eq("id", true).select("id"));
}

export type ProofResult = { ok: true; url: string; kind: "image" | "pdf" } | { ok: false; error: string };

/** Short-lived signed URL for an order's payment proof, fetched when the viewer opens. */
export async function proofLink(id: string): Promise<ProofResult> {
  await requireAdmin();
  if (typeof id !== "string" || !UUID.test(id)) return fail(NOT_FOUND);
  try {
    const db = supabase();
    const { data, error } = await db.from("orders").select("proof_path").eq("id", id).neq("status", "held").maybeSingle<{ proof_path: string | null }>();
    if (error) throw error;
    if (!data?.proof_path) return fail("Belum ada bukti pembayaran.");
    const { data: signed, error: signErr } = await db.storage.from("payment-proofs").createSignedUrl(data.proof_path, 10 * 60);
    if (signErr) throw signErr;
    // Stored as {show}/{order}.{jpg|png|pdf} with a sniffed type (submitPayment), so the extension is trustworthy.
    return { ok: true, url: signed.signedUrl, kind: data.proof_path.endsWith(".pdf") ? "pdf" : "image" };
  } catch (e) {
    logError("proofLink", e);
    return fail("Gagal memuat bukti. Coba lagi.");
  }
}

/** Deletes the order and its payment proof; its seats become free again (delete_order in backend.md). */
export async function deleteOrder(id: string): Promise<AdminResult> {
  await requireAdmin();
  if (typeof id !== "string" || !UUID.test(id)) return fail(NOT_FOUND);
  try {
    const db = supabase();
    const { data: proof, error } = await db.rpc("delete_order", { p_order: id });
    if (error) {
      if (error.message === "ORDER_NOT_FOUND") return fail(NOT_FOUND);
      throw error;
    }
    if (typeof proof === "string") {
      // The order is already gone; a leftover file is harmless, so only log it.
      const { error: rmErr } = await db.storage.from("payment-proofs").remove([proof]);
      if (rmErr) logError(`remove proof ${proof}`, rmErr);
    }
  } catch (e) {
    logError("deleteOrder", e);
    return fail("Gagal menghapus. Coba lagi.");
  }
  redirect("/admin");
}

async function save(where: string, query: PromiseLike<{ data: unknown[] | null; error: unknown }>): Promise<AdminResult> {
  try {
    const { data, error } = await query;
    if (error) throw error;
    if (!data?.length) return fail(NOT_FOUND);
  } catch (e) {
    logError(where, e);
    return fail(GENERIC);
  }
  refresh();
  return { ok: true };
}
