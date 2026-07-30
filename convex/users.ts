import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { writeAuditLog } from "./lib/audit";
import {
  requireActiveUser,
  requireAdmin,
  requireIdentity,
  type UserRole,
} from "./lib/auth";

const roleValidator = v.union(
  v.literal("free"),
  v.literal("premium"),
  v.literal("admin"),
);

const statusValidator = v.union(
  v.literal("active"),
  v.literal("suspended"),
  v.literal("deleted"),
);

const subscriptionStatusValidator = v.union(
  v.literal("active"),
  v.literal("trialing"),
  v.literal("past_due"),
  v.literal("canceled"),
  v.literal("expired"),
);

const publicUserValidator = v.object({
  id: v.id("users"),
  email: v.optional(v.string()),
  displayName: v.optional(v.string()),
  imageUrl: v.optional(v.string()),
  role: roleValidator,
  status: statusValidator,
  onboardingCompleted: v.boolean(),
  plan: v.union(v.literal("free"), v.literal("premium")),
  subscriptionStatus: subscriptionStatusValidator,
  createdAt: v.number(),
  lastSeenAt: v.optional(v.number()),
});

function normalizeOptional(value: string | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function normalizeEmail(value: string | undefined) {
  return normalizeOptional(value)?.toLowerCase();
}

function normalizeDisplayName(value: string) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length < 2 || normalized.length > 80) {
    throw new Error("INVALID_DISPLAY_NAME");
  }
  return normalized;
}

function normalizeReason(value: string) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length < 3 || normalized.length > 300) {
    throw new Error("INVALID_REASON");
  }
  return normalized;
}

async function getSubscription(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">,
) {
  return await ctx.db
    .query("subscriptions")
    .withIndex("by_userId", (query) => query.eq("userId", userId))
    .unique();
}

async function ensureSubscription(
  ctx: MutationCtx,
  userId: Id<"users">,
  role: UserRole,
) {
  const existing = await getSubscription(ctx, userId);
  const now = Date.now();
  const plan = role === "free" ? "free" : "premium";

  if (existing) {
    if (existing.plan !== plan) {
      await ctx.db.patch(existing._id, {
        plan,
        status: "active",
        cancelAtPeriodEnd: false,
        updatedAt: now,
      });
    }
    return (await ctx.db.get(existing._id))!;
  }

  const subscriptionId = await ctx.db.insert("subscriptions", {
    userId,
    plan,
    status: "active",
    cancelAtPeriodEnd: false,
    createdAt: now,
    updatedAt: now,
  });

  return (await ctx.db.get(subscriptionId))!;
}

async function toPublicUser(
  ctx: QueryCtx | MutationCtx,
  user: Doc<"users">,
) {
  const subscription = await getSubscription(ctx, user._id);

  return {
    id: user._id,
    email: user.email,
    displayName: user.displayName,
    imageUrl: user.imageUrl,
    role: user.role,
    status: user.status,
    onboardingCompleted: user.onboardingCompleted,
    plan: subscription?.plan ?? (user.role === "free" ? "free" : "premium"),
    subscriptionStatus: subscription?.status ?? "active",
    createdAt: user.createdAt,
    lastSeenAt: user.lastSeenAt,
  };
}

