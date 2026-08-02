export const REGULATION_EXPLANATION_LEVELS = [
  "simple",
  "exam",
  "professional",
] as const;

export type RegulationExplanationLevel =
  (typeof REGULATION_EXPLANATION_LEVELS)[number];

export type RegulationSource = {
  documentTitle: string;
  edition: string;
  page?: number;
  clause?: string;
  sourceUrl: string;
  officialText: string;
};

export type RegulationExplainerStatus =
  | "idle"
  | "loading"
  | "success"
  | "no-source"
  | "provider-missing"
  | "entitlement-required"
  | "retryable-error";

export type RegulationExplanationResult = {
  status: RegulationExplainerStatus;
  text?: string;
};

export const REGULATION_LEVEL_LABELS: Record<
  RegulationExplanationLevel,
  string
> = {
  simple: "ساده و قابل‌فهم",
  exam: "مناسب آزمون",
  professional: "حرفه‌ای و اجرایی",
};

export const REGULATION_LEVEL_INSTRUCTIONS: Record<
  RegulationExplanationLevel,
  string
> = {
  simple:
    "مطلب را با زبان ساده، جمله‌های کوتاه و بدون حذف مفهوم حقوقی یا فنی توضیح بده.",
  exam:
    "مطلب را برای آمادگی آزمون توضیح بده؛ نکات پرتکرار، دام‌های آزمونی و واژه‌های کلیدی را مشخص کن.",
  professional:
    "مطلب را از دید حرفه‌ای و اجرایی توضیح بده؛ حدود کاربرد، مسئولیت‌ها، ریسک اجرا و موارد نیازمند بررسی مهندس مسئول را روشن کن.",
};

export function hasVerifiedRegulationSource(
  source: RegulationSource | null | undefined,
): source is RegulationSource {
  return Boolean(
    source?.documentTitle.trim() &&
      source?.edition.trim() &&
      source?.sourceUrl.trim() &&
      source?.officialText.trim(),
  );
}

export function createRegulationExplanationPrompt(args: {
  level: RegulationExplanationLevel;
  question: string;
  source: RegulationSource;
}) {
  const { level, question, source } = args;

  if (!hasVerifiedRegulationSource(source)) {
    throw new Error("VERIFIED_SOURCE_REQUIRED");
  }

  return [
    "نقش تو توضیح‌دهنده مقررات مهندسی CivilMind AI است.",
    "متن رسمی و توضیح CivilMind AI را کاملاً جدا نگه دار.",
    "فقط بر اساس متن رسمی و فراداده همین ورودی پاسخ بده.",
    "هیچ بند، صفحه، ویرایش، حکم، تفسیر رسمی یا منبعی اختراع نکن.",
    "اگر متن برای پاسخ کافی نیست، صریحاً اعلام کن که مرجع کافی نیست.",
    "",
    `سطح توضیح: ${REGULATION_LEVEL_LABELS[level]}`,
    REGULATION_LEVEL_INSTRUCTIONS[level],
    "",
    `پرسش کاربر: ${question}`,
    "",
    "مرجع رسمی:",
    `سند: ${source.documentTitle}`,
    `ویرایش: ${source.edition}`,
    `صفحه: ${source.page ?? "ثبت نشده"}`,
    `بند: ${source.clause ?? "ثبت نشده"}`,
    `پیوند: ${source.sourceUrl}`,
    "",
    "متن رسمی:",
    source.officialText,
    "",
    "ساختار پاسخ:",
    "1. توضیح CivilMind AI",
    "2. نکات کلیدی",
    "3. محدودیت یا عدم قطعیت",
    "4. ارجاع دقیق به سند ورودی",
  ].join("\n");
}

export function classifyRegulationExplainerError(
  message: string,
): RegulationExplainerStatus {
  const normalized = message.toUpperCase();

  if (
    normalized.includes("PROVIDER_NOT_CONFIGURED") ||
    normalized.includes("AI_PROVIDER_MISSING") ||
    normalized.includes("MODEL_PROVIDER_MISSING") ||
    normalized.includes("ADAPTER_NOT_CONFIGURED")
  ) {
    return "provider-missing";
  }

  if (
    normalized.includes("PREMIUM_REQUIRED") ||
    normalized.includes("ENTITLEMENT_REQUIRED") ||
    normalized.includes("UNAUTHENTICATED")
  ) {
    return "entitlement-required";
  }

  return "retryable-error";
}
