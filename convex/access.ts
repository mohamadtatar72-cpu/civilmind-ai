import { v } from "convex/values";
import { query } from "./_generated/server";
import {
  canAccessCapability,
  capabilityKeys,
  getEntitlementContext,
} from "./lib/entitlements";

const capabilitySummaryValidator = v.object({
  officialContentRead: v.boolean(),
  contentFilter: v.boolean(),
  aiChat: v.boolean(),
  aiQuestionAnalysis: v.boolean(),
  aiVoiceInput: v.boolean(),
  aiVoiceOutput: v.boolean(),
  aiDocumentChat: v.boolean(),
  aiExamGenerate: v.boolean(),
  aiStudyPlan: v.boolean(),
  aiPerformanceAdvanced: v.boolean(),
  aiMemoryPersonalized: v.boolean(),
});

function capabilitySummary(tier: "guest" | "free" | "premium" | "admin") {
  const allowed = new Set(
    capabilityKeys.filter((capability) => canAccessCapability(tier, capability)),
  );

  return {
    officialContentRead: allowed.has("official_content.read"),
    contentFilter: allowed.has("content.filter"),
    aiChat: allowed.has("ai.chat"),
    aiQuestionAnalysis: allowed.has("ai.question_analysis"),
    aiVoiceInput: allowed.has("ai.voice_input"),
    aiVoiceOutput: allowed.has("ai.voice_output"),
    aiDocumentChat: allowed.has("ai.document_chat"),
    aiExamGenerate: allowed.has("ai.exam_generate"),
    aiStudyPlan: allowed.has("ai.study_plan"),
    aiPerformanceAdvanced: allowed.has("ai.performance_advanced"),
    aiMemoryPersonalized: allowed.has("ai.memory_personalized"),
  };
}

export const current = query({
  args: {},
  returns: v.object({
    tier: v.union(
      v.literal("guest"),
      v.literal("free"),
      v.literal("premium"),
      v.literal("admin"),
    ),
    capabilities: capabilitySummaryValidator,
  }),
  handler: async (ctx) => {
    const access = await getEntitlementContext(ctx);
    return {
      tier: access.tier,
      capabilities: capabilitySummary(access.tier),
    };
  },
});
