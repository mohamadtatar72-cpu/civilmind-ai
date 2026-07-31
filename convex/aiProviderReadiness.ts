import { v } from "convex/values";
import { action } from "./_generated/server";
import { api, internal } from "./_generated/api";
import {
  getProviderAdapterReadiness,
  type AiProvider,
} from "./lib/aiAdapterContract";

const providerValidator = v.union(
  v.literal("openai"),
  v.literal("gemini"),
  v.literal("anthropic"),
);

const readinessValidator = v.object({
  provider: providerValidator,
  modelAlias: v.string(),
  configured: v.boolean(),
  missingEnvironmentVariables: v.array(v.string()),
});

type AdminProvider = {
  provider: AiProvider;
  modelAlias: string;
};

/**
 * Reconciles deployment-secret readiness with the persisted provider registry.
 *
 * Security properties:
 * - authorization is delegated to the admin-only provider query;
 * - secret values are never returned or persisted;
 * - missing configuration disables the adapter and closes routing fail-safe;
 * - the operation is idempotent and can be run after every deployment.
 */
export const adminRefreshProviderReadiness = action({
  args: {},
  returns: v.array(readinessValidator),
  handler: async (ctx) => {
    const providers = (await ctx.runQuery(
      api.aiGateway.adminListProviders,
      {},
    )) as AdminProvider[];

    const readiness = providers.map((provider) =>
      getProviderAdapterReadiness(provider.provider, provider.modelAlias),
    );

    for (const provider of readiness) {
      await ctx.runMutation(internal.aiGateway.internalSetAdapterReady, {
        provider: provider.provider,
        ready: provider.configured,
      });
    }

    return readiness;
  },
});
