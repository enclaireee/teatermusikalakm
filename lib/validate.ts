// Buyer validation shared by the Data Diri form (per field) and the server actions (whole buyer).
// Pure: safe to import from client and server code.

export type BuyerField = "name" | "email" | "phone" | "org" | "agree";
export type BuyerValues = { name: string; email: string; phone: string; agree: boolean };
export type BuyerInput = { name: string; email: string; phone: string; org?: string };

const digits = (phone: string) => phone.replace(/\D/g, "");

/** Error message for one form field, or undefined when it is valid. */
export function checkField(k: BuyerField, v: BuyerValues): string | undefined {
  if (k === "name") return v.name.trim().length < 2 ? "Nama wajib diisi" : undefined;
  if (k === "email") return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email.trim()) ? undefined : "Format email belum benar, contoh: nama@email.com";
  if (k === "phone") {
    const p = v.phone.replace(/[\s-]/g, "");
    return /^(08|\+628)\d+$/.test(p) && digits(p).length >= 10 && digits(p).length <= 15 ? undefined : "Nomor WhatsApp belum valid, contoh: 0812-3456-7890";
  }
  if (k === "agree") return v.agree ? undefined : "Centang dulu untuk lanjut.";
}

// Length caps only matter for hand-crafted requests; the form never gets near them.
const MAX_LEN = { name: 100, email: 254, org: 100 };

/** Server-side check of a whole buyer: first error message, or the trimmed values to store. */
export function validateBuyer(b: unknown): { ok: true; buyer: Required<BuyerInput> } | { ok: false; error: string } {
  const o = (b ?? {}) as Record<string, unknown>;
  const str = (x: unknown) => (typeof x === "string" ? x.trim() : "");
  const buyer = { name: str(o.name), email: str(o.email), phone: str(o.phone).replace(/[\s-]/g, ""), org: str(o.org) };
  for (const k of ["name", "email", "phone"] as const) {
    const error = checkField(k, { ...buyer, agree: true });
    if (error) return { ok: false, error };
  }
  if (buyer.name.length > MAX_LEN.name) return { ok: false, error: "Nama terlalu panjang" };
  if (buyer.email.length > MAX_LEN.email) return { ok: false, error: "Email terlalu panjang" };
  if (buyer.org.length > MAX_LEN.org) return { ok: false, error: "Asal instansi terlalu panjang" };
  return { ok: true, buyer };
}
