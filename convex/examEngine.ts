import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { requireActiveUser } from "./lib/auth";

const QUESTIONS = [
  { key: "math-1", topicKey: "engineering-math", topicTitle: "ریاضی مهندسی", stem: "بیست‌وپنج درصد از مقدار ۸۰ چند است؟", options: ["۱۰", "۲۰", "۲۵", "۴۰"], correctIndex: 1, explanation: "یک‌چهارم ۸۰ برابر ۲۰ است." },
  { key: "units-1", topicKey: "units", topicTitle: "واحدها و مقیاس", stem: "طول ۲٫۵ متر چند سانتی‌متر است؟", options: ["۲۵", "۲۵۰", "۲۵۰۰", "۰٫۲۵"], correctIndex: 1, explanation: "هر متر ۱۰۰ سانتی‌متر است." },
  { key: "scale-1", topicKey: "technical-drawing", topicTitle: "نقشه‌خوانی فنی", stem: "در مقیاس ۱:۱۰۰، طول ۵ سانتی‌متر روی نقشه در واقعیت چند متر است؟", options: ["۰٫۵", "۵", "۵۰", "۵۰۰"], correctIndex: 1, explanation: "۵۰۰ سانتی‌متر برابر ۵ متر است." },
  { key: "statics-1", topicKey: "statics", topicTitle: "استاتیک", stem: "در تیر دوسر ساده با بار متمرکز P در وسط دهانه، واکنش هر تکیه‌گاه چقدر است؟", options: ["P", "P/2", "P/4", "2P"], correctIndex: 1, explanation: "به‌دلیل تقارن، سهم هر تکیه‌گاه P/2 است." },
  { key: "safety-1", topicKey: "engineering-safety", topicTitle: "ایمنی مهندسی", stem: "در سلسله‌مراتب کنترل خطر، مؤثرترین اقدام کدام است؟", options: ["حفاظت فردی", "تابلو هشدار", "حذف خطر", "آموزش"], correctIndex: 2, explanation: "حذف خطر در رأس سلسله‌مراتب کنترل است." },
  { key: "quality-1", topicKey: "quality-control", topicTitle: "کنترل کیفیت", stem: "هدف اصلی نمونه‌برداری در کنترل کیفیت چیست؟", options: ["افزایش تولید", "برآورد جامعه با بررسی نمونه", "حذف همه خطاها", "حذف بازرسی"], correctIndex: 1, explanation: "نمونه نماینده برای استنباط درباره جامعه استفاده می‌شود." },
] as const;

const statusV = v.union(v.literal("in_progress"), v.literal("completed"), v.literal("abandoned"));
const itemV = v.object({
  id: v.id("examSessionItems"), topicKey: v.string(), topicTitle: v.string(),
  stem: v.string(), options: v.array(v.string()), position: v.number(),
  selectedIndex: v.optional(v.number()), isCorrect: v.optional(v.boolean()),
  correctIndex: v.optional(v.number()), explanation: v.optional(v.string()),
});
const sessionV = v.object({
  id: v.id("examSessions"), title: v.string(), status: statusV,
  totalQuestions: v.number(), durationSeconds: v.number(),
  correctAnswers: v.optional(v.number()), incorrectAnswers: v.optional(v.number()),
  unanswered: v.optional(v.number()), scorePercent: v.optional(v.number()),
  startedAt: v.number(), completedAt: v.optional(v.number()), items: v.array(itemV),
});
const topicV = v.object({
  topicKey: v.string(), topicTitle: v.string(), attemptsCount: v.number(),
  answeredCount: v.number(), correctCount: v.number(), incorrectCount: v.number(),
  accuracyPercent: v.number(), lastAttemptAt: v.number(),
});

function publicItem(item: Doc<"examSessionItems">, completed: boolean) {
  return {
    id: item._id, topicKey: item.topicKey, topicTitle: item.topicTitle,
    stem: item.stem, options: item.options, position: item.position,
    selectedIndex: item.selectedIndex,
    isCorrect: completed ? item.isCorrect : undefined,
    correctIndex: completed ? item.correctIndex : undefined,
    explanation: completed ? item.explanation : undefined,
  };
}

