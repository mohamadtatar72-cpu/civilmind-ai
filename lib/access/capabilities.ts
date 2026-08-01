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

const premiumCapabilities = new Set<CapabilityKey>(
  capabilityKeys.filter((key) => !publicCapabilities.has(key)),
);

export function canAccessCapability(tier: AccessTier, capability: CapabilityKey) {
  if (tier === "admin" || tier === "premium") return true;
  if (publicCapabilities.has(capability)) return true;
  return tier === "free" && capability === "ai.chat";
}

export function isPremiumCapability(capability: CapabilityKey) {
  return premiumCapabilities.has(capability);
}
