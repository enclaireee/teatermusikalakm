// Run: node --experimental-strip-types --test lib/*.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { PRICE_PLACEHOLDER, tierPriceLabel, totalLabel, totalPrice } from "./event.ts";

test("VIP has no price and does not count toward the total", () => {
  assert.equal(tierPriceLabel("VIP"), null);
  assert.equal(tierPriceLabel("Tipe 1"), PRICE_PLACEHOLDER);
  assert.equal(totalPrice(["VIP", "VIP"]), 0);
  assert.equal(totalLabel(["VIP", "VIP"]), "—");
  assert.equal(totalLabel(["VIP", "Tipe 2"]), PRICE_PLACEHOLDER); // paid prices still unknown
});
