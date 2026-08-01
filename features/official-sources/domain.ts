export type OfficialResourceCategory =
  | "official-home"
  | "exam-center"
  | "exam-materials"
  | "past-exams"
  | "answer-guides"
  | "regulations"
  | "corrections"
  | "exam-notice";

export type OfficialResourceStatus =
  | "verified"
  | "pending-review"
  | "outdated";

export interface OfficialResource {
  key: string;
  title: string;
  description: string;
  category: OfficialResourceCategory;
  sourcePublisher: string;
  sourceDomain: string;
  sourceUrl: string;
  status: OfficialResourceStatus;
  isActive: boolean;
  order: number;
  lastVerifiedAt?: number;
  lastSyncStatus?: "baseline" | "unchanged" | "pending-review" | "quarantined" | "failed";
}

export const officialResourceCategoryLabels: Record<
  OfficialResourceCategory,
  string
> = {
  "official-home": "درگاه رسمی",
  "exam-center": "مرکز آزمون",
  "exam-materials": "مواد آزمون",
  "past-exams": "آزمون‌های گذشته",
  "answer-guides": "راهنمای پاسخ",
  regulations: "مقررات ملی",
  corrections: "اصلاحیه‌ها",
  "exam-notice": "اطلاعیه آزمون",
};
