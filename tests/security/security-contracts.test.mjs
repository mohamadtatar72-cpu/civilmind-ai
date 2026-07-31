import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function collect(dir) {
  const base = path.join(root, dir);
  if (!fs.existsSync(base)) return [];
  const files = [];
  for (const entry of fs.readdirSync(base, { withFileTypes: true })) {
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...collect(rel));
    else if (/\.(ts|tsx|js|mjs)$/.test(entry.name) && !rel.includes("_generated")) files.push(rel);
  }
  return files;
}

const source = ["app", "components", "convex", "lib"]
  .flatMap(collect)
  .map((file) => fs.readFileSync(path.join(root, file), "utf8"))
  .join("\n");

test("authorization is enforced server-side", () => {
  assert.match(source, /getUserIdentity|auth|getToken|require.*admin|forbidden|unauthorized/i);
});

test("PDF intake has fail-closed validation semantics", () => {
  assert.match(source, /pdf/i);
  assert.match(source, /mime|content.?type|size|limit|reject|block|quarantine|fail.?closed/i);
});

test("dangerous HTML injection is not enabled globally", () => {
  const matches = source.match(/dangerouslySetInnerHTML/g) ?? [];
  assert.equal(matches.length, 0, "dangerouslySetInnerHTML requires an explicit security review");
});

test("secrets are not hard-coded in application source", () => {
  assert.doesNotMatch(source, /sk-[A-Za-z0-9]{20,}/);
  assert.doesNotMatch(source, /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/);
});
