import { v } from "convex/values";
import { query } from "./_generated/server";
import { requireAdmin } from "./lib/auth";

const auditResultValidator = v.union(
  v.literal("success"),
  v.literal("denied"),
  v.literal("failure"),
);

const publicAuditLogValidator = v.object({
  id: v.id("auditLogs"),
  actorUserId: v.optional(v.id("users")),
  action: v.string(),
  resourceType: v.string(),
  resourceId: v.optional(v.string()),
  result: auditResultValidator,
  metadata: v.optional(v.any()),
  createdAt: v.number(),
});

function sanitizeMetadata(value: unknown): unknown {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.slice(0, 20).map(sanitizeMetadata);
  }

  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([key]) => !/(token|secret|password|key|authorization)/i.test(key))
      .slice(0, 30)
      .map(([key, nestedValue]) => [key, sanitizeMetadata(nestedValue)]);
    return Object.fromEntries(entries);
  }

  return undefined;
}

export const adminListRecent = query({
  args: { limit: v.number() },
  returns: v.array(publicAuditLogValidator),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    if (!Number.isInteger(args.limit) || args.limit < 1 || args.limit > 100) {
      throw new Error("INVALID_LIMIT");
    }

    const logs = await ctx.db
      .query("auditLogs")
      .withIndex("by_createdAt")
      .order("desc")
      .take(args.limit);

    return logs.map((log) => ({
      id: log._id,
      actorUserId: log.actorUserId,
      action: log.action,
      resourceType: log.resourceType,
      resourceId: log.resourceId,
      result: log.result,
      metadata: sanitizeMetadata(log.metadata),
      createdAt: log.createdAt,
    }));
  },
});
