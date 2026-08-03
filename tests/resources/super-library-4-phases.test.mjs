import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const builder = fs.readFileSync(
  "scripts/super-library/build_library.py",
  "utf8",
);

const searchRoute = fs.readFileSync(
  "app/api/resources/search/route.ts",
  "utf8",
);

const askRoute = fs.readFileSync(
  "app/api/resources/ask/route.ts",
  "utf8",
);

const component = fs.readFileSync(
  "components/super-library/super-library-client.tsx",
  "utf8",
);

const detailPage = fs.readFileSync(
  "app/resources/[slug]/page.tsx",
  "utf8",
);

test("phase one supports official metadata and versioning", () => {
  assert.match(builder, /edition/);
  assert.match(builder, /publishedAt/);
  assert.match(builder, /documentType/);
  assert.match(builder, /license/);
  assert.match(builder, /sha256/);
});

test("phase two supports PDF extraction and Persian OCR", () => {
  assert.match(builder, /pdftotext/);
  assert.match(builder, /pdftoppm/);
  assert.match(builder, /tesseract/);
  assert.match(builder, /fas\+eng/);
  assert.match(builder, /pageCount/);
});

test("phase three builds internal text search", () => {
  assert.match(builder, /inverted_index/);
  assert.match(searchRoute, /indexJson/);
  assert.match(searchRoute, /chunkScores/);
  assert.match(component, /api\/resources\/search/);
});

test("phase four is citation-first and fails closed", () => {
  assert.match(askRoute, /no-verified-source/);
  assert.match(askRoute, /provider-missing/);
  assert.match(askRoute, /citations/);
  assert.match(component, /دستیار Citation-first/);
});

test("resource details expose edition and page", () => {
  assert.match(detailPage, /resource\.edition/);
  assert.match(detailPage, /chunk\.page/);
  assert.match(detailPage, /resource\.ocrUsed/);
});

test("copyrighted sources remain link-only", () => {
  assert.match(builder, /link-only/);
  assert.match(builder, /cannot include fileName/);
});
