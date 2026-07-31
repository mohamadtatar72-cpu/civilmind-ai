#!/usr/bin/env node

const requiredEnv = [
  "NEXT_PUBLIC_CONVEX_URL",
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  "CLERK_SECRET_KEY",
  "CLERK_JWT_ISSUER_DOMAIN",
  "ADMIN_BOOTSTRAP_EMAIL",
];

const baseUrl = (process.env.PRODUCTION_URL ?? "").replace(/\/$/, "");

function fail(message) {
  console.error(`❌ ${message}`);
  process.exitCode = 1;
}

function pass(message) {
  console.log(`✅ ${message}`);
}

function warn(message) {
  console.warn(`⚠️  ${message}`);
}

console.log("CivilMind production verification\n");

for (const name of requiredEnv) {
  if (process.env[name]?.trim()) pass(`${name} is set`);
  else fail(`${name} is missing`);
}

if (!baseUrl) {
  fail("PRODUCTION_URL is missing. Example: https://your-app.vercel.app");
  process.exit();
}

const routes = ["/", "/sign-in", "/profile", "/admin", "/exam", "/analytics"];

for (const route of routes) {
  try {
    const response = await fetch(`${baseUrl}${route}`, {
      redirect: "manual",
      headers: { "user-agent": "CivilMind-Production-Smoke-Test/1.0" },
    });

    const acceptable = response.status >= 200 && response.status < 400;
    if (acceptable) pass(`${route} returned ${response.status}`);
    else fail(`${route} returned ${response.status}`);

    if (route === "/profile") {
      const location = response.headers.get("location");
      if (location) warn(`/profile redirects to ${location}`);
    }
  } catch (error) {
    fail(`${route} request failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

if (process.exitCode) {
  console.error("\nProduction verification failed.");
} else {
  console.log("\nAll automated production checks passed.");
}
