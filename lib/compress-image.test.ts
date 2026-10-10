// Run: node --experimental-strip-types --test lib/*.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { targetSize } from "./compress-image.ts";

test("small image is unchanged", () => {
  assert.deepEqual(targetSize(800, 600), { w: 800, h: 600 });
});

test("2560x1440 scales to 1280 wide", () => {
  assert.deepEqual(targetSize(2560, 1440), { w: 1280, h: 720 });
});

test("tall screenshot is capped to 4 MP and keeps aspect ratio", () => {
  const { w, h } = targetSize(1290, 8000);
  assert.ok(w * h <= 4_000_000 * 1.001);
  assert.ok(w <= 1280);
  assert.ok(Math.abs(w / h - 1290 / 8000) < 0.01);
});
