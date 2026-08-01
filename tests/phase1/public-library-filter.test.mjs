import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "../..");
const source = fs.readFileSync(path.join(root, "components/library/library-dashboard.tsx"), "utf8");
const topics = fs.readFileSync(path.join(root, "convex/topics.ts"), "utf8");

test("public library exposes a free persisted qualification filter", () => {
  assert.match(source, /civilmind\.guest-library-filter\.v1/);
  assert.match(source, /window\.localStorage\.setItem/);
  assert.match(source, /فیلتر منابع رسمی رایگان است/);
  assert.match(source, /aria-pressed/);
});

test("active topics stay publicly queryable and sourced by direct official links", () => {
  assert.match(topics, /export const listActive/);
  assert.match(topics, /by_isActive_and_order/);
  assert.match(source, /مشاهده در منبع رسمی/);
});
