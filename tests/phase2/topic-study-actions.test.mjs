import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  VERIFIED_KHORDAD_1404_QUESTION,
  isVerifiedOfficialQuestionReady,
} from "../../convex/data/verifiedOfficialQuestions.mjs";

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

test("official-question AI analysis is gated by verified extraction readiness", async () => {
  const schema = await readFile(new URL("convex/schema.ts", root), "utf8");
  const access = await readFile(new URL("convex/examAccess.ts", root), "utf8");
  const detail = await readFile(new URL("components/library/topic-detail.tsx", root), "utf8");

  assert.match(schema, /officialCorrectIndex: v\.optional\(v\.number\(\)\)/);
  assert.match(schema, /officialAnswerSourceUrl: v\.optional\(v\.string\(\)\)/);
  assert.match(access, /analysisReady: isVerifiedOfficialQuestionReady\(row\)/);
  assert.match(detail, /capability: "exam-analysis"/);
  assert.match(detail, /هیچ صفحه، بند، آمار یا منبعی اختراع نکن/);
  assert.match(detail, /تحلیل AI پس از استخراج متن، گزینه‌ها و کلید رسمی فعال می‌شود/);
  assert.match(detail, /مشاهده سؤال و کلید رسمی رایگان است/);
});

test("one real Khordad 1404 official question is complete and analysis-ready", async () => {
  const archive = await readFile(new URL("convex/examArchives.ts", root), "utf8");
  const detail = await readFile(new URL("components/library/topic-detail.tsx", root), "utf8");

  assert.equal(VERIFIED_KHORDAD_1404_QUESTION.archiveKey, "inbr-khordad-1404");
  assert.equal(VERIFIED_KHORDAD_1404_QUESTION.questionNumber, 1);
  assert.equal(VERIFIED_KHORDAD_1404_QUESTION.sourcePage, 2);
  assert.equal(VERIFIED_KHORDAD_1404_QUESTION.options.length, 4);
  assert.equal(VERIFIED_KHORDAD_1404_QUESTION.officialCorrectIndex, 1);
  assert.match(VERIFIED_KHORDAD_1404_QUESTION.officialAnswerSourceUrl, /#page=13$/);
  assert.equal(isVerifiedOfficialQuestionReady(VERIFIED_KHORDAD_1404_QUESTION), true);
  assert.match(archive, /seedVerifiedKhordad1404Question = mutation/);
  assert.match(detail, /کلید رسمی: گزینه/);
  assert.match(detail, /متادیتای منبع تأییدشده/);
  assert.match(detail, /تحلیل CivilMind AI · غیررسمی و Premium/);
});

test("incomplete or unreviewed official records cannot enter AI analysis", () => {
  assert.equal(
    isVerifiedOfficialQuestionReady({
      ...VERIFIED_KHORDAD_1404_QUESTION,
      analysisStatus: "pending",
    }),
    false,
  );
  assert.equal(
    isVerifiedOfficialQuestionReady({
      ...VERIFIED_KHORDAD_1404_QUESTION,
      options: undefined,
    }),
    false,
  );
  assert.equal(
    isVerifiedOfficialQuestionReady({
      ...VERIFIED_KHORDAD_1404_QUESTION,
      officialCorrectIndex: undefined,
    }),
    false,
  );
});