async function provisionCurrentUser(ctx: MutationCtx) {
  const identity = await requireIdentity(ctx);
  const now = Date.now();
  const email = normalizeEmail(identity.email);
  const displayName = normalizeOptional(identity.name);
  const imageUrl = normalizeOptional(identity.pictureUrl);

  let user = await ctx.db
    .query("users")
    .withIndex("by_authSubject", (query) =>
      query.eq("authSubject", identity.subject),
    )
    .unique();

  if (!user) {
    const userId = await ctx.db.insert("users", {
      authSubject: identity.subject,
      email,
      displayName,
      imageUrl,
      role: "free",
      status: "active",
      onboardingCompleted: false,
      createdAt: now,
      updatedAt: now,
      lastSeenAt: now,
    });
    user = (await ctx.db.get(userId))!;
    await ensureSubscription(ctx, userId, "free");
    await writeAuditLog(ctx, {
      actorUserId: userId,
      actorAuthSubject: identity.subject,
      action: "user.provisioned",
      resourceType: "user",
      resourceId: userId,
      result: "success",
    });
    return user;
  }

  const patch: Partial<Doc<"users">> = {
    updatedAt: now,
    lastSeenAt: now,
  };
  if (email) patch.email = email;
  if (displayName && (!user.onboardingCompleted || !user.displayName)) {
    patch.displayName = displayName;
  }
  if (imageUrl) patch.imageUrl = imageUrl;
  await ctx.db.patch(user._id, patch);
  await ensureSubscription(ctx, user._id, user.role);
  return (await ctx.db.get(user._id))!;
}

export const ensureCurrentUser = mutation({
  args: {},
  returns: publicUserValidator,
  handler: async (ctx) => {
    const user = await provisionCurrentUser(ctx);
    if (user.status !== "active") {
      throw new Error("ACCOUNT_UNAVAILABLE");
    }
    return await toPublicUser(ctx, user);
  },
});

export const current = query({
  args: {},
  returns: publicUserValidator,
  handler: async (ctx) => {
    const user = await requireActiveUser(ctx);
    return await toPublicUser(ctx, user);
  },
});

export const completeOnboarding = mutation({
  args: { displayName: v.string() },
  returns: publicUserValidator,
  handler: async (ctx, args) => {
    const user = await requireActiveUser(ctx);
    const displayName = normalizeDisplayName(args.displayName);
    await ctx.db.patch(user._id, {
      displayName,
      onboardingCompleted: true,
      updatedAt: Date.now(),
    });
    await writeAuditLog(ctx, {
      actorUserId: user._id,
      actorAuthSubject: user.authSubject,
      action: "user.onboarding_completed",
      resourceType: "user",
      resourceId: user._id,
      result: "success",
    });
    return await toPublicUser(ctx, (await ctx.db.get(user._id))!);
  },
});

export const claimInitialAdmin = mutation({
  args: {},
  returns: publicUserValidator,
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);
    const user = await provisionCurrentUser(ctx);
    const bootstrapEmail = normalizeEmail(process.env.ADMIN_BOOTSTRAP_EMAIL);
    const identityEmail = normalizeEmail(identity.email);

    if (
      !bootstrapEmail ||
      !identityEmail ||
      identityEmail !== bootstrapEmail ||
      identity.emailVerified !== true ||
      user.status !== "active"
    ) {
      await writeAuditLog(ctx, {
        actorUserId: user._id,
        actorAuthSubject: identity.subject,
        action: "admin.bootstrap_claim",
        resourceType: "user",
        resourceId: user._id,
        result: "denied",
        metadata: { reason: "bootstrap_conditions_not_met" },
      });
      throw new Error("ADMIN_BOOTSTRAP_DENIED");
    }

    const existingAdmin = await ctx.db
      .query("users")
      .withIndex("by_role", (query) => query.eq("role", "admin"))
      .take(1);

    if (existingAdmin.length > 0 && existingAdmin[0]._id !== user._id) {
      await writeAuditLog(ctx, {
        actorUserId: user._id,
        actorAuthSubject: identity.subject,
        action: "admin.bootstrap_claim",
        resourceType: "user",
        resourceId: user._id,
        result: "denied",
        metadata: { reason: "admin_already_exists" },
      });
      throw new Error("ADMIN_ALREADY_EXISTS");
    }

    await ctx.db.patch(user._id, {
      role: "admin",
      updatedAt: Date.now(),
    });
    await ensureSubscription(ctx, user._id, "admin");
    await writeAuditLog(ctx, {
      actorUserId: user._id,
      actorAuthSubject: identity.subject,
      action: "admin.bootstrap_claim",
      resourceType: "user",
      resourceId: user._id,
      result: "success",
    });
    return await toPublicUser(ctx, (await ctx.db.get(user._id))!);
  },
});

