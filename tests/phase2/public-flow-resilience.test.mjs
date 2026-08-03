import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../..", import.meta.url);

test("guest landing is distinct from the signed-in dashboard", async () => {
  const page = await readFile(new URL("app/page.tsx", root), "utf8");
  const landing = await readFile(new URL("components/home/guest-landing.tsx", root), "utf8");

  assert.match(page, /GuestLanding/);
  assert.match(page, /router\.replace\("\/dashboard"\)/);
  assert.doesNotMatch(page, /redirect\("\/dashboard"\)/);
  assert.match(landing, /مسیر ساده و قابل اعتماد برای آمادگی آزمون نظام مهندسی/);
  assert.match(landing, /شروع تمرین سؤال/);
  assert.match(landing, /مشاهده منابع رسمی/);
});

test("public archive never waits indefinitely for auth and analytics stays distinct", async () => {
  const exam = await readFile(new URL("components/exam/exam-center.tsx", root), "utf8");

  assert.doesNotMatch(exam, /if \(isLoading\) return/);
  assert.match(exam, /برای تحلیل عملکرد وارد شوید/);
  assert.match(exam, /مشاهده آرشیو رسمی آزمون‌ها/);
});

test("readiness does not present a fixed pass probability as production data", async () => {
  const prediction = await readFile(new URL("app/prediction/page.tsx", root), "utf8");

  assert.match(prediction, /تا زمانی که سابقه مطالعه و آزمون کافی ثبت نشده باشد/);
  assert.match(prediction, /شاخص آمادگی/);
  assert.doesNotMatch(prediction, /label="احتمال قبولی"/);
});
