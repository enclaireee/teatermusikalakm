// Run: node --experimental-strip-types --test lib/network.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { network } from "./network.ts";

test("IPv4 is kept as is, IPv4-mapped IPv6 is unwrapped", () => {
  assert.equal(network(" 203.0.113.7 "), "203.0.113.7");
  assert.equal(network("::ffff:203.0.113.7"), "203.0.113.7");
});

test("IPv6 addresses in one /64 share a key", () => {
  const k = "2001:db8:aa:1::/64";
  assert.equal(network("2001:db8:aa:1::1"), k);
  assert.equal(network("2001:0DB8:00aa:0001:ffff:1:2:3"), k);
  assert.equal(network("2001:db8:aa:1:dead:beef::9"), k);
  assert.notEqual(network("2001:db8:aa:2::1"), k);
  assert.equal(network("2001:db8::1"), "2001:db8:0:0::/64");
  assert.equal(network("::1"), "0:0:0:0::/64");
});
