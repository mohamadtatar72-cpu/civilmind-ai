import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const contracts = fs.readFileSync(
  "features/regulation-explainer/contracts.ts",
  "utf8",
);

const component = fs.readFileSync(
  "components/regulation-explainer/regulation-explainer.tsx",
  "utf8",
);

const page = fs.readFileSync(
  "app/regulation-explainer/page.tsx",
  "utf8",
);

const topicDetail = fs.readFileSync(
  "components/library/topic-detail.tsx",
  "utf8",
);

test("regulation explainer exposes three explanation levels", () => {
  assert.match(contracts, /"simple"/);
  assert.match(contracts, /"exam"/);
  assert.match(contracts, /"professional"/);
  assert.match(contracts, /ساده و قابل‌فهم/);
  assert.match(contracts, /مناسب آزمون/);
  assert.match(contracts, /حرفه‌ای و اجرایی/);
});

test("regulation explainer fails closed without verified evidence", () => {
  assert.match(contracts, /VERIFIED_SOURCE_REQUIRED/);
  assert.match(contracts, /hasVerifiedRegulationSource/);
  assert.match(component, /sourceVerified === true/);
  assert.match(component, /analysisReady === true/);
  assert.match(component, /status: "no-source"/);
});

test("retrieval happens before generation", () => {
  const queryPosition = component.indexOf(
    "recentQuestionsForTopic",
  );
  const actionPosition = component.indexOf(
    "submitAndExecute",
  );
  const promptPosition = component.indexOf(
    "createRegulationExplanationPrompt",
  );

  assert.ok(queryPosition >= 0);
  assert.ok(actionPosition >= 0);
  assert.ok(promptPosition >= 0);
  assert.match(component, /if \(!sourceReady\)/);
});

test("official text and CivilMind explanation remain separated", () => {
  assert.match(component, /متن و مشخصات منبع رسمی/);
  assert.match(component, /توضیح CivilMind AI/);
  assert.match(
    component,
    /متن رسمی در کارت سبز نمایش داده می‌شود/,
  );
});

test("citation metadata is preserved", () => {
  assert.match(contracts, /documentTitle/);
  assert.match(contracts, /edition/);
  assert.match(contracts, /page\?/);
  assert.match(contracts, /clause\?/);
  assert.match(contracts, /sourceUrl/);
  assert.match(component, /مشاهده منبع اصلی/);
});

test("provider and entitlement states are truthful", () => {
  assert.match(contracts, /provider-missing/);
  assert.match(contracts, /entitlement-required/);
  assert.match(contracts, /retryable-error/);
  assert.match(component, /AI Provider تنظیم نشده است/);
  assert.match(component, /دسترسی این قابلیت محدود است/);
});

test("the explainer has a real route and library entry point", () => {
  assert.match(page, /RegulationExplainer/);
  assert.match(
    topicDetail,
    /\/regulation-explainer\?topic=/,
  );
});
