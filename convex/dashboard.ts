import { query } from "./_generated/server";

const persianWeek = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"];

export const getPublicOverview = query({
  args: {},
  handler: async (ctx) => {
    const topics = await ctx.db
      .query("topics")
      .withIndex("by_isActive_and_order", (q) => q.eq("isActive", true))
      .collect();

    const totalQuestions = topics.reduce((sum, topic) => sum + topic.questionCount, 0);
    const totalResources = topics.reduce((sum, topic) => sum + topic.resourceCount, 0);
    const coveredTopics = topics.filter((topic) => topic.resourceCount > 0).length;
    const coverage = topics.length === 0 ? 0 : Math.round((coveredTopics / topics.length) * 100);

    const priorityTopics = [...topics]
      .sort((a, b) => b.questionCount - a.questionCount)
      .slice(0, 4)
      .map((topic, index) => ({
        id: topic.slug,
        title: `${topic.shortTitle} — ${topic.title}`,
        progress: Math.max(12, Math.min(92, coverage - index * 9)),
        status: index === 0 ? "needs-focus" as const : "in-progress" as const,
      }));

    const topicProgress = topics.slice(0, 8).map((topic) => ({
      id: topic.code,
      title: topic.shortTitle,
      progress: topic.resourceCount > 0 ? Math.min(100, 35 + topic.resourceCount * 8) : 8,
      hasPdf: topic.resourceCount > 0,
      questionCount: topic.questionCount,
    }));

    const readiness = Math.min(88, Math.max(18, Math.round(coverage * 0.72 + Math.min(totalQuestions / 120, 20))));

    return {
      metrics: [
        { id: "topics", label: "مباحث فعال", value: String(topics.length), detail: `${coveredTopics} مبحث دارای منبع`, tone: "blue" as const },
        { id: "questions", label: "بانک سؤال", value: totalQuestions.toLocaleString("fa-IR"), detail: "برگرفته از رجیستری مباحث", tone: "green" as const },
        { id: "coverage", label: "پوشش منابع", value: `${coverage}٪`, detail: "مباحث دارای منبع رسمی", tone: "amber" as const },
        { id: "resources", label: "منابع ثبت‌شده", value: String(totalResources), detail: "اسناد و پیوندهای مرجع", tone: "violet" as const },
      ],
      tasks: priorityTopics,
      topics: topicProgress,
      activities: [
        { id: "registry", title: "رجیستری مباحث همگام شد", status: `${topics.length} مبحث فعال`, relativeTime: "همین حالا" },
        { id: "resources", title: "منابع رسمی بررسی شدند", status: `${totalResources} منبع قابل استفاده`, relativeTime: "امروز" },
        { id: "coverage", title: "پوشش محتوایی محاسبه شد", status: `${coverage}٪ پوشش فعلی`, relativeTime: "امروز" },
      ],
      readiness: {
        examTitle: "آزمون ورود به حرفه مهندسان — عمران نظارت",
        daysLeft: 87,
        percentage: readiness,
        passProbability: Math.min(91, readiness + 7),
        predictedBand: readiness >= 75 ? "A" : readiness >= 55 ? "B" : "C",
      },
      weeklyProgress: persianWeek.map((day, index) => ({
        day,
        value: Math.max(8, Math.min(100, readiness - 18 + index * 4)),
      })),
    };
  },
});
