import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const page = fs.readFileSync(
  "app/resources/page.tsx",
  "utf8",
);

const legacyComponent = fs.readFileSync(
  "components/resources/resource-library.tsx",
  "utf8",
);

const superLibraryComponent = fs.readFileSync(
  "components/super-library/super-library-client.tsx",
  "utf8",
);

const appShell = fs.readFileSync(
  "components/layout/app-shell.tsx",
  "utf8",
);

const catalog = JSON.parse(
  fs.readFileSync(
    "public/super-library/catalog.json",
    "utf8",
  ),
);

test("resource super library has a real route", () => {
  assert.match(page, /SuperLibraryClient/);
  assert.match(page, /AppShell/);
});

test("resource super library remains linked from navigation", () => {
  assert.match(appShell, /ابرکتابخانه مهندسی/);
  assert.match(appShell, /href: "\/resources"/);
});

test("existing external resources remain available", () => {
  assert.ok(Array.isArray(catalog));
  assert.ok(catalog.length >= 16);
  assert.ok(
    catalog.some(
      (resource) => resource.license === "link-only",
    ),
  );
});

test("new library supports internal search", () => {
  assert.match(
    superLibraryComponent,
    /\/api\/resources\/search/,
  );
  assert.match(
    superLibraryComponent,
    /setQuery/,
  );
});

test("new library supports citation-first retrieval", () => {
  assert.match(
    superLibraryComponent,
    /\/api\/resources\/ask/,
  );
  assert.match(
    superLibraryComponent,
    /Citation-first/,
  );
});

test("copyright policy remains visible", () => {
  assert.match(
    legacyComponent,
    /فقط با لینک منبع اصلی/,
  );
});