async function readSession(ctx: MutationCtx, session: Doc<"examSessions">) {
  const items = await ctx.db.query("examSessionItems")
    .withIndex("by_sessionId_and_position", q => q.eq("sessionId", session._id))
    .take(100);
  return {
    id: session._id, title: session.title, status: session.status,
    totalQuestions: session.totalQuestions, durationSeconds: session.durationSeconds,
    correctAnswers: session.correctAnswers, incorrectAnswers: session.incorrectAnswers,
    unanswered: session.unanswered, scorePercent: session.scorePercent,
    startedAt: session.startedAt, completedAt: session.completedAt,
    items: items.map(item => publicItem(item, session.status === "completed")),
  };
}

async function updateTopic(ctx: MutationCtx, userId: Id<"users">, topic: {
  topicKey: string; topicTitle: string; answered: number; correct: number; incorrect: number;
}, completedAt: number) {
  const existing = await ctx.db.query("examTopicStats")
    .withIndex("by_userId_and_topicKey", q => q.eq("userId", userId).eq("topicKey", topic.topicKey))
    .unique();
  const answeredCount = (existing?.answeredCount ?? 0) + topic.answered;
  const correctCount = (existing?.correctCount ?? 0) + topic.correct;
  const patch = {
    userId, topicKey: topic.topicKey, topicTitle: topic.topicTitle,
    attemptsCount: (existing?.attemptsCount ?? 0) + 1,
    answeredCount, correctCount,
    incorrectCount: (existing?.incorrectCount ?? 0) + topic.incorrect,
    accuracyPercent: answeredCount === 0 ? 0 : Math.round(correctCount / answeredCount * 100),
    lastAttemptAt: completedAt,
  };
  if (existing) await ctx.db.patch(existing._id, patch);
  else await ctx.db.insert("examTopicStats", patch);
}

export const startSampleExam = mutation({
  args: {}, returns: v.id("examSessions"),
  handler: async ctx => {
    const user = await requireActiveUser(ctx);
    const active = await ctx.db.query("examSessions")
      .withIndex("by_userId_and_status_and_startedAt", q => q.eq("userId", user._id).eq("status", "in_progress"))
      .order("desc").take(1);
    if (active[0]) return active[0]._id;
    const now = Date.now();
    const sessionId = await ctx.db.insert("examSessions", {
      userId: user._id, title: "آزمون نمونه مهندسی", status: "in_progress",
      totalQuestions: QUESTIONS.length, durationSeconds: 1200, startedAt: now, createdAt: now,
    });
    for (let position = 0; position < QUESTIONS.length; position += 1) {
      const q = QUESTIONS[position];
      await ctx.db.insert("examSessionItems", {
        sessionId, questionKey: q.key, topicKey: q.topicKey, topicTitle: q.topicTitle,
        stem: q.stem, options: [...q.options], correctIndex: q.correctIndex,
        explanation: q.explanation, position,
      });
    }
    return sessionId;
  },
});

export const getSession = query({
  args: { sessionId: v.id("examSessions") }, returns: sessionV,
  handler: async (ctx, args) => {
    const user = await requireActiveUser(ctx);
    const session = await ctx.db.get(args.sessionId);
    if (!session || session.userId !== user._id) throw new Error("EXAM_NOT_FOUND");
    const items = await ctx.db.query("examSessionItems")
      .withIndex("by_sessionId_and_position", q => q.eq("sessionId", session._id)).take(100);
    return {
      id: session._id, title: session.title, status: session.status,
      totalQuestions: session.totalQuestions, durationSeconds: session.durationSeconds,
      correctAnswers: session.correctAnswers, incorrectAnswers: session.incorrectAnswers,
      unanswered: session.unanswered, scorePercent: session.scorePercent,
      startedAt: session.startedAt, completedAt: session.completedAt,
      items: items.map(item => publicItem(item, session.status === "completed")),
    };
  },
});

