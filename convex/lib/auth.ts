import type { UserIdentity } from "convex/server";
import type { Doc } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

export type AuthContext = QueryCtx | MutationCtx;
export type UserRole = "free" | "premium" | "admin";

export async function requireIdentity(
  ctx: AuthContext,
): Promise<UserIdentity> {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    throw new Error("AUTH_REQUIRED");
  }

  return identity;
}

export async function getCurrentUser(
  ctx: AuthContext,
): Promise<Doc<"users"> | null> {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    return null;
  }

  return await ctx.db
    .query("users")
    .withIndex("by_authSubject", (query) =>
      query.eq("authSubject", identity.subject),
    )
    .unique();
}

export async function requireActiveUser(
  ctx: AuthContext,
): Promise<Doc<"users">> {
  await requireIdentity(ctx);
  const user = await getCurrentUser(ctx);

  if (!user) {
    throw new Error("USER_PROFILE_REQUIRED");
  }

  if (user.status !== "active") {
    throw new Error("ACCOUNT_UNAVAILABLE");
  }

  return user;
}

export async function requireRole(
  ctx: AuthContext,
  allowedRoles: readonly UserRole[],
): Promise<Doc<"users">> {
  const user = await requireActiveUser(ctx);

  if (!allowedRoles.includes(user.role)) {
    throw new Error("ACCESS_DENIED");
  }

  return user;
}

export async function requireAdmin(
  ctx: AuthContext,
): Promise<Doc<"users">> {
  return await requireRole(ctx, ["admin"]);
}

export async function requirePremiumOrAdmin(
  ctx: AuthContext,
): Promise<Doc<"users">> {
  return await requireRole(ctx, ["premium", "admin"]);
}
