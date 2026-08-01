"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import AppShell from "@/components/layout/app-shell";
import {
  GlassPanel,
  MetricCard,
  PageHeader,
  SectionTitle,
  StatusBadge,
} from "@/components/ui/civilmind";
import { api } from "@/convex/_generated/api";
import { useCurrentAccount } from "@/features/auth/convex-repository";
import {
  canAccessCapability,
  accessTierForRole,
} from "@/lib/access/capabilities";

const suggestions = [
  "خلاصه مبحث ۹ بتن",
  "تحلیل آزمون اخیر",
  "برنامه مطالعه امروز",
  "سؤال از منابع PDF",
];

type GatewayStatus = {
  role: "free" | "premium" | "admin";
  dayKey: string;
  dailyQuota: number;
  usedToday: number;
  remainingToday: number;
  maxInputCharacters: number;
  maxOutputTokens: number;
  gatewayReady: boolean;
  providers: Array<{
    provider: "openai" | "gemini" | "anthropic";
    displayName: string;
    enabled: boolean;
    adapterReady: boolean;
    routePriority: number;
    modelAlias: string;
    monthlyBudgetMicrousd: number;
    spendMicrousd: number;
    circuitStatus: "closed" | "open" | "half-open" | "disabled";
    cooldownUntil?: number;
  }>;
};

export default function AIPage() {
  const account = useCurrentAccount();
  const entitlement = useQuery(api.access.current, {});
  const gateway = useQuery(
    api.aiGateway.currentStatus,
    account.isAuthenticated && !account.loading ? {} : "skip",
  ) as GatewayStatus | undefined;
  const createIntent = useMutation(api.aiGateway.createRequestIntent);
  const [question, setQuestion] = useState("");
  const [message, setMessage] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const normalized = question.trim();
    if (!normalized) {
      setMessage("لطفاً ابتدا سؤال خود را بنویسید.");
      return;
    }
    const tier = entitlement?.tier ?? accessTierForRole(account.user?.role);
    const canUseChat = entitlement
      ? entitlement.capabilities.aiChat
      : canAccessCapability(tier, "ai.chat");
    if (!canUseChat) {
      setMessage("این قابلیت به حساب کاربری فعال نیاز دارد.");
      return;
    }
    if (!account.isAuthenticated) {
      setMessage("برای استفاده از سهمیه شخصی ابتدا وارد حساب شوید.");
      return;
    }

    setSubmitting(true);
    setMessage(undefined);
    try {
      const result = await createIntent({
        capability: "study-coach",
        idempotencyKey: crypto.randomUUID(),
        inputCharacters: normalized.length,
      });
      setMessage(
        result.request.status === "blocked"
          ? "زیرساخت امن Gateway درخواست را بررسی کرد، اما Adapter هیچ ارائه‌دهنده‌ای هنوز فعال نیست. متن سؤال ارسال یا در Backend ذخیره نشد."
          : "درخواست در Ledger امن ثبت شد و برای Adapter آماده است؛ متن سؤال همچنان فقط در مرورگر نگه‌داری می‌شود.",
      );
    } catch (error) {
      const code = error instanceof Error ? error.message : "";
      setMessage(
        code.includes("AI_DAILY_QUOTA_EXCEEDED")
          ? "سهمیه امروز این حساب به پایان رسیده است."
          : code.includes("CAPABILITY_PREMIUM_REQUIRED")
            ? "این نوع تحلیل در اشتراک Premium فعال است؛ گفت‌وگوی پایه همچنان در سهمیه رایگان شما در دسترس است."
          : code.includes("AI_INPUT_SIZE_INVALID")
            ? "طول سؤال بیشتر از سقف مجاز Gateway است."
            : "بررسی درخواست انجام نشد؛ وضعیت حساب و اتصال Convex بررسی شود.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          eyebrow="مربی هوشمند"
          title="همراه مطالعاتی CivilMind"
          description="Gateway امن، سهمیه و کنترل هزینه آماده شده است؛ اتصال Adapter مدل‌ها در Sprint بعدی فعال می‌شود."
          action={
            <StatusBadge tone={gateway?.gatewayReady ? "success" : "info"}>
              {gateway?.gatewayReady ? "Gateway آماده" : "Adapter در حال توسعه"}
            </StatusBadge>
          }
        />

        {account.isAuthenticated ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              label="سهمیه روزانه"
              value={gateway ? String(gateway.dailyQuota) : "…"}
              detail="تعداد درخواست مجاز"
            />
            <MetricCard
              label="مصرف امروز"
              value={gateway ? String(gateway.usedToday) : "…"}
              detail="همه Intentهای بررسی‌شده"
              tone="amber"
            />
            <MetricCard
              label="باقی‌مانده"
              value={gateway ? String(gateway.remainingToday) : "…"}
              detail="براساس نقش حساب"
              tone="green"
            />
            <MetricCard
              label="Provider آماده"
              value={gateway ? String(gateway.providers.filter((item) => item.adapterReady).length) : "…"}
              detail="کلیدها هرگز به مرورگر نمی‌آیند"
              tone="violet"
            />
          </div>
        ) : (
          <GlassPanel className="border-blue-400/20 bg-blue-400/5">
            <p className="text-sm leading-7 text-blue-100/75">
              برای مشاهده سهمیه و وضعیت Gateway وارد حساب شوید. ورود به حساب به‌تنهایی
              هیچ کلید ارائه‌دهنده‌ای را در مرورگر قرار نمی‌دهد.
            </p>
            <Link
              href="/sign-in"
              className="mt-4 inline-flex rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-400"
            >
              ورود امن
            </Link>
          </GlassPanel>
        )}

        <GlassPanel>
          <form onSubmit={submit}>
            <label htmlFor="coach-question" className="font-bold">
              سؤال شما
            </label>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <input
                id="coach-question"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                maxLength={gateway?.maxInputCharacters ?? 12_000}
                placeholder="سؤال خود را درباره عمران و آزمون بنویسید…"
                className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/20 px-4 py-3 outline-none focus:border-blue-400/50"
              />
              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-blue-500 px-6 py-3 font-bold hover:bg-blue-400 disabled:opacity-50"
              >
                {submitting ? "در حال بررسی…" : "بررسی امن پرسش"}
              </button>
            </div>
            <p className="mt-3 text-xs leading-6 text-slate-500">
              در Sprint 1E فقط طول درخواست و شناسه idempotency بررسی می‌شود؛ متن سؤال
              در Database ذخیره نمی‌شود و تا آماده‌شدن Adapter برای Provider ارسال نمی‌شود.
            </p>
            {message && (
              <p
                role="status"
                className="mt-4 rounded-xl border border-blue-400/15 bg-blue-400/5 p-3 text-sm leading-6 text-blue-200"
              >
                {message}
              </p>
            )}
          </form>
        </GlassPanel>

        <GlassPanel>
          <SectionTitle
            title="پیشنهادهای سریع"
            description="انتخاب هر مورد، متن پیشنهادی را فقط در کادر مرورگر قرار می‌دهد."
          />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {suggestions.map((item) => (
              <button
                type="button"
                key={item}
                onClick={() => {
                  setQuestion(item);
                  setMessage(undefined);
                }}
                className="rounded-xl border border-white/10 bg-white/4 p-4 text-right text-sm font-semibold hover:border-blue-400/30 hover:bg-blue-400/5"
              >
                {item}
              </button>
            ))}
          </div>
        </GlassPanel>
      </div>
    </AppShell>
  );
}
