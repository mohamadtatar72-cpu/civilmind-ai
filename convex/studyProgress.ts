import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireActiveUser } from "./lib/auth";

const sourceValidator = v.union(
  v.literal("manual"),
  v.literal("planner"),
  v.literal("pdf"),
);

const progressValidator = v.object({
  topicKey: v.string(),
  topicTitle: v.string(),
  studyMinutes: v.number(),
  sessionsCount: v.number(),
  testsCount: v.number(),
  questionsAnswered: v.number(),
  correctAnswers: v.number(),
  masteryPercent: v.number(),
  updatedAt: v.number(),
});

const studySessionValidator = v.object({
  id: v.id("studySessions"),
  topicKey: v.string(),
  topicTitle: v.string(),
  durationMinutes: v.number(),
  source: sourceValidator,
  notes: v.optional(v.string()),
  studiedAt: v.number(),
});

const practiceAttemptValidator = v.object({
  id: v.id("practiceAttempts"),
  topicKey: v.string(),
  topicTitle: v.string(),
  totalQuestions: v.number(),
  correctAnswers: v.number(),
  incorrectAnswers: v.number(),
  unanswered: v.number(),
  durationSeconds: v.number(),
  scorePercent: v.number(),
  completedAt: v.number(),
});

function normalizeTopicKey(value: string) {
  const normalized = value.toLowerCase().replace(/\s+/g, "-").trim();
  if (!/^[a-z0-9\u0600-\u06ff-]{2,80}$/.test(normalized)) {
    throw new Error("INVALID_TOPIC_KEY");
  }
  return normalized;
}

function normalizeTitle(value: string) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length < 2 || normalized.length > 120) {
    throw new Error("INVALID_TOPIC_TITLE");
  }
  return normalized;
}

function calculateMastery(
  studyMinutes: number,
  questionsAnswered: number,
  correctAnswers: number,
) {
  const studyScore = Math.min(100, Math.round((studyMinutes / 600) * 100));
  const accuracyScore =
    questionsAnswered === 0
      ? 0
      : Math.round((correctAnswers / questionsAnswered) * 100);
  return Math.round(studyScore * 0.3 + accuracyScore * 0.7);
}

async function upsertProgress(
  ctx: Parameters<(typeof mutation)["handler"]>[0],
  args: {
    userId: any;
    topicKey: string;
    topicTitle: string;
    studyMinutesDelta: number;
    sessionsDelta: number;
    testsDelta: number;
    questionsDelta: number;
    correctDelta: number;
  },
) {
  const existing = await ctx.db
    .query("userTopicProgress")
    .withIndex("by_userId_and_topicKey", (q) =>
      q.eq("userId", args.userId).eq("topicKey", args.topicKey),
    )
    .unique();

  const next = {
    studyMinutes: (existing?.studyMinutes ?? 0) + args.studyMinutesDelta,
    sessionsCount: (existing?.sessionsCount ?? 0) + args.sessionsDelta,
    testsCount: (existing?.testsCount ?? 0) + args.testsDelta,
    questionsAnswered: (existing?.questionsAnswered ?? 0) + args.questionsDelta,
    correctAnswers: (existing?.correctAnswers ?? 0) + args.correctDelta,
  };
  const patch = {
    userId: args.userId,
    topicKey: args.topicKey,
    topicTitle: args.topicTitle,
    ...next,
    masteryPercent: calculateMastery(
      next.studyMinutes,
      next.questionsAnswered,
      next.correctAnswers,
    ),
    updatedAt: Date.now(),
  };

  if (existing) {
    await ctx.db.patch(existing._id, patch);
    return existing._id;
  }
  return await ctx.db.insert("userTopicProgress", patch);
}

export const logStudySession = mutation({
  args: {
    topicKey: v.string(),
    topicTitle: v.string(),
    durationMinutes: v.number(),
    source: sourceValidator,
    notes: v.optional(v.string()),
    studiedAt: v.number(),
  },
  returns: v.id("studySessions"),
  handler: async (ctx, args) => {
    const user = await requireActiveUser(ctx);
    if (
      !Number.isInteger(args.durationMinutes) ||
      args.durationMinutes < 1 ||
      args.durationMinutes > 720
    ) {
      throw new Error("INVALID_DURATION");
    }
    if (!Number.isFinite(args.studiedAt) || args.studiedAt > Date.now() + 300000) {
      throw new Error("INVALID_STUDIED_AT");
    }
    const topicKey = normalizeTopicKey(args.topicKey);
    const topicTitle = normalizeTitle(args.topicTitle);
    const notes = args.notes?.replace(/\s+/g, " ").trim();
    if (notes && notes.length > 500) throw new Error("INVALID_NOTES");

    const id = await ctx.db.insert("studySessions", {
      userId: user._id,
      topicKey,
      topicTitle,
      durationMinutes: args.durationMinutes,
      source: args.source,
      notes: notes || undefined,
      studiedAt: args.studiedAt,
      createdAt: Date.now(),
    });
    await upsertProgress(ctx, {
      userId: user._id,
      topicKey,
      topicTitle,
      studyMinutesDelta: args.durationMinutes,
      sessionsDelta: 1,
      testsDelta: 0,
      questionsDelta: 0,
      correctDelta: 0,
    });
    return id;
  },
});

