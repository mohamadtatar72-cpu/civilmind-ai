import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const catalog = JSON.parse(
  fs.readFileSync(
    "public/super-library/catalog.json",
    "utf8",
  ),
);

const component = fs.readFileSync(
  "components/super-library/super-library-client.tsx",
  "utf8",
);

const detailPage = fs.readFileSync(
  "app/resources/[slug]/page.tsx",
  "utf8",
);

const searchRoute = fs.readFileSync(
  "app/api/resources/search/route.ts",
  "utf8",
);

const published = catalog.filter(
  (item) =>
    item.publicationStatus !== "needs-review",
);

function compact(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function invalidTitle(value) {
  const title = compact(value);

  if (!title) return true;

  if (/^[0-9۰-۹]+$/u.test(title)) {
    return true;
  }

  if (
    /^(binder|report|document|scan|file|pdf)(\s+[0-9۰-۹]+)?$/u.test(
      title,
    )
  ) {
    return true;
  }

  if (
    [
      "بدون عنوان",
      "نامشخص",
      "سند",
      "فایل",
      "گزارش",
    ].includes(title)
  ) {
    return true;
  }

  return false;
}

test("no invalid raw title is publicly visible", () => {
  const invalid = published.filter((item) =>
    invalidTitle(
      item.displayTitle ?? item.title,
    ),
  );

  assert.deepEqual(
    invalid.map((item) => ({
      slug: item.slug,
      title: item.displayTitle ?? item.title,
    })),
    [],
  );
});

test("review-required documents are hidden", () => {
  assert.ok(
    catalog.some(
      (item) =>
        item.publicationStatus === "needs-review",
    ),
  );

  assert.match(
    searchRoute,
    /publicationStatus !== "needs-review"/,
  );
});

test("external websites use a direct external action", () => {
  assert.match(
    component,
    /باز کردن وب‌سایت منبع/,
  );

  assert.match(
    component,
    /target="_blank"/,
  );

  assert.match(
    component,
    /resource\.sourceUrl/,
  );
});

test("internal documents retain a details action", () => {
  assert.match(
    component,
    /مشاهده سند و متن استخراج‌شده/,
  );

  assert.match(
    component,
    /\/resources\/\$\{resource\.slug\}/,
  );
});

test("unknown edition is not rendered as ثبت نشده", () => {
  assert.doesNotMatch(
    component,
    /ویرایش:\s*ثبت نشده/,
  );

  assert.doesNotMatch(
    detailPage,
    /ثبت نشده/,
  );
});

test("AI wording is truthful while provider is absent", () => {
  assert.match(
    component,
    /بازیابی منابع مرتبط/,
  );

  assert.match(
    component,
    /تا زمان اتصال و تأیید سرویس هوش مصنوعی/,
  );

  assert.doesNotMatch(
    component,
    /بازیابی پاسخ مستند/,
  );
});

test("library supports pagination and filters", () => {
  assert.match(component, /PAGE_SIZE/);
  assert.match(component, /صفحه بعد/);
  assert.match(component, /همه دسته‌ها/);
  assert.match(component, /همه انواع/);
});

test("every published external resource has a source URL", () => {
  const broken = published.filter(
    (item) =>
      item.resourceKind === "external-website" &&
      !item.sourceUrl,
  );

  assert.deepEqual(broken, []);
});

test("published internal resources always have verified source URLs", () => {
  const broken = published.filter(
    (item) =>
      (
        item.resourceKind === "internal-document" ||
        item.license === "official-public"
      ) &&
      !item.sourceUrl,
  );

  assert.deepEqual(
    broken.map((item) => ({
      slug: item.slug,
      title: item.displayTitle ?? item.title,
    })),
    [],
  );
});

test("unverified internal resources remain hidden for review", () => {
  const unverified = catalog.filter(
    (item) =>
      (
        item.resourceKind === "internal-document" ||
        item.license === "official-public"
      ) &&
      !item.sourceUrl,
  );

  assert.ok(unverified.length > 0);

  assert.ok(
    unverified.every(
      (item) =>
        item.publicationStatus === "needs-review" &&
        item.official === false &&
        item.provenanceStatus === "unverified",
    ),
  );
});
