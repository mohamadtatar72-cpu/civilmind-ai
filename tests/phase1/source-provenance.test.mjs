import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "../..");
const ui = fs.readFileSync(path.join(root, "components/official-sources/official-sources-dashboard.tsx"), "utf8");
const source = fs.readFileSync(path.join(root, "convex/officialResources.ts"), "utf8");

test("official sources expose verification and version-tracking provenance", () => {
  assert.match(ui, /آخرین تأیید/);
  assert.match(ui, /ردیابی نسخه/);
  assert.match(source, /lastVerifiedAt/);
  assert.match(source, /lastSyncStatus/);
});
