"use client";

import { useMemo, useState } from "react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { ExternalLink, Landmark, ShieldCheck } from "lucide-react";
import { api } from "@/convex/_generated/api";
import {
  EmptyState,
  GlassPanel,
  PageHeader,
  StatusBadge,
} from "@/components/ui/civilmind";
import {
  asOfficialResourcesApi,
  mapPublicOfficialResources,
} from "@/features/official-sources/convex-repository";
import { officialResourceCategoryLabels } from "@/features/official-sources/domain";

function OfficialSourcesLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
    >
      <span className="sr-only">در حال دریافت منابع رسمی…</span>
      {Array.from({ length: 6 }, (_, index) => (
        <div
          key={index}
          aria-hidden="true"
          className="h-64 animate-pulse rounded-2xl border border-white/10 bg-white/[0.045]"
        />
      ))}
    </div>
  );
}

export default function OfficialSourcesDashboard() {
  const { isAuthenticated } = useConvexAuth();
  const seedCatalog = useMutation(api.officialResources.seedVerifiedOfficialCatalog);
  const [catalogMessage, setCatalogMessage] = useState("");
  const [seeding, setSeeding] = useState(false);
  const result = useQuery(
    asOfficialResourcesApi(api).officialResources.listActive,
    {},
  );
  const resources = useMemo(
    () =>
      result === undefined ? undefined : mapPublicOfficialResources(result),
    [result],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="ثبت دستی و تأییدشده"
        title="مرکز منابع رسمی"
        description="دسترسی مستقیم به مراجع منتشرشده توسط دفتر مقررات ملی و کنترل ساختمان"
        action={
          <div className="flex items-center gap-2">
            <StatusBadge tone="success">پیوندهای تأییدشده</StatusBadge>
            {isAuthenticated && (
              <button
                type="button"
                disabled={seeding}
                onClick={async () => {
                  setSeeding(true);
                  setCatalogMessage("");
                  try {
                    const outcome = await seedCatalog({});
                    setCatalogMessage(
                      outcome.created > 0
                        ? `${outcome.created.toLocaleString("fa-IR")} منبع رسمی به کاتالوگ افزوده شد.`
                        : "همهٔ منابع پایه از قبل ثبت شده‌اند.",
                    );
                  } catch {
                    setCatalogMessage("ثبت کاتالوگ فقط برای مدیر سامانه مجاز است.");
                  } finally {
                    setSeeding(false);
                  }
                }}
                className="rounded-lg border border-emerald-400/40 px-3 py-1.5 text-xs font-bold text-emerald-200 disabled:opacity-50"
              >
                {seeding ? "در حال ثبت…" : "ثبت منابع پایه"}
              </button>
            )}
          </div>
        }
      />

      {catalogMessage && (
        <p className="rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
          {catalogMessage}
        </p>
      )}

      <GlassPanel className="border-blue-400/20 bg-blue-400/[0.055]">
        <div className="flex gap-3">
          <ShieldCheck className="mt-1 size-5 shrink-0 text-blue-300" />
          <p className="text-sm leading-7 text-slate-300">
            CivilMind یک سامانه مستقل است و اطلاعات رسمی را با ذکر و پیوند
            مستقیم به منبع منتشر می‌کند.
          </p>
        </div>
      </GlassPanel>

      {resources === undefined ? (
        <OfficialSourcesLoading />
      ) : resources.length === 0 ? (
        <EmptyState
          title="هنوز منبع رسمی فعالی ثبت نشده است"
          description="منابع پس از بررسی و ثبت دستی در این مرکز نمایش داده می‌شوند."
        />
      ) : (
        <section
          aria-label="فهرست منابع رسمی"
          className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
        >
          {resources.map((resource) => (
            <article
              key={resource.key}
              className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.045] p-5 shadow-[0_16px_50px_-30px_rgba(0,0,0,.8)]"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="flex size-11 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300">
                  <Landmark className="size-5" />
                </span>
                <StatusBadge tone="success">تأییدشده</StatusBadge>
              </div>
              <p className="mt-5 text-xs font-bold text-blue-300">
                {officialResourceCategoryLabels[resource.category]}
              </p>
              <h2 className="mt-2 text-lg font-bold leading-8 text-white">
                {resource.title}
              </h2>
              <p className="mt-2 flex-1 text-sm leading-7 text-slate-400">
                {resource.description}
              </p>
              <div className="mt-5 border-t border-white/10 pt-4 text-xs text-slate-500">
                <p>{resource.sourcePublisher}</p>
                <p className="mt-1" dir="ltr">
                  {resource.sourceDomain}
                </p>
              </div>
              <a
                href={resource.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-500"
              >
                مشاهده در منبع رسمی
                <ExternalLink className="size-4" />
              </a>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
