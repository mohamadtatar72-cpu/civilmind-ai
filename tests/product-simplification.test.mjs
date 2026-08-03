import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const appShell = fs.readFileSync(
  "components/layout/app-shell.tsx",
  "utf8",
);

const homepage = fs.readFileSync(
  "components/home/guest-landing.tsx",
  "utf8",
);

test("public navigation contains only the core product journeys", () => {
  const requiredRoutes = [
    'href: "/"',
    'href: "/exam"',
    'href: "/resources"',
    'href: "/regulation-explainer"',
    'href: "/ai"',
    'href: "/dashboard"',
  ];

  for (const route of requiredRoutes) {
    assert.match(appShell, new RegExp(route.replace("/", "\\/")));
  }
});

test("future-phase routes are not exposed in primary navigation", () => {
  const hiddenRoutes = [
    'href: "/analytics"',
    'href: "/community"',
    'href: "/prediction"',
    'href: "/graph"',
    'href: "/pdf"',
    'href: "/official-sources"',
    'href: "/search"',
    'href: "/planner"',
    'href: "/library"',
  ];

  for (const route of hiddenRoutes) {
    assert.doesNotMatch(
      appShell,
      new RegExp(route.replace("/", "\\/")),
    );
  }
});

test("homepage does not display fake voice or upload actions", () => {
  assert.doesNotMatch(homepage, /\bMic\b/);
  assert.doesNotMatch(homepage, /\bFileUp\b/);
  assert.doesNotMatch(homepage, /readOnly/);
  assert.doesNotMatch(homepage, /ورودی صوتی/);
  assert.doesNotMatch(homepage, /پیوست فایل/);
});

test("homepage exposes the three core journeys", () => {
  assert.match(homepage, /شروع تمرین سؤال/);
  assert.match(homepage, /مشاهده منابع رسمی/);
  assert.match(homepage, /توضیح مقررات/);
});

test("homepage communicates provider status truthfully", () => {
  assert.match(homepage, /اتصال Provider\s+تأییدشده/);
  assert.match(homepage, /بازیابی منابع و Citation فعال است/);
});

test("admin navigation remains authorization-aware", () => {
  assert.match(appShell, /account\.isAdmin/);
  assert.match(appShell, /href: "\/admin"/);
});
