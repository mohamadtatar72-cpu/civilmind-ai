"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import Link from "next/link";
import { useAction, useMutation, useQuery } from "convex/react";
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

type Citation = {
  chunkId: string;
  documentId: string;
  documentTitle: string;
  documentVersion: number;
  pageNumber: number;
  citationLabel: string;
  excerpt: string;
  officialSourceUrl?: string;
};

export default function AIPage() {
  const account = useCurrentAccount();
  const entitlement = useQuery(api.access.current, {});
  const gateway = useQuery(
    api.aiGateway.currentStatus,
    account.isAuthenticated && !account.loading ? {} : "skip",
  ) as GatewayStatus | undefined;
  const submitAndExecute = useAction(api.aiRuntime.submitAndExecute);
  const searchWithCitations = useMutation(api.pdfLibrary.searchWithCitations);
  const [question, setQuestion] = useState("");
  const [message, setMessage] = useState<string>();
  const [answer, setAnswer] = useState<string>();
  const [citations, setCitations] = useState<Citation[]>([]);
  const [citationState, setCitationState] = useState<"idle" | "loading" | "empty" | "ready" | "error">("idle");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const normalized = question.trim();
    if (!normalized) {
      setMessage("لطفاً ابتدا سؤال خود را بنویسید.");
      return;
    }
    setSubmitting(true);
    setMessage(undefined);
    setAnswer(undefined);
    setCitations([]);
    setCitationState("loading");
    try {
      if (!account.isAuthenticated) {
        const retrieval = await searchWithCitations({ query: normalized, limit: 5 });
        setCitations(retrieval.citations as Citation[]);
        setCitationState(retrieval.citations.length ? "ready" : "empty");
        setMessage(
          retrieval.citations.length > 0
            ? "منابع رسمی مرتبط پیدا شد. برای گفت‌وگوی AI و پاسخ شخصی وارد حساب شوید."
            : "منبع رسمی مرتبطی در PDFهای پردازش‌شده پیدا نشد؛ بنابراین پاسخی تولید نمی‌شود.",
        );
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

      const retrieval = await searchWithCitations({ query: normalized, limit: 5 });
      setCitations(retrieval.citations as Citation[]);
      setCitationState(retrieval.citations.length ? "ready" : "empty");
      if (retrieval.citations.length === 0) {
        setMessage("منبع رسمی مرتبطی پیدا نشد؛ برای جلوگیری از پاسخ بدون استناد، تولید پاسخ متوقف شد.");
        return;
      }

      const sourceContext = (retrieval.citations as Citation[])
        .map((citation, index) =>
          `[منبع ${index + 1}] ${citation.documentTitle}، نسخه ${citation.documentVersion}، ${citation.citationLabel || `صفحه ${citation.pageNumber}`}\n${citation.excerpt}`,
        )
        .join("\n\n");
      const result = await submitAndExecute({
        capability: "study-coach",
        idempotencyKey: crypto.randomUUID(),
        userText: [
          "فقط بر اساس منابع رسمی زیر پاسخ بده. اگر شواهد کافی نیست، صریحاً عدم قطعیت را اعلام کن.",
          "متن رسمی را با توضیح CivilMind AI مخلوط نکن و در پاسخ به شماره منبع ارجاع بده.",
          `پرسش کاربر: ${normalized}`,
          sourceContext,
        ].join("\n\n"),
        requestedTools: ["official-sources-search"],
      });
      setAnswer(result.status === "completed" ? result.responseText : undefined);
      setMessage(
        result.status === "completed"
          ? "پاسخ مستند آماده شد. ارجاع‌ها را پیش از اتکا بررسی کنید."
          : result.status === "blocked"
            ? "منابع رسمی پیدا شدند، اما Adapter مدل فعال نیست؛ هیچ پاسخ ساختگی نمایش داده نمی‌شود."
            : "تولید پاسخ کامل نشد؛ منابع رسمی بازیابی‌شده همچنان در دسترس‌اند.",
      );
    } catch (error) {
      setCitationState("error");
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
              ابتدا فقط منابع قابل‌استناد بازیابی می‌شوند. بدون منبع، پاسخی به‌عنوان پاسخ
              مستند نمایش داده نخواهد شد.
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

        {citationState !== "idle" && citationState !== "ready" && (
          <GlassPanel className="border-blue-400/15 bg-blue-400/5 text-sm leading-7 text-blue-100">
            {citationState === "loading" && "در حال جست‌وجو در منابع رسمی و PDFهای قابل‌استناد…"}
            {citationState === "empty" && "برای این پرسش، منبع رسمیِ پردازش‌شده پیدا نشد؛ بنابراین پاسخ مستند تولید نمی‌شود."}
            {citationState === "error" && "بازیابی منبع انجام نشد؛ پاسخ AI بدون استناد نمایش داده نخواهد شد."}
          </GlassPanel>
        )}

        {answer && (
          <GlassPanel className="border-cyan-400/25 bg-cyan-400/5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <SectionTitle
                title="توضیح CivilMind AI"
                description="این متن تحلیل هوش مصنوعی است، نه متن یا پاسخ رسمی."
              />
              <StatusBadge tone="info">تحلیل AI با منبع</StatusBadge>
            </div>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-8 text-slate-100">
              {answer}
            </p>
            <p className="mt-4 rounded-xl border border-amber-300/20 bg-amber-300/5 p-3 text-xs leading-6 text-amber-100/80">
              برای تصمیم حرفه‌ای یا حقوقی، متن رسمی و صفحه‌های استنادشده را مستقیماً بررسی کنید.
            </p>
          </GlassPanel>
        )}

        {citations.length > 0 && (
          <GlassPanel>
            <SectionTitle
              title="منابع بازیابی‌شده"
              description="این استنادها از متن PDF پردازش‌شده می‌آیند؛ صفحه و منبع را پیش از اتکا بررسی کنید."
            />
            <div className="mt-4 space-y-3">
              {citations.map((citation) => (
                <article
                  key={citation.chunkId}
                  className="rounded-xl border border-white/10 bg-white/4 p-4"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-bold text-blue-100">{citation.documentTitle}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        نسخه {citation.documentVersion} · {citation.citationLabel || `صفحه ${citation.pageNumber}`}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/library/${citation.documentId}`}
                        className="rounded-lg border border-blue-400/25 px-3 py-1.5 text-xs font-bold text-blue-200 hover:border-blue-400/55 hover:bg-blue-400/10"
                      >
                        مشاهده در کتابخانه
                      </Link>
                      {citation.officialSourceUrl ? (
                        <a
                          href={citation.officialSourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-lg border border-emerald-400/25 px-3 py-1.5 text-xs font-bold text-emerald-200 hover:border-emerald-400/55 hover:bg-emerald-400/10"
                        >
                          منبع رسمی در صفحه {citation.pageNumber.toLocaleString("fa-IR")}
                        </a>
                      ) : null}
                    </div>
                  </div>
                  <p className="mt-2 text-sm leading-7 text-slate-300">{citation.excerpt}</p>
                  <p className="mt-3 text-xs leading-6 text-amber-100/75">
                    متن بالا «استخراج از منبع رسمی» است؛ هر توضیح CivilMind AI باید جداگانه و با برچسب تحلیل هوش مصنوعی نمایش داده شود.
                  </p>
                </article>
              ))}
            </div>
          </GlassPanel>
        )}

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
