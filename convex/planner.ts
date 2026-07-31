import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { requireActiveUser } from "./lib/auth";

const taskTypeValidator = v.union(
  v.literal("study"),
  v.literal("test"),
  v.literal("review"),
  v.literal("other"),
);

const priorityValidator = v.union(
  v.literal("low"),
  v.literal("medium"),
  v.literal("high"),
);

const statusValidator = v.union(
  v.literal("planned"),
  v.literal("in_progress"),
  v.literal("completed"),
  v.literal("cancelled"),
);

const taskValidator = v.object({
  id: v.id("plannerTasks"),
  dayKey: v.string(),
  title: v.string(),
  taskType: taskTypeValidator,
  topicKey: v.optional(v.string()),
  plannedMinutes: v.number(),
  priority: priorityValidator,
  status: statusValidator,
  position: v.number(),
  completedAt: v.optional(v.number()),
  createdAt: v.number(),
  updatedAt: v.number(),
});

function parseDayKey(dayKey: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dayKey)) {
    throw new Error("INVALID_DAY_KEY");
  }
  const timestamp = Date.parse(dayKey + "T00:00:00.000Z");
  if (!Number.isFinite(timestamp) || new Date(timestamp).toISOString().slice(0, 10) !== dayKey) {
    throw new Error("INVALID_DAY_KEY");
  }
  return timestamp;
}

function normalizeTitle(value: string) {
  const title = value.replace(/\s+/g, " ").trim();
  if (title.length < 2 || title.length > 160) {
    throw new Error("INVALID_TITLE");
  }
  return title;
}

function normalizeTopicKey(value: string | undefined) {
  if (!value) return undefined;
  const topicKey = value.toLowerCase().replace(/\s+/g, "-").trim();
  if (!/^[a-z0-9\u0600-\u06ff-]{2,80}$/.test(topicKey)) {
    throw new Error("INVALID_TOPIC_KEY");
  }
  return topicKey;
}

function validateMinutes(value: number) {
  if (!Number.isInteger(value) || value < 5 || value > 720) {
    throw new Error("INVALID_PLANNED_MINUTES");
  }
}

function toPublicTask(task: Doc<"plannerTasks">) {
  return {
    id: task._id,
    dayKey: task.dayKey,
    title: task.title,
    taskType: task.taskType,
    topicKey: task.topicKey,
    plannedMinutes: task.plannedMinutes,
    priority: task.priority,
    status: task.status,
    position: task.position,
    completedAt: task.completedAt,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
}

export const getRange = query({
  args: {
    startDayKey: v.string(),
    endDayKey: v.string(),
  },
  returns: v.array(taskValidator),
  handler: async (ctx, args) => {
    const user = await requireActiveUser(ctx);
    const start = parseDayKey(args.startDayKey);
    const end = parseDayKey(args.endDayKey);
    const rangeDays = Math.floor((end - start) / 86400000) + 1;
    if (rangeDays < 1 || rangeDays > 42) {
      throw new Error("INVALID_CALENDAR_RANGE");
    }

    const tasks = await ctx.db
      .query("plannerTasks")
      .withIndex("by_userId_and_dayKey", (q) =>
        q
          .eq("userId", user._id)
          .gte("dayKey", args.startDayKey)
          .lte("dayKey", args.endDayKey),
      )
      .take(500);

    return tasks
      .filter((task) => task.status !== "cancelled")
      .sort((a, b) =>
        a.dayKey === b.dayKey
          ? a.position - b.position
          : a.dayKey.localeCompare(b.dayKey),
      )
      .map(toPublicTask);
  },
});

export const createTask = mutation({
  args: {
    dayKey: v.string(),
    title: v.string(),
    taskType: taskTypeValidator,
    topicKey: v.optional(v.string()),
    plannedMinutes: v.number(),
    priority: priorityValidator,
  },
  returns: v.id("plannerTasks"),
  handler: async (ctx, args) => {
    const user = await requireActiveUser(ctx);
    parseDayKey(args.dayKey);
    validateMinutes(args.plannedMinutes);
    const now = Date.now();
    return await ctx.db.insert("plannerTasks", {
      userId: user._id,
      dayKey: args.dayKey,
      title: normalizeTitle(args.title),
      taskType: args.taskType,
      topicKey: normalizeTopicKey(args.topicKey),
      plannedMinutes: args.plannedMinutes,
      priority: args.priority,
      status: "planned",
      position: now,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const setTaskStatus = mutation({
  args: {
    taskId: v.id("plannerTasks"),
    status: v.union(
      v.literal("planned"),
      v.literal("in_progress"),
      v.literal("completed"),
    ),
  },
  returns: taskValidator,
  handler: async (ctx, args) => {
    const user = await requireActiveUser(ctx);
    const task = await ctx.db.get(args.taskId);
    if (!task || task.userId !== user._id || task.status === "cancelled") {
      throw new Error("TASK_NOT_FOUND");
    }
    const now = Date.now();
    await ctx.db.patch(task._id, {
      status: args.status,
      completedAt: args.status === "completed" ? now : undefined,
      updatedAt: now,
    });
    return toPublicTask((await ctx.db.get(task._id))!);
  },
});

export const rescheduleTask = mutation({
  args: {
    taskId: v.id("plannerTasks"),
    dayKey: v.string(),
  },
  returns: taskValidator,
  handler: async (ctx, args) => {
    const user = await requireActiveUser(ctx);
    parseDayKey(args.dayKey);
    const task = await ctx.db.get(args.taskId);
    if (!task || task.userId !== user._id || task.status === "cancelled") {
      throw new Error("TASK_NOT_FOUND");
    }
    await ctx.db.patch(task._id, {
      dayKey: args.dayKey,
      updatedAt: Date.now(),
    });
    return toPublicTask((await ctx.db.get(task._id))!);
  },
});

export const cancelTask = mutation({
  args: { taskId: v.id("plannerTasks") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireActiveUser(ctx);
    const task = await ctx.db.get(args.taskId);
    if (!task || task.userId !== user._id) {
      throw new Error("TASK_NOT_FOUND");
    }
    await ctx.db.patch(task._id, {
      status: "cancelled",
      completedAt: undefined,
      updatedAt: Date.now(),
    });
    return null;
  },
});
