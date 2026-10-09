// Event facts (from the DESIGN page proposals) and ticket rules shared by every screen.

export const EVENT = {
  name: "Aku, Kau & Musik",
  fullName: "Teater Musikal Aku, Kau & Musik",
  theme: "Harmoni Asa dan Musik",
  presentedBy: "Presented by Juzzer × Stage Universitas Indonesia",
  date: "Kamis, 29 Oktober 2026",
  dateShort: "Kamis, 29 Okt 2026",
  venue: "Makara Art Center UI, Depok",
  venueShort: "Makara Art Center UI",
} as const;

export const CONTACT = {
  instagram: "@stage.ui",
  tiktok: "@stage.ui",
  email: "stagepromedui@gmail.com",
  whatsapp: "0859-0001-8942",
  whatsappName: "Hana",
} as const;

export type ShowId = "1" | "2";

export const SHOWS: Record<ShowId, { id: ShowId; label: string; time: string; start: string }> = {
  "1": { id: "1", label: "Show 1", time: "15.00 – 17.00", start: "15.00" },
  "2": { id: "2", label: "Show 2", time: "19.00 – 21.00", start: "19.00" },
};

export const isShowId = (v: string): v is ShowId => v === "1" || v === "2";

export type Tier = "Tipe 1" | "Tipe 2" | "Tipe 3" | "Tipe 4" | "VIP";

// ponytail: prices are null until the committee confirms them; formatRupiah shows the placeholder.
// VIP seats are invitation-only: no price is ever shown and they never count toward a total.
export const TIERS: Record<Tier, { title: string; rows: string; price: number | null; invite?: true }> = {
  "Tipe 1": { title: "Tengah depan", rows: "Baris A–D & G", price: null },
  "Tipe 2": { title: "Tengah belakang", rows: "Baris H–O", price: null },
  "Tipe 3": { title: "Sayap depan", rows: "Baris A–G kiri & kanan", price: null },
  "Tipe 4": { title: "Sayap belakang", rows: "Baris H–O kiri & kanan", price: null },
  VIP: { title: "Tamu undangan", rows: "Baris E–F tengah", price: null, invite: true },
};

export const PRICE_PLACEHOLDER = "Rp XX.XXX";
export const MAX_TICKETS = 4;
export const HOLD_MINUTES = 10;
export const MAX_PROOF_BYTES = 5 * 1024 * 1024;
export const PROOF_TYPES = ["image/jpeg", "image/png", "application/pdf"];
// ponytail: mock invitation code; real validation moves to the backend phase.
export const INVITE_CODE = "AKM-VIP-2026";

export const BANK = { name: "Blu by BCA", account: "0024 2879 9648", holder: "Hana Dwi Lathifah" } as const;

export function formatRupiah(amount: number | null): string {
  if (amount === null) return PRICE_PLACEHOLDER;
  return "Rp" + amount.toLocaleString("id-ID");
}

/** Price text for one seat of a tier, or null when no price is shown (VIP). */
export function tierPriceLabel(tier: Tier): string | null {
  return TIERS[tier].invite ? null : formatRupiah(TIERS[tier].price);
}

/** Sum of paid tier prices (VIP ignored); null if any paid price is still unknown. */
export function totalPrice(tiers: Tier[]): number | null {
  let sum = 0;
  for (const t of tiers) {
    if (TIERS[t].invite) continue;
    const p = TIERS[t].price;
    if (p === null) return null;
    sum += p;
  }
  return sum;
}

/** Total text for an order: "—" when nothing in it is paid (e.g. VIP only). */
export function totalLabel(tiers: Tier[]): string {
  return tiers.some((t) => !TIERS[t].invite) ? formatRupiah(totalPrice(tiers)) : "—";
}
