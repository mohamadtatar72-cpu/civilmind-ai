import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../..", import.meta.url);

test("AI flow retrieves and renders source citations without fabricating an answer", async () => {
  const page = await readFile(new URL("app/ai/page.tsx", root), "utf8");

  assert.match(page, /api\.pdfLibrary\.searchWithCitations/);
  assert.match(page, /if \(!account\.isAuthenticated\)/);
  assert.match(page, /setCitations\(retrieval\.citations/);
  assert.match(page, /منابع بازیابی‌شده/);
  assert.match(page, /بدون منبع، پاسخی به‌عنوان پاسخ/);
  assert.match(page, /href=\{`\/library\/\$\{citation\.documentId\}`\}/);
  assert.match(page, /نسخه \{citation\.documentVersion\}/);
  assert.match(page, /منبع رسمی/);
  assert.match(page, /منبع رسمی در صفحه/);
  assert.match(page, /استخراج از منبع رسمی/);
  assert.match(page, /تحلیل هوش مصنوعی/);
});

test("citation retrieval preserves guest access to public documents only", async () => {
  const library = await readFile(new URL("convex/pdfLibrary.ts", root), "utf8");

  assert.match(library, /const user = await getCurrentUser\(ctx\);/);
  assert.match(library, /eq\("visibility", "public"\)/);
  assert.match(library, /user && \(user\.role === "premium"/);
  assert.match(library, /documentVersion: document\.activeVersion/);
  assert.match(library, /officialSourceUrl:/);
  assert.match(library, /url\.hash = `page=\$\{pageNumber\}`/);
});

test("signed-in AI flow executes only after verified citation retrieval", async () => {
  const page = await readFile(new URL("app/ai/page.tsx", root), "utf8");

  assert.match(page, /useAction\(api\.aiRuntime\.submitAndExecute\)/);
  assert.match(page, /retrieval\.citations\.length === 0/);
  assert.match(page, /requestedTools: \["official-sources-search"\]/);
  assert.match(page, /توضیح CivilMind AI/);
  assert.match(page, /هیچ پاسخ ساختگی نمایش داده نمی‌شود/);
  assert.doesNotMatch(page, /createIntent\(/);
});

test("completed exam questions expose structured, truthfully labeled AI analysis", async () => {
  const center = await readFile(new URL("components/exam/exam-center.tsx", root), "utf8");

  assert.match(center, /useAction\(api\.aiRuntime\.submitAndExecute\)/);
  assert.match(center, /capability: "exam-analysis"/);
  assert.match(center, /requestedTools: \["exam-history-read", "topic-progress-read"\]/);
  assert.match(center, /دلیل درستی گزینه صحیح/);
  assert.match(center, /دلیل نادرستی هر گزینه دیگر/);
  assert.match(center, /هیچ بند، صفحه یا منبع رسمی اختراع نکن/);
  assert.match(center, /تحلیل غیررسمی/);
  assert.match(center, /پاسخ بالا «کلید رسمی آزمون» محسوب نمی‌شود/);
  assert.match(center, /پاسخ آموزشی و منابع رسمی همچنان رایگان می‌مانند/);
});
