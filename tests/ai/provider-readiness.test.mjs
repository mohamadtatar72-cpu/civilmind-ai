import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const readinessPath = path.join(root, "convex/aiProviderReadiness.ts");
const source = fs.readFileSync(readinessPath, "utf8");

test("provider readiness refresh is admin-gated", () => {
  assert.match(source, /api\.aiGateway\.adminListProviders/);
  assert.match(source, /adminRefreshProviderReadiness/);
});

test("provider readiness is derived from deployment configuration", () => {
  assert.match(source, /getProviderAdapterReadiness/);
  assert.match(source, /missingEnvironmentVariables/);
});

test("provider registry is reconciled fail closed", () => {
  assert.match(source, /internal\.aiGateway\.internalSetAdapterReady/);
  assert.match(source, /ready: provider\.configured/);
});

test("readiness endpoint never returns secret values", () => {
  assert.doesNotMatch(source, /apiKey\s*:/i);
  assert.doesNotMatch(source, /process\.env\s*\[/);
  assert.doesNotMatch(source, /OPENAI_API_KEY|GEMINI_API_KEY|ANTHROPIC_API_KEY/);
});
