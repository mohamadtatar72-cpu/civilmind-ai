import type { AuthConfig } from "convex/server";

const issuerDomain = process.env.CLERK_JWT_ISSUER_DOMAIN;

if (!issuerDomain) {
  throw new Error(
    "CLERK_JWT_ISSUER_DOMAIN must be configured in the Convex environment before deploying authentication.",
  );
}

export default {
  providers: [
    {
      domain: issuerDomain,
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;
