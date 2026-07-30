export type AiCapability =
  | "study-coach"
  | "exam-analysis"
  | "study-planner"
  | "pdf-question";

export type AiToolName =
  | "official-resource-search"
  | "topic-progress-read"
  | "exam-history-read"
  | "study-plan-read"
  | "study-plan-draft"
  | "user-pdf-retrieval";

const CAPABILITY_TOOL_ALLOWLIST: Record<AiCapability, readonly AiToolName[]> = {
  "study-coach": ["official-resource-search", "topic-progress-read"],
  "exam-analysis": ["exam-history-read", "topic-progress-read"],
  "study-planner": ["study-plan-read", "study-plan-draft"],
  "pdf-question": ["user-pdf-retrieval"],
};

const VALID_TOOL_NAMES = new Set<AiToolName>(
  Object.values(CAPABILITY_TOOL_ALLOWLIST).flat(),
);

export function allowedToolsForCapability(capability: AiCapability) {
  return CAPABILITY_TOOL_ALLOWLIST[capability];
}

export function validateRequestedTools(
  capability: AiCapability,
  requestedTools: readonly string[],
): AiToolName[] {
  if (requestedTools.length > 8) throw new Error("AI_TOO_MANY_TOOLS");

  const allowed = new Set(CAPABILITY_TOOL_ALLOWLIST[capability]);
  const normalized = [...new Set(requestedTools.map((tool) => tool.trim()))];

  for (const tool of normalized) {
    if (!VALID_TOOL_NAMES.has(tool as AiToolName) || !allowed.has(tool as AiToolName)) {
      throw new Error("AI_TOOL_NOT_ALLOWED");
    }
  }

  return normalized as AiToolName[];
}
