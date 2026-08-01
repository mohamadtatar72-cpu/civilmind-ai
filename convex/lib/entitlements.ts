import type { Doc } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { getCurrentUser, type AuthContext } from "./auth";

export const capabilityKeys = [
  "official_content.read",
  "content.filter",
  "ai.chat",
  "ai.question_analysis",
  "ai.voice_input",
  "ai.voice_output",
  "ai.document_chat",
  "ai.exam_generate",
  "ai.study_plan",
  "ai.performance_advanced",
  "ai.memory_personalized",
] as const;

export type CapabilityKey = (typeof capabilityKeys)[number];
export type AccessTier = "guest" | "free" | "premium" | "admin";

const publicCapabilities = new Set<CapabilityKey>([
  "official_content.read",
  "content.filter",
]);

export type EntitlementContext = {
  tier: AccessTier;
  user: Doc<"users"> | null;
};

function hasActivePremiumSubscription(
  subscription: Doc<"subscriptions"> | null,
) {
  return (
    subscription?.plan === "premium" &&
    (subscription.status === "active" || subscription.status === "trialing")
  );
}

export function canAccessCapability(
  tier: AccessTier,
  capability: CapabilityKey,
) {
  if (tier === "admin" || tier === "premium") return true;
  if (publicCapabilities.has(capability)) return true;
  return tier === "free" && capability === "ai.chat";
}

export function gatewayCapabilityToEntitlement(
  capability: "study-coach" | "exam-analysis" | "study-planner" | "pdf-question",
): CapabilityKey {
  switch (capability) {
    case "study-coach":
      return "ai.chat";
    case "exam-analysis":
      return "ai.question_analysis";
    case "study-planner":
      return "ai.study_plan";
    case "pdf-question":
      return "ai.document_chat";
  }
}

export async function getEntitlementContext(
  ctx: QueryCtx | MutationCtx,
): Promise<EntitlementContext> {
  const user = await getCurrentUser(ctx);
  if (!user) return { tier: "guest", user: null };
  if (user.status !== "active") return { tier: "guest", user };
  if (user.role === "admin") return { tier: "admin", user };
  if (user.role === "premium") return { tier: "premium", user };

  const subscription = await ctx.db
    .query("subscriptions")
    .withIndex("by_userId", (index) => index.eq("userId", user._id))
    .unique();

  return {
    tier: hasActivePremiumSubscription(subscription) ? "premium" : "free",
    user,
  };
}

export async function requireCapability(
  ctx: AuthContext,
  capability: CapabilityKey,
): Promise<EntitlementContext & { user: Doc<"users"> }> {
  const access = await getEntitlementContext(ctx);
  if (!access.user) throw new Error("AUTH_REQUIRED");
  if (access.user.status !== "active") throw new Error("ACCOUNT_UNAVAILABLE");
  if (!canAccessCapability(access.tier, capability)) {
    throw new Error("CAPABILITY_PREMIUM_REQUIRED");
  }
  return access as EntitlementContext & { user: Doc<"users"> };
}

export function assertPublicCapability(capability: CapabilityKey) {
  if (!canAccessCapability("guest", capability)) {
    throw new Error("CAPABILITY_NOT_PUBLIC");
  }
}
