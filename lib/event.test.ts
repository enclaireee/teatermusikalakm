// Run: node --experimental-strip-types --test lib/*.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { SALE_TIERS, TIERS, formatRupiah } from "./event.ts";

test("formatRupiah handles unknown prices", () => {
  assert.equal(formatRupiah(null), "Rp —");
  assert.equal(formatRupiah(0), "Rp0");
});

test("VIP is never a sale tier", () => {
  assert.equal(SALE_TIERS.includes("VIP"), false);
  assert.equal(SALE_TIERS.length, 4);
  assert.equal(TIERS.VIP.title, "Tamu undangan");
});
