export type CivilMindRole = "free" | "premium" | "admin";
export type CivilMindUserStatus = "active" | "suspended" | "deleted";
export type CivilMindPlan = "free" | "premium";
export type CivilMindSubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "expired";

export interface CivilMindUser {
  id: string;
  email?: string;
  displayName?: string;
  imageUrl?: string;
  role: CivilMindRole;
  status: CivilMindUserStatus;
  onboardingCompleted: boolean;
  plan: CivilMindPlan;
  subscriptionStatus: CivilMindSubscriptionStatus;
  createdAt: number;
  lastSeenAt?: number;
}

export const roleLabels: Record<CivilMindRole, string> = {
  free: "رایگان",
  premium: "حرفه‌ای",
  admin: "مدیر",
};

export const userStatusLabels: Record<CivilMindUserStatus, string> = {
  active: "فعال",
  suspended: "تعلیق‌شده",
  deleted: "حذف‌شده",
};

export const subscriptionStatusLabels: Record<
  CivilMindSubscriptionStatus,
  string
> = {
  active: "فعال",
  trialing: "آزمایشی",
  past_due: "نیازمند پرداخت",
  canceled: "لغوشده",
  expired: "منقضی",
};
