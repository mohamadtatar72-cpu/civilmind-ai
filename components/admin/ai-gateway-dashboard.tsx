"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useCurrentAccount } from "@/features/auth/convex-repository";
import { AdminAccess } from "./admin-access";
import {
  GlassPanel,
  MetricCard,
  PageHeader,
  StatusBadge,
} from "@/components/ui/civilmind";

type Policy = {
  freeDailyRequests: number;
  premiumDailyRequests: number;
  adminDailyRequests: number;
  maxInputCharacters: number;
  maxOutputTokens: number;
  monthlyBudgetMicrousd: number;
  fallbackEnabled: boolean;
};

type Provider = {
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
};

function PolicyEditor({ policy }: { policy: Policy }) {
  const updatePolicy = useMutation(api.aiGateway.adminUpdatePolicy);
  const [form, setForm] = useState(policy);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string>();

  function updateNumber(key: keyof Policy, value: string) {
    setForm((current) => ({
      ...current,
      [key]: Number.parseInt(value || "0", 10),
    }));
  }

  async function save() {
    setSaving(true);
    setMessage(undefined);
    try {
      await updatePolicy(form);
      setMessage("سیاست سهمیه و بودجه با موفقیت ذخیره شد.");
    } catch {
      setMessage("ذخیره سیاست انجام نشد؛ ترتیب سهمیه‌ها و حدود عددی بررسی شود.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <GlassPanel>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-white">سیاست سهمیه و بودجه</h2>
          <p className="mt-1 text-sm text-slate-500">
            اعداد هزینه برحسب یک‌میلیونم دلار ذخیره می‌شوند و هیچ پرداختی در این Sprint انجام نمی‌شود.
          </p>
        </div>
        <StatusBadge tone="info">Policy Only</StatusBadge>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          ["freeDailyRequests", "سهمیه رایگان"],
          ["premiumDailyRequests", "سهمیه حرفه‌ای"],
          ["adminDailyRequests", "سهمیه مدیر"],
          ["maxInputCharacters", "حداکثر نویسه ورودی"],
          ["maxOutputTokens", "حداکثر توکن خروجی"],
          ["monthlyBudgetMicrousd", "بودجه ماهانه Microusd"],
        ].map(([key, label]) => (
          <label key={key} className="text-sm text-slate-400">
            {label}
            <input
              type="number"
              min={0}
              value={form[key as keyof Policy] as number}
              onChange={(event) =>
                updateNumber(key as keyof Policy, event.target.value)
              }
              className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2.5 text-white outline-none focus:border-blue-400/40"
            />
          </label>
        ))}
      </div>

      <label className="mt-4 flex items-center gap-3 text-sm text-slate-300">
        <input
          type="checkbox"
          checked={form.fallbackEnabled}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              fallbackEnabled: event.target.checked,
            }))
          }
        />
        Fallback کنترل‌شده مجاز باشد
      </label>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-400 disabled:opacity-50"
        >
          {saving ? "در حال ذخیره…" : "ذخیره سیاست"}
        </button>
        {message && <p className="text-sm text-slate-400">{message}</p>}
      </div>
    </GlassPanel>
  );
}

