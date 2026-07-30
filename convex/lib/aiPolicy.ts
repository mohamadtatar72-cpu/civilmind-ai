import type { Doc } from "../_generated/dataModel";
import type { UserRole } from "./auth";

export const DEFAULT_AI_POLICY = {
  key: "default" as const,
  freeDailyRequests: 5,
  premiumDailyRequests: 100,
  adminDailyRequests: 500,
  maxInputCharacters: 12_000,
  maxOutputTokens: 2_048,
  monthlyBudgetMicrousd: 50_000_000,
  fallbackEnabled: false,
} as const;

export const DEFAULT_PROVIDER_CONFIGS = [
  {
    provider: "openai" as const,
    displayName: "OpenAI API",
    enabled: false,
    adapterReady: false,
    routePriority: 10,
    modelAlias: "primary-chat",
    maxConcurrency: 4,
    timeoutMs: 30_000,
    monthlyBudgetMicrousd: 40_000_000,
  },
  {
    provider: "gemini" as const,
    displayName: "Gemini API",
    enabled: false,
    adapterReady: false,
    routePriority: 20,
    modelAlias: "fallback-chat",
    maxConcurrency: 2,
    timeoutMs: 30_000,
    monthlyBudgetMicrousd: 5_000_000,
  },
  {
    provider: "anthropic" as const,
    displayName: "Anthropic API",
    enabled: false,
    adapterReady: false,
    routePriority: 30,
    modelAlias: "optional-premium-chat",
    maxConcurrency: 2,
    timeoutMs: 30_000,
    monthlyBudgetMicrousd: 5_000_000,
  },
] as const;

export function utcDayKey(timestamp = Date.now()) {
  return new Date(timestamp).toISOString().slice(0, 10);
}

export function quotaForRole(
  role: UserRole,
  policy: Pick<
    Doc<"aiGatewayPolicies">,
    "freeDailyRequests" | "premiumDailyRequests" | "adminDailyRequests"
  >,
) {
  if (role === "admin") return policy.adminDailyRequests;
  if (role === "premium") return policy.premiumDailyRequests;
  return policy.freeDailyRequests;
}

export function normalizeIdempotencyKey(value: string) {
  const normalized = value.trim();
  if (!/^[A-Za-z0-9_-]{12,80}$/.test(normalized)) {
    throw new Error("AI_IDEMPOTENCY_KEY_INVALID");
  }
  return normalized;
}

export function validateInputCharacters(value: number, maximum: number) {
  if (!Number.isInteger(value) || value < 1 || value > maximum) {
    throw new Error("AI_INPUT_SIZE_INVALID");
  }
  return value;
}

export function normalizeFailureCode(value: string) {
  const normalized = value
    .replace(/[^A-Za-z0-9_.:-]/g, "_")
    .slice(0, 100);
  return normalized || "AI_PROVIDER_FAILURE";
}

export function normalizeSafeMessage(value: string | undefined) {
  if (!value) return undefined;
  const normalized = value.replace(/\s+/g, " ").trim().slice(0, 300);
  return normalized || undefined;
}
