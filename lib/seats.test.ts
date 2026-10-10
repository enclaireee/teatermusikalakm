// Run: node --experimental-strip-types --test lib/seats.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { SEATS, SEAT_ROWS } from "./seats.ts";

test("400 seats per show", () => {
  assert.equal(Object.keys(SEATS).length, 400);
});

test("numbered right to left", () => {
  const c = SEAT_ROWS.find((r) => r.row === "C")!;
  assert.equal(c.right.at(-1)!.id, "C1"); // rightmost seat
  assert.equal(c.left[0]!.id, "C25"); // leftmost seat is the last number
  assert.deepEqual([c.center[0]!.number, c.center.at(-1)!.number], [19, 7]);
});

test("tiers follow the plan", () => {
  assert.equal(SEATS.C9!.tier, "Platinum");
  assert.equal(SEATS.E10!.tier, "VIP");
  assert.equal(SEATS.H1!.tier, "Bronze");
  assert.equal(SEATS.A1!.tier, "Silver");
  assert.equal(SEATS.O10!.tier, "Gold");
});
