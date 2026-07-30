import type { AiCapability, AiToolName } from "./aiToolPolicy";

export type AiProvider = "openai" | "gemini" | "anthropic";

export type AiPromptEnvelope = {
  capability: AiCapability;
  userText: string;
  requestedTools: AiToolName[];
  maxOutputTokens: number;
};

export type AiAdapterRequest = {
  requestId: string;
  provider: AiProvider;
  modelAlias: string;
  prompt: AiPromptEnvelope;
  timeoutMs: number;
};

export type AiAdapterResponse = {
  text: string;
  inputTokens: number;
  outputTokens: number;
  costMicrousd: number;
  finishReason: "stop" | "length" | "tool";
};

export class AiAdapterError extends Error {
  readonly code: string;
  readonly retryable: boolean;

  constructor(code: string, retryable: boolean) {
    super(code);
    this.name = "AiAdapterError";
    this.code = code;
    this.retryable = retryable;
  }
}

export function validatePromptEnvelope(input: {
  capability: AiCapability;
  userText: string;
  requestedTools: AiToolName[];
  maxOutputTokens: number;
}): AiPromptEnvelope {
  const userText = input.userText.replace(/\u0000/g, "").trim();
  if (userText.length < 1 || userText.length > 100_000) {
    throw new AiAdapterError("AI_PROMPT_LENGTH_INVALID", false);
  }
  if (
    !Number.isInteger(input.maxOutputTokens) ||
    input.maxOutputTokens < 64 ||
    input.maxOutputTokens > 16_384
  ) {
    throw new AiAdapterError("AI_OUTPUT_LIMIT_INVALID", false);
  }

  return {
    capability: input.capability,
    userText,
    requestedTools: input.requestedTools,
    maxOutputTokens: input.maxOutputTokens,
  };
}

/**
 * Provider SDKs are intentionally not installed in Sprint 1F. Future adapters
 * must implement this contract server-side and obtain keys only from the
 * deployment secret store. Consumer ChatGPT/Claude/Gemini sessions are never
 * accepted as API credentials.
 */
export async function executeProviderAdapter(
  request: AiAdapterRequest,
): Promise<AiAdapterResponse> {
  void request;
  throw new AiAdapterError("AI_ADAPTER_NOT_CONFIGURED", false);
}
