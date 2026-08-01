import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (relativePath) =>
  fs.readFileSync(path.join(root, relativePath), "utf8");

test("central capability keys preserve public official-content access", () => {
  const client = read("lib/access/capabilities.ts");
  const server = read("convex/lib/entitlements.ts");
  for (const source of [client, server]) {
    assert.match(source, /"official_content\.read"/);
    assert.match(source, /"content\.filter"/);
    assert.match(source, /"ai\.chat"/);
  }
  assert.match(client, /tier === "free" && capability === "ai\.chat"/);
  assert.match(server, /tier === "free" && capability === "ai\.chat"/);
});

test("server enforcement protects AI and explicitly preserves public archives", () => {
  const gateway = read("convex/aiGateway.ts");
  const archives = read("convex/examAccess.ts");
  assert.match(gateway, /requireCapability\([\s\S]*gatewayCapabilityToEntitlement/);
  assert.match(archives, /assertPublicCapability\("official_content\.read"\)/);
  assert.match(archives, /assertPublicCapability\("content\.filter"\)/);
});

test("AI client uses the shared capability policy before creating an intent", () => {
  const page = read("app/ai/page.tsx");
  const access = read("convex/access.ts");
  assert.match(page, /accessTierForRole/);
  assert.match(page, /canAccessCapability\(tier, "ai\.chat"\)/);
  assert.match(page, /api\.access\.current/);
  assert.match(access, /getEntitlementContext/);
  assert.match(access, /aiChat: allowed\.has\("ai\.chat"\)/);
});
