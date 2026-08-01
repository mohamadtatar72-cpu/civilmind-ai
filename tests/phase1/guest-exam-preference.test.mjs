import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "../..");
const source = fs.readFileSync(path.join(root, "components/exam/exam-center.tsx"), "utf8");
const access = fs.readFileSync(path.join(root, "convex/examAccess.ts"), "utf8");

test("guest exam archive keeps a local free discipline and qualification selection", () => {
  assert.match(source, /civilmind\.guest-exam-preference\.v1/);
  assert.match(source, /window\.localStorage\.setItem/);
  assert.match(source, /api\.examAccess\.listPublicArchive/);
  assert.match(source, /رشته و صلاحیت خود را انتخاب کنید/);
});

test("public exam archive is asserted as official content and free filtering", () => {
  assert.match(access, /assertPublicCapability\("official_content\.read"\)/);
  assert.match(access, /assertPublicCapability\("content\.filter"\)/);
  assert.doesNotMatch(access, /listPublicArchive[\s\S]{0,500}requirePremiumOrAdmin/);
});
