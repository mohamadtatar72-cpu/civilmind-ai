import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const libraryPage = fs.readFileSync(
  "app/library/page.tsx",
  "utf8",
);

const officialPage = fs.readFileSync(
  "app/official-sources/page.tsx",
  "utf8",
);

const searchPage = fs.readFileSync(
  "app/search/page.tsx",
  "utf8",
);

const pdfPage = fs.readFileSync(
  "app/pdf/page.tsx",
  "utf8",
);

const resourcesPage = fs.readFileSync(
  "app/resources/page.tsx",
  "utf8",
);

test("legacy library route redirects to unified resources", () => {
  assert.match(
    libraryPage,
    /redirect\("\/resources"\)/,
  );
});

test("official sources route redirects to official resource filter", () => {
  assert.match(
    officialPage,
    /redirect\("\/resources\?type=official"\)/,
  );
});

test("legacy search route redirects to unified resources", () => {
  assert.match(
    searchPage,
    /redirect\("\/resources"\)/,
  );
});

test("unified resources route remains the public catalog", () => {
  assert.match(
    resourcesPage,
    /SuperLibraryClient/,
  );

  assert.match(
    resourcesPage,
    /publicationStatus !== "needs-review"/,
  );
});

test("real PDF citation capability is not deleted", () => {
  assert.match(
    pdfPage,
    /api\.pdfLibrary\.listAccessible/,
  );

  assert.match(
    pdfPage,
    /api\.pdfLibrary\.searchWithCitations/,
  );

  assert.match(
    pdfPage,
    /citationLabel/,
  );
});
