import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../..", import.meta.url);

test("AI flow retrieves and renders source citations without fabricating an answer", async () => {
  const page = await readFile(new URL("app/ai/page.tsx", root), "utf8");

  assert.match(page, /api\.pdfLibrary\.searchWithCitations/);
  assert.match(page, /setCitations\(retrieval\.citations/);
  assert.match(page, /منابع بازیابی‌شده/);
  assert.match(page, /بدون منبع، پاسخی به‌عنوان پاسخ/);
  assert.match(page, /href=\{`\/library\/\$\{citation\.documentId\}`\}/);
});
