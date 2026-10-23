import assert from "node:assert/strict";
import test from "node:test";
import { normalizeReferralCode, referralPrice } from "./referral.ts";

test("normalizeReferralCode trims and uppercases", () => {
  assert.equal(normalizeReferralCode("  nemubarengan "), "NEMUBARENGAN");
  assert.equal(normalizeReferralCode("NemuBarengan"), "NEMUBARENGAN");
  assert.equal(normalizeReferralCode("   "), "");
});

test("referralPrice takes Rp5.000 off the active price", () => {
  assert.equal(referralPrice(50000), 45000);
  assert.equal(referralPrice(45000), 40000);
  assert.equal(referralPrice(40000), 35000);
  assert.equal(referralPrice(35000), 30000);
});

test("referralPrice never goes negative and keeps null as not-on-sale", () => {
  assert.equal(referralPrice(3000), 0);
  assert.equal(referralPrice(null), null);
  assert.equal(referralPrice(50000, 0), 50000);
});
