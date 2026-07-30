import type { DashboardReadModel } from "@/features/dashboard/domain";

const mockTopicProgress: DashboardReadModel["topics"] = [
  { id: 1, title: "مبحث ۱ - تعاریف", progress: 100, hasPdf: true, questionCount: 80 },
  { id: 2, title: "مبحث ۲ - نظامات اداری", progress: 90, hasPdf: true, questionCount: 60 },
  { id: 3, title: "مبحث ۳ - حفاظت ساختمان‌ها در مقابل حریق", progress: 75, hasPdf: true, questionCount: 150 },
  { id: 4, title: "مبحث ۴ - الزامات عمومی ساختمان", progress: 60, hasPdf: true, questionCount: 120 },
  { id: 5, title: "مبحث ۵ - مصالح و فرآورده‌های ساختمانی", progress: 40, hasPdf: true, questionCount: 100 },
  { id: 6, title: "مبحث ۶ - بارهای وارد بر ساختمان", progress: 55, hasPdf: true, questionCount: 180 },
  { id: 7, title: "مبحث ۷ - پی و پی‌سازی", progress: 20, hasPdf: true, questionCount: 140 },
  { id: 8, title: "مبحث ۸ - ساختمان‌های با مصالح بنایی", progress: 30, hasPdf: true, questionCount: 130 },
  { id: 9, title: "مبحث ۹ - ساختمان‌های بتن‌آرمه", progress: 95, hasPdf: true, questionCount: 250 },
  { id: 10, title: "مبحث ۱۰ - ساختمان‌های فولادی", progress: 80, hasPdf: true, questionCount: 220 },
];

export const dashboardData: DashboardReadModel = {
  readiness: {
    examTitle: "آزمون ورود به حرفه مهندسان عمران — نظارت و اجرا",
    daysLeft: 87,
    percentage: 71,
    passProbability: 82,
    predictedBand: "A+",
  },
  metrics: [
    { id: "topics", label: "مباحث مطالعه‌شده", value: "۹ مبحث", detail: "داده نمایشی — در حال توسعه", tone: "blue" },
    { id: "questions", label: "سؤال حل‌شده", value: "۱٬۳۲۰", detail: "۱۸۰ سؤال این ماه", tone: "violet" },
    { id: "readiness", label: "آمادگی آزمون", value: "۷۱٪", detail: "۶٪ رشد در ۳۰ روز", tone: "green" },
    { id: "documents", label: "منابع PDF", value: "۲۴", detail: "همگام با مرکز دانش", tone: "amber" },
  ],
  topics: mockTopicProgress,
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
