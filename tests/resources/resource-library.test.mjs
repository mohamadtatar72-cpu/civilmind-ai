import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const catalog = fs.readFileSync(
  "features/resources/generated-catalog.ts",
  "utf8",
);

const component = fs.readFileSync(
  "components/resources/resource-library.tsx",
  "utf8",
);

const page = fs.readFileSync(
  "app/resources/page.tsx",
  "utf8",
);

const appShell = fs.readFileSync(
  "components/layout/app-shell.tsx",
  "utf8",
);

test("resource super library has a real route", () => {
  assert.match(page, /ResourceLibrary/);
  assert.match(page, /AppShell/);
});

test("resource super library is linked from navigation", () => {
  assert.match(
    appShell,
    /ابرکتابخانه مهندسی/,
  );

  assert.match(
    appShell,
    /href: "\/resources"/,
  );
});

test("catalog supports local and external resources", () => {
  assert.match(catalog, /downloadable/);
  assert.match(catalog, /external/);
  assert.match(catalog, /official/);
  assert.match(catalog, /sourceUrl/);
  assert.match(catalog, /fileUrl/);
});

test("library supports text and category search", () => {
  assert.match(component, /setQuery/);
  assert.match(component, /setCategory/);
  assert.match(component, /filteredResources/);
});

test("library supports official and educational filters", () => {
  assert.match(component, /ScopeFilter/);
  assert.match(component, /official/);
  assert.match(component, /educational/);
  assert.match(component, /downloadable/);
});

test("external copyrighted content remains link only", () => {
  assert.match(
    component,
    /مشاهده منبع اصلی/,
  );

  assert.match(
    component,
    /noopener noreferrer/,
  );
});

test("authorized local resources remain downloadable", () => {
  assert.match(
    component,
    /دانلود فایل/,
  );

  assert.match(
    component,
    /resource\.downloadable/,
  );
});

test("copyright policy is visible to users", () => {
  assert.match(
    component,
    /سیاست حقوق نشر/,
  );

  assert.match(
    component,
    /فقط با لینک منبع اصلی/,
  );
});