export const submitExam = mutation({
  args: {
    sessionId: v.id("examSessions"),
    answers: v.array(v.object({ itemId: v.id("examSessionItems"), selectedIndex: v.optional(v.number()) })),
  },
  returns: sessionV,
  handler: async (ctx, args) => {
    const user = await requireActiveUser(ctx);
    const session = await ctx.db.get(args.sessionId);
    if (!session || session.userId !== user._id || session.status !== "in_progress") throw new Error("EXAM_NOT_AVAILABLE");
    if (args.answers.length !== session.totalQuestions || args.answers.length > 100) throw new Error("INVALID_ANSWER_SET");
    const answerMap = new Map(args.answers.map(answer => [answer.itemId, answer.selectedIndex]));
    if (answerMap.size !== args.answers.length) throw new Error("DUPLICATE_ANSWER");
    const items = await ctx.db.query("examSessionItems")
      .withIndex("by_sessionId_and_position", q => q.eq("sessionId", session._id)).take(100);
    if (items.length !== session.totalQuestions) throw new Error("EXAM_DATA_INCOMPLETE");

    let correctAnswers = 0, incorrectAnswers = 0, unanswered = 0;
    const topics = new Map<string, { topicKey: string; topicTitle: string; answered: number; correct: number; incorrect: number }>();
    for (const item of items) {
      if (!answerMap.has(item._id)) throw new Error("INVALID_ANSWER_ITEM");
      const selectedIndex = answerMap.get(item._id);
      if (selectedIndex !== undefined && (!Number.isInteger(selectedIndex) || selectedIndex < 0 || selectedIndex >= item.options.length)) throw new Error("INVALID_SELECTED_INDEX");
      const isCorrect = selectedIndex === item.correctIndex;
      if (selectedIndex === undefined) unanswered += 1;
      else if (isCorrect) correctAnswers += 1;
      else incorrectAnswers += 1;
      await ctx.db.patch(item._id, { selectedIndex, isCorrect: selectedIndex === undefined ? false : isCorrect });
      const topic = topics.get(item.topicKey) ?? { topicKey: item.topicKey, topicTitle: item.topicTitle, answered: 0, correct: 0, incorrect: 0 };
      if (selectedIndex !== undefined) {
        topic.answered += 1;
        if (isCorrect) topic.correct += 1; else topic.incorrect += 1;
      }
      topics.set(item.topicKey, topic);
    }
    const completedAt = Date.now();
    await ctx.db.patch(session._id, {
      status: "completed", correctAnswers, incorrectAnswers, unanswered,
      scorePercent: Math.round(correctAnswers / session.totalQuestions * 100), completedAt,
    });
    for (const topic of topics.values()) await updateTopic(ctx, user._id, topic, completedAt);
    return await readSession(ctx, (await ctx.db.get(session._id))!);
  },
});

export const getMyAnalytics = query({
  args: {},
  returns: v.object({
    summary: v.object({
      examsCount: v.number(), averageScore: v.number(), bestScore: v.number(),
      latestScore: v.number(), trendPoints: v.number(),
    }),
    topics: v.array(topicV),
    recentExams: v.array(v.object({
      id: v.id("examSessions"), title: v.string(), scorePercent: v.number(),
      correctAnswers: v.number(), incorrectAnswers: v.number(),
      unanswered: v.number(), completedAt: v.number(),
    })),
  }),
  handler: async ctx => {
    const user = await requireActiveUser(ctx);
    const [sessions, topics] = await Promise.all([
      ctx.db.query("examSessions")
        .withIndex("by_userId_and_status_and_startedAt", q => q.eq("userId", user._id).eq("status", "completed"))
        .order("desc").take(50),
      ctx.db.query("examTopicStats")
        .withIndex("by_userId_and_accuracyPercent", q => q.eq("userId", user._id)).take(100),
    ]);
    const scores = sessions.map(session => session.scorePercent ?? 0);
    const averageScore = scores.length === 0 ? 0 : Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const latestScore = scores[0] ?? 0;
    const previous = scores.length <= 1 ? latestScore : Math.round(scores.slice(1, 4).reduce((a, b) => a + b, 0) / Math.min(3, scores.length - 1));
    return {
      summary: {
        examsCount: sessions.length, averageScore,
        bestScore: scores.length === 0 ? 0 : Math.max(...scores),
        latestScore, trendPoints: scores.length <= 1 ? 0 : latestScore - previous,
      },
      topics: topics.map(topic => ({
        topicKey: topic.topicKey, topicTitle: topic.topicTitle,
        attemptsCount: topic.attemptsCount, answeredCount: topic.answeredCount,
        correctCount: topic.correctCount, incorrectCount: topic.incorrectCount,
        accuracyPercent: topic.accuracyPercent, lastAttemptAt: topic.lastAttemptAt,
      })).sort((a, b) => a.accuracyPercent - b.accuracyPercent),
      recentExams: sessions.map(session => ({
        id: session._id, title: session.title, scorePercent: session.scorePercent ?? 0,
        correctAnswers: session.correctAnswers ?? 0, incorrectAnswers: session.incorrectAnswers ?? 0,
        unanswered: session.unanswered ?? 0, completedAt: session.completedAt ?? session.startedAt,
      })),
    };
  },
});
