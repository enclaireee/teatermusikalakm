// Event facts (from the DESIGN page proposals) and ticket rules shared by every screen.

export const EVENT = {
  name: "Aku Kau & Musik",
  fullName: "Teater Musikal Aku Kau & Musik",
  theme: "Harmoni Asa dan Musik",
  presentedBy: "Presented by Juzzer × Stage Universitas Indonesia",
  date: "Kamis, 29 Oktober 2026",
  dateShort: "Kamis, 29 Okt 2026",
  venue: "Makara Art Center UI, Depok",
  venueShort: "Makara Art Center UI",
} as const;

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000")
).replace(/\/+$/, "");

export const CONTACT = {
  instagram: "@stage.ui",
  tiktok: "@stage.ui",
  email: "stagepromedui@gmail.com",
  persons: [
    { name: "Danisa", phone: "0817250310", line: "@danisaarch" },
    { name: "Panji", phone: "081382821069", line: "@panjizigi" },
  ],
} as const;

export type ShowId = "1" | "2";

export const SHOWS: Record<ShowId, { id: ShowId; label: string; time: string; start: string }> = {
  "1": { id: "1", label: "Show 1", time: "15.00 – 17.00", start: "15.00" },
  "2": { id: "2", label: "Show 2", time: "19.00 – 21.00", start: "19.00" },
};

export const isShowId = (v: string): v is ShowId => v === "1" || v === "2";

export type Tier = "Platinum" | "Gold" | "Silver" | "Bronze" | "VIP";

// Prices live in the database and come from /api/show/[show]; VIP seats are never sold.
export const TIERS: Record<Tier, { title: string; rows: string }> = {
  "Platinum": { title: "Tengah depan", rows: "Baris A–D & G" },
  "Gold": { title: "Tengah belakang", rows: "Baris H–O" },
  "Silver": { title: "Sayap depan", rows: "Baris A–G kiri & kanan" },
  "Bronze": { title: "Sayap belakang", rows: "Baris H–O kiri & kanan" },
  VIP: { title: "Tamu undangan", rows: "Baris E–F tengah" },
};

export const SALE_TIERS: Tier[] = ["Platinum", "Gold", "Silver", "Bronze"];
export const MAX_TICKETS = 10;
export const HOLD_MINUTES = 10;
export const MAX_PROOF_BYTES = 1024 * 1024;
export const MAX_PROOF_INPUT_BYTES = 15 * 1024 * 1024; // largest image accepted before client-side compression
export const PROOF_TYPES = ["image/jpeg", "image/png", "application/pdf"];

export const BANK = { name: "Blu by BCA", account: "0024 2879 9648", holder: "Hana Dwi Lathifah" } as const;

export function formatRupiah(amount: number | null): string {
  return amount === null ? "Rp —" : "Rp" + amount.toLocaleString("id-ID");
}