export default function AiGatewayDashboard() {
  const account = useCurrentAccount();
  const policy = useQuery(
    api.aiAdmin.getPolicy,
    account.isAdmin ? {} : "skip",
  ) as Policy | undefined;
  const providers = useQuery(
    api.aiGateway.adminListProviders,
    account.isAdmin ? {} : "skip",
  ) as Provider[] | undefined;
  const requests = useQuery(
    api.aiGateway.adminListRequests,
    account.isAdmin ? { limit: 25 } : "skip",
  );
  const initialize = useMutation(api.aiGateway.adminInitializeDefaults);
  const [initializing, setInitializing] = useState(false);
  const [message, setMessage] = useState<string>();

  async function initializeDefaults() {
    setInitializing(true);
    setMessage(undefined);
    try {
      const result = await initialize({});
      setMessage(
        `Policy: ${result.policyCreated ? "ساخته شد" : "موجود بود"}؛ Provider جدید: ${result.providersCreated}`,
      );
    } catch {
      setMessage("راه‌اندازی پیش‌فرض انجام نشد؛ دسترسی مدیر بررسی شود.");
    } finally {
      setInitializing(false);
    }
  }

  const activeProviders = providers?.filter(
    (provider) => provider.enabled && provider.adapterReady,
  ).length ?? 0;
  const openCircuits = providers?.filter(
    (provider) => provider.circuitStatus === "open",
  ).length ?? 0;

  return (
    <AdminAccess>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Admin • AI Gateway"
          title="مرکز کنترل درگاه هوش مصنوعی"
          description="سهمیه، بودجه، Provider و Circuit Breaker بدون افشای کلید یا اتصال حساب مصرف‌کننده مدیریت می‌شوند."
          action={
            <button
              type="button"
              onClick={initializeDefaults}
              disabled={initializing}
              className="rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-400 disabled:opacity-50"
            >
              {initializing ? "در حال راه‌اندازی…" : "راه‌اندازی تنظیمات امن"}
            </button>
          }
        />

        {message && (
          <GlassPanel className="py-3 text-sm text-slate-300">{message}</GlassPanel>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Provider ثبت‌شده"
            value={providers ? String(providers.length) : "…"}
            detail="بدون کلید در Database"
          />
          <MetricCard
            label="Adapter فعال"
            value={String(activeProviders)}
            detail="Sprint بعدی"
            tone="green"
          />
          <MetricCard
            label="Circuit باز"
            value={String(openCircuits)}
            detail="محافظت در برابر خطای متوالی"
            tone="amber"
          />
          <MetricCard
            label="Ledger اخیر"
            value={requests ? String(requests.length) : "…"}
            detail="حداکثر ۲۵ درخواست"
            tone="violet"
          />
        </div>

        {policy && <PolicyEditor key={JSON.stringify(policy)} policy={policy} />}

        <GlassPanel>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-white">Provider Registry</h2>
              <p className="mt-1 text-sm text-slate-500">
                فعال‌کردن Provider تا آماده‌شدن Adapter داخلی در Backend مسدود است.
              </p>
            </div>
            <StatusBadge tone="warning">Secrets خارج از Repository</StatusBadge>
          </div>

          {!providers ? (
            <div className="h-32 animate-pulse rounded-xl bg-white/[0.04]" />
          ) : providers.length === 0 ? (
            <p className="text-sm text-slate-500">
              ابتدا تنظیمات پیش‌فرض امن را راه‌اندازی کنید.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-right text-sm">
                <thead className="text-xs text-slate-500">
                  <tr className="border-b border-white/10">
                    <th className="px-3 py-3">ارائه‌دهنده</th>
                    <th className="px-3 py-3">Adapter</th>
                    <th className="px-3 py-3">مسیریابی</th>
                    <th className="px-3 py-3">Circuit</th>
                    <th className="px-3 py-3">Alias</th>
                    <th className="px-3 py-3">بودجه / مصرف</th>
                  </tr>
                </thead>
                <tbody>
                  {providers.map((provider) => (
                    <tr key={provider.provider} className="border-b border-white/5 text-slate-300">
                      <td className="px-3 py-3 font-bold text-white">{provider.displayName}</td>
                      <td className="px-3 py-3">{provider.adapterReady ? "آماده" : "غیرفعال"}</td>
                      <td className="px-3 py-3">{provider.enabled ? `اولویت ${provider.routePriority}` : "خاموش"}</td>
                      <td className="px-3 py-3">{provider.circuitStatus}</td>
                      <td className="px-3 py-3 font-mono text-xs" dir="ltr">{provider.modelAlias}</td>
                      <td className="px-3 py-3" dir="ltr">
                        {provider.spendMicrousd.toLocaleString()} / {provider.monthlyBudgetMicrousd.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </GlassPanel>
      </div>
    </AdminAccess>
  );
}
