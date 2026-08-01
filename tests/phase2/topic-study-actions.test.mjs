import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../..", import.meta.url);

test("topic study actions are real links instead of inert development cards", async () => {
  const detail = await readFile(new URL("components/library/topic-detail.tsx", root), "utf8");

  assert.match(detail, /مشاهده PDF مبحث/);
  assert.match(detail, /href: `\/ai\?topic=/);
  assert.match(detail, /href: `\/exam\?topic=/);
  assert.match(detail, /href: `\/analytics\?topic=/);
  assert.doesNotMatch(detail, /<StatusBadge tone="info">در حال توسعه<\/StatusBadge>/);
});

test("recent official topic questions are public and open their exact source", async () => {
  const detail = await readFile(new URL("components/library/topic-detail.tsx", root), "utf8");
  const access = await readFile(new URL("convex/examAccess.ts", root), "utf8");

  assert.match(access, /export const recentQuestionsForTopic = query/);
  assert.match(access, /assertPublicCapability\("official_content\.read"\)/);
  assert.match(access, /document\.status !== "verified"/);
  assert.doesNotMatch(access, /recentQuestionsForTopic[\s\S]*CAPABILITY_PREMIUM_REQUIRED/);
  assert.match(detail, /setShowQuestionAnalysis\(\(visible\) => !visible\)/);
  assert.match(detail, /Array\.isArray\(recentQuestionSignals\)/);
  assert.match(detail, /recentQuestionSignals\?\.questions \?\? \[\]/);
  assert.match(detail, /sourcePageUrl\(question\.sourceUrl, question\.sourcePage\)/);
  assert.match(detail, /مشاهده سؤال رسمی/);
});
