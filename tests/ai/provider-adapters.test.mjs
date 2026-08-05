import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const adapterPath = path.join(root, "convex/lib/aiAdapterContract.ts");
const source = fs.readFileSync(adapterPath, "utf8");

test("production adapters use only deployment environment credentials", () => {
  for (const name of [
    "OPENAI_API_KEY",
    "GEMINI_API_KEY",
    "ANTHROPIC_API_KEY",
  ]) {
    assert.match(source, new RegExp(name));
  }
  assert.doesNotMatch(source, /sk-[A-Za-z0-9_-]{20,}/);
  assert.doesNotMatch(source, /AIza[A-Za-z0-9_-]{20,}/);
  assert.doesNotMatch(source, /sk-ant-[A-Za-z0-9_-]{20,}/);
});

test("provider model names are resolved from an alias allowlist", () => {
  assert.match(source, /AI_MODEL_ALIAS_NOT_ALLOWED/);
  assert.match(source, /OPENAI_MODEL_PRIMARY/);
  assert.match(source, /GEMINI_MODEL_FALLBACK/);
  assert.match(source, /ANTHROPIC_MODEL_PREMIUM/);
});

test("provider calls remain fail closed without pricing configuration", () => {
  assert.match(source, /AI_ADAPTER_NOT_CONFIGURED/);
  assert.match(source, /AI_PROVIDER_PRICING_INVALID/);
  assert.match(source, /MICROUSD_PER_1M_TOKENS/g);
  assert.match(source, /calculateCostMicrousd/);
});

test("raw prompts are not logged or persisted by adapters", () => {
  assert.doesNotMatch(source, /console\.(log|info|debug|warn|error)/);
  assert.doesNotMatch(source, /JSON\.stringify\([^)]*prompt[^)]*\)/i);
});

test("provider HTTP failures are normalized and retry bounded", () => {
  assert.match(source, /AI_PROVIDER_HTTP_/);
  assert.match(source, /AI_PROVIDER_TIMEOUT/);
  assert.match(source, /AI_PROVIDER_NETWORK_FAILURE/);
  assert.match(source, /status === 429/);
  assert.match(source, /status >= 500/);
});

test("tool calls fail closed until provider tool mapping is implemented", () => {
  assert.match(source, /AI_PROVIDER_TOOLS_NOT_IMPLEMENTED/);
  assert.match(source, /requestedTools\.length > 0/);
});
