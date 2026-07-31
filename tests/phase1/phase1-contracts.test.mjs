import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function findFiles(dir, predicate) {
  const absolute = path.join(root, dir);
  if (!fs.existsSync(absolute)) return [];
  const output = [];
  for (const entry of fs.readdirSync(absolute, { withFileTypes: true })) {
    const relative = path.join(dir, entry.name);
    if (entry.isDirectory()) output.push(...findFiles(relative, predicate));
    else if (predicate(relative)) output.push(relative);
  }
  return output;
}

test("Phase 1 has Clerk authentication wiring", () => {
  const candidates = findFiles("app", (file) => /\.(ts|tsx)$/.test(file));
  const sources = candidates.map(read).join("\n");
  assert.match(sources, /ClerkProvider|@clerk\/nextjs/);
});

test("Phase 1 exposes admin authorization controls", () => {
  const candidates = [
    ...findFiles("app", (file) => /\.(ts|tsx)$/.test(file)),
    ...findFiles("components", (file) => /\.(ts|tsx)$/.test(file)),
    ...findFiles("convex", (file) => /\.ts$/.test(file) && !file.includes("_generated")),
  ];
  const sources = candidates.map(read).join("\n");
  assert.match(sources, /admin/i);
  assert.match(sources, /role|permission|authorize|forbidden/i);
});

test("Phase 1 contains secure PDF ingestion and citation retrieval", () => {
  const candidates = [
    ...findFiles("app", (file) => /\.(ts|tsx)$/.test(file)),
    ...findFiles("components", (file) => /\.(ts|tsx)$/.test(file)),
    ...findFiles("convex", (file) => /\.ts$/.test(file) && !file.includes("_generated")),
  ];
  const sources = candidates.map(read).join("\n");
  assert.match(sources, /pdf/i);
  assert.match(sources, /citation|registry|chunk|ingestion/i);
});

test("Phase 1 contains audit or processing ledger semantics", () => {
  const candidates = findFiles("convex", (file) => /\.ts$/.test(file) && !file.includes("_generated"));
  const sources = candidates.map(read).join("\n");
  assert.match(sources, /audit|ledger|processing|quarantine|rollback/i);
});

test("CI includes the Phase 1 validation command", () => {
  assert.ok(exists(".github/workflows/ci.yml"));
  assert.match(read(".github/workflows/ci.yml"), /test:phase1/);
});
