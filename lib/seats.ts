// Makara Art Center seating plan (hand-drawn plan, 400 seats per show).
// Stage on top, row A nearest. Seats are numbered right to left: the rightmost seat of the
// right wing is 1, the leftmost seat of the left wing is the last number in the row.
import type { ShowId, Tier } from "./event";

export const ROWS = "ABCDEFGHIJKLMNO".split("");
const CENTER: Record<string, number> = { A: 10, B: 13, C: 13, D: 13, E: 12, F: 13, G: 13, H: 14, I: 15, J: 16, K: 16, L: 17, M: 18, N: 20, O: 19 };
const SIDE: Record<string, number> = { A: 6, B: 6, C: 6, D: 6, E: 6, F: 7, G: 7, H: 7, I: 7, J: 6, K: 6, L: 6, M: 5, N: 5, O: 3 };
export const MAX_SIDE = 7;
export const MAX_CENTER = 20;

export type Seat = { id: string; row: string; number: number; tier: Tier };
export type SeatRow = { row: string; left: Seat[]; center: Seat[]; right: Seat[] };

const centerTier = (r: string): Tier => ("ABCDG".includes(r) ? "Tipe 1" : "EF".includes(r) ? "VIP" : "Tipe 2");
const sideTier = (r: string): Tier => ("ABCDEFG".includes(r) ? "Tipe 3" : "Tipe 4");

// Seats in each block are listed in visual order (left → right), so numbers descend.
function block(row: string, count: number, start: number, tier: Tier): Seat[] {
  return Array.from({ length: count }, (_, i) => ({ id: row + (start - i), row, number: start - i, tier }));
}

export const SEAT_ROWS: SeatRow[] = ROWS.map((r) => {
  const s = SIDE[r], c = CENTER[r];
  return {
    row: r,
    left: block(r, s, 2 * s + c, sideTier(r)),
    center: block(r, c, s + c, centerTier(r)),
    right: block(r, s, s, sideTier(r)),
  };
});

export const SEATS: Record<string, Seat> = Object.fromEntries(
  SEAT_ROWS.flatMap((r) => [...r.left, ...r.center, ...r.right]).map((s) => [s.id, s]),
);

// ponytail: deterministic fake occupancy for the mockup; replace with seat status from the backend.
export function isTaken(seat: Seat, show: ShowId): boolean {
  if (seat.tier === "VIP") return false;
  return (seat.row.charCodeAt(0) * 131 + seat.number * 977 + (show === "2" ? 53 : 0)) % 101 < 23;
}

export function seatsLeft(show: ShowId): number {
  return Object.values(SEATS).filter((s) => s.tier !== "VIP" && !isTaken(s, show)).length;
}