export const logPracticeAttempt = mutation({
  args: {
    topicKey: v.string(),
    topicTitle: v.string(),
    totalQuestions: v.number(),
    correctAnswers: v.number(),
    incorrectAnswers: v.number(),
    unanswered: v.number(),
    durationSeconds: v.number(),
    completedAt: v.number(),
  },
  returns: v.id("practiceAttempts"),
  handler: async (ctx, args) => {
    const user = await requireActiveUser(ctx);
    const counts = [
      args.totalQuestions,
      args.correctAnswers,
      args.incorrectAnswers,
      args.unanswered,
      args.durationSeconds,
    ];
    if (counts.some((value) => !Number.isInteger(value) || value < 0)) {
      throw new Error("INVALID_ATTEMPT");
    }
    if (
      args.totalQuestions < 1 ||
      args.totalQuestions > 500 ||
      args.correctAnswers + args.incorrectAnswers + args.unanswered !==
        args.totalQuestions ||
      args.durationSeconds > 86400 ||
      !Number.isFinite(args.completedAt) ||
      args.completedAt > Date.now() + 300000
    ) {
      throw new Error("INVALID_ATTEMPT");
    }
    const topicKey = normalizeTopicKey(args.topicKey);
    const topicTitle = normalizeTitle(args.topicTitle);
    const scorePercent = Math.round(
      (args.correctAnswers / args.totalQuestions) * 100,
    );

    const id = await ctx.db.insert("practiceAttempts", {
      userId: user._id,
      topicKey,
      topicTitle,
      totalQuestions: args.totalQuestions,
      correctAnswers: args.correctAnswers,
      incorrectAnswers: args.incorrectAnswers,
      unanswered: args.unanswered,
      durationSeconds: args.durationSeconds,
      scorePercent,
      completedAt: args.completedAt,
      createdAt: Date.now(),
    });
    await upsertProgress(ctx, {
      userId: user._id,
      topicKey,
      topicTitle,
      studyMinutesDelta: 0,
      sessionsDelta: 0,
      testsDelta: 1,
      questionsDelta: args.totalQuestions - args.unanswered,
      correctDelta: args.correctAnswers,
    });
    return id;
  },
});

export const getMyProgress = query({
  args: {},
  returns: v.object({
    totals: v.object({
      studyMinutes: v.number(),
      sessionsCount: v.number(),
      testsCount: v.number(),
      questionsAnswered: v.number(),
      correctAnswers: v.number(),
      accuracyPercent: v.number(),
    }),
    topics: v.array(progressValidator),
    recentStudy: v.array(studySessionValidator),
    recentAttempts: v.array(practiceAttemptValidator),
  }),
  handler: async (ctx) => {
    const user = await requireActiveUser(ctx);
    const [topics, sessions, attempts] = await Promise.all([
      ctx.db
        .query("userTopicProgress")
        .withIndex("by_userId_and_updatedAt", (q) => q.eq("userId", user._id))
        .order("desc")
        .take(100),
      ctx.db
        .query("studySessions")
        .withIndex("by_userId_and_studiedAt", (q) => q.eq("userId", user._id))
        .order("desc")
        .take(20),
      ctx.db
        .query("practiceAttempts")
        .withIndex("by_userId_and_completedAt", (q) => q.eq("userId", user._id))
        .order("desc")
        .take(20),
    ]);

    const totals = topics.reduce(
      (sum, topic) => ({
        studyMinutes: sum.studyMinutes + topic.studyMinutes,
        sessionsCount: sum.sessionsCount + topic.sessionsCount,
        testsCount: sum.testsCount + topic.testsCount,
        questionsAnswered: sum.questionsAnswered + topic.questionsAnswered,
        correctAnswers: sum.correctAnswers + topic.correctAnswers,
      }),
      {
        studyMinutes: 0,
        sessionsCount: 0,
        testsCount: 0,
        questionsAnswered: 0,
        correctAnswers: 0,
      },
    );

    return {
      totals: {
        ...totals,
        accuracyPercent:
          totals.questionsAnswered === 0
            ? 0
            : Math.round(
                (totals.correctAnswers / totals.questionsAnswered) * 100,
              ),
      },
      topics: topics.map((topic) => ({
        topicKey: topic.topicKey,
        topicTitle: topic.topicTitle,
        studyMinutes: topic.studyMinutes,
        sessionsCount: topic.sessionsCount,
        testsCount: topic.testsCount,
        questionsAnswered: topic.questionsAnswered,
        correctAnswers: topic.correctAnswers,
        masteryPercent: topic.masteryPercent,
        updatedAt: topic.updatedAt,
      })),
      recentStudy: sessions.map((session) => ({
        id: session._id,
        topicKey: session.topicKey,
        topicTitle: session.topicTitle,
        durationMinutes: session.durationMinutes,
        source: session.source,
        notes: session.notes,
        studiedAt: session.studiedAt,
      })),
      recentAttempts: attempts.map((attempt) => ({
        id: attempt._id,
        topicKey: attempt.topicKey,
        topicTitle: attempt.topicTitle,
        totalQuestions: attempt.totalQuestions,
        correctAnswers: attempt.correctAnswers,
        incorrectAnswers: attempt.incorrectAnswers,
        unanswered: attempt.unanswered,
        durationSeconds: attempt.durationSeconds,
        scorePercent: attempt.scorePercent,
        completedAt: attempt.completedAt,
      })),
    };
  },
});
