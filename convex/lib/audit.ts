import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

type AuditResult = "success" | "denied" | "failure";

type SafeMetadataValue = string | number | boolean | null;
export type SafeAuditMetadata = Record<string, SafeMetadataValue>;

export interface WriteAuditLogInput {
  actorUserId?: Id<"users">;
  actorAuthSubject?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  result: AuditResult;
  metadata?: SafeAuditMetadata;
}

export async function writeAuditLog(
  ctx: MutationCtx,
  input: WriteAuditLogInput,
) {
  return await ctx.db.insert("auditLogs", {
    actorUserId: input.actorUserId,
    actorAuthSubject: input.actorAuthSubject,
    action: input.action,
    resourceType: input.resourceType,
    resourceId: input.resourceId,
    result: input.result,
    metadata: input.metadata,
    createdAt: Date.now(),
  });
}
