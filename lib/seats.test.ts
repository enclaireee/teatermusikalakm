// Run: node --experimental-strip-types --test lib/seats.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { SEATS, SEAT_ROWS, isTaken } from "./seats.ts";

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
  assert.equal(SEATS.C9!.tier, "Tipe 1");
  assert.equal(SEATS.E10!.tier, "VIP");
  assert.equal(SEATS.H1!.tier, "Tipe 4");
  assert.equal(SEATS.A1!.tier, "Tipe 3");
  assert.equal(SEATS.O10!.tier, "Tipe 2");
  assert.equal(isTaken(SEATS.E10!, "1"), false);
});
