import type { DashboardReadModel } from "@/features/dashboard/domain";
import { topics } from "./library";

export const dashboardData: DashboardReadModel = {
  readiness: {
    examTitle: "آزمون ورود به حرفه مهندسان عمران — نظارت و اجرا",
    daysLeft: 87,
    percentage: 71,
    passProbability: 82,
    predictedBand: "A+",
  },
  metrics: [
    { id: "topics", label: "مباحث مطالعه‌شده", value: "۹ از ۲۲", detail: "۴۱٪ پوشش منابع", tone: "blue" },
    { id: "questions", label: "سؤال حل‌شده", value: "۱٬۳۲۰", detail: "۱۸۰ سؤال این ماه", tone: "violet" },
    { id: "readiness", label: "آمادگی آزمون", value: "۷۱٪", detail: "۶٪ رشد در ۳۰ روز", tone: "green" },
    { id: "documents", label: "منابع PDF", value: "۲۴", detail: "همگام با مرکز دانش", tone: "amber" },
  ],
  topics: topics.slice(0, 10).map((topic) => ({
    id: topic.id, title: topic.title, progress: topic.progress,
    hasPdf: topic.pdf, questionCount: topic.questions,
  })),
  tasks: [
    { id: "concrete", title: "مطالعه مبحث ۹ (بتن)", progress: 80, status: "in-progress" },
    { id: "exam-12", title: "حل آزمون شماره ۱۲", progress: 40, status: "in-progress" },
    { id: "foundation", title: "مرور مبحث ۷ (پی)", progress: 20, status: "needs-focus" },
    { id: "mistakes", title: "مرور اشتباهات آزمون", progress: 65, status: "in-progress" },
  ],
  weeklyProgress: [
    { day: "شنبه", value: 55 }, { day: "یکشنبه", value: 60 },
    { day: "دوشنبه", value: 65 }, { day: "سه‌شنبه", value: 68 },
    { day: "چهارشنبه", value: 71 },
  ],
  activities: [
    { id: "study-9", title: "مطالعه مبحث ۹ بتن", status: "تکمیل شد", relativeTime: "امروز" },
    { id: "exam-5", title: "آزمون جامع شماره ۵", status: "تکمیل شد", relativeTime: "دیروز" },
    { id: "upload-7", title: "بارگذاری PDF مبحث ۷", status: "انجام شد", relativeTime: "۲ روز قبل" },
  ],
};