export const adminListUsers = query({
  args: { limit: v.number() },
  returns: v.array(publicUserValidator),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    if (!Number.isInteger(args.limit) || args.limit < 1 || args.limit > 100) {
      throw new Error("INVALID_LIMIT");
    }
    const users = await ctx.db.query("users").order("desc").take(args.limit);
    return await Promise.all(users.map((user) => toPublicUser(ctx, user)));
  },
});

export const adminSetRole = mutation({
  args: {
    userId: v.id("users"),
    role: roleValidator,
    reason: v.string(),
  },
  returns: publicUserValidator,
  handler: async (ctx, args) => {
    const actor = await requireAdmin(ctx);
    const target = await ctx.db.get(args.userId);
    const reason = normalizeReason(args.reason);
    if (!target) throw new Error("USER_NOT_FOUND");

    if (target._id === actor._id && target.role === "admin" && args.role !== "admin") {
      const activeAdmins = await ctx.db
        .query("users")
        .withIndex("by_role_and_status", (query) =>
          query.eq("role", "admin").eq("status", "active"),
        )
        .take(2);
      if (activeAdmins.length <= 1) {
        await writeAuditLog(ctx, {
          actorUserId: actor._id,
          actorAuthSubject: actor.authSubject,
          action: "admin.user_role_changed",
          resourceType: "user",
          resourceId: target._id,
          result: "denied",
          metadata: { reason: "last_active_admin" },
        });
        throw new Error("LAST_ACTIVE_ADMIN_REQUIRED");
      }
    }

    await ctx.db.patch(target._id, { role: args.role, updatedAt: Date.now() });
    await ensureSubscription(ctx, target._id, args.role);
    await writeAuditLog(ctx, {
      actorUserId: actor._id,
      actorAuthSubject: actor.authSubject,
      action: "admin.user_role_changed",
      resourceType: "user",
      resourceId: target._id,
      result: "success",
      metadata: { previousRole: target.role, nextRole: args.role, reason },
    });
    return await toPublicUser(ctx, (await ctx.db.get(target._id))!);
  },
});

export const adminSetStatus = mutation({
  args: {
    userId: v.id("users"),
    status: statusValidator,
    reason: v.string(),
  },
  returns: publicUserValidator,
  handler: async (ctx, args) => {
    const actor = await requireAdmin(ctx);
    const target = await ctx.db.get(args.userId);
    const reason = normalizeReason(args.reason);
    if (!target) throw new Error("USER_NOT_FOUND");

    if (
      target._id === actor._id &&
      target.role === "admin" &&
      args.status !== "active"
    ) {
      const activeAdmins = await ctx.db
        .query("users")
        .withIndex("by_role_and_status", (query) =>
          query.eq("role", "admin").eq("status", "active"),
        )
        .take(2);
      if (activeAdmins.length <= 1) {
        await writeAuditLog(ctx, {
          actorUserId: actor._id,
          actorAuthSubject: actor.authSubject,
          action: "admin.user_status_changed",
          resourceType: "user",
          resourceId: target._id,
          result: "denied",
          metadata: { reason: "last_active_admin" },
        });
        throw new Error("LAST_ACTIVE_ADMIN_REQUIRED");
      }
    }

    await ctx.db.patch(target._id, {
      status: args.status,
      updatedAt: Date.now(),
    });
    await writeAuditLog(ctx, {
      actorUserId: actor._id,
      actorAuthSubject: actor.authSubject,
      action: "admin.user_status_changed",
      resourceType: "user",
      resourceId: target._id,
      result: "success",
      metadata: { previousStatus: target.status, nextStatus: args.status, reason },
    });
    return await toPublicUser(ctx, (await ctx.db.get(target._id))!);
  },
});
