"use client";

import { useMemo, useState } from "react";
import {
  Archive,
  BadgeCheck,
  BookOpen,
  Download,
  ExternalLink,
  FileImage,
  FileSpreadsheet,
  FileText,
  Globe2,
  GraduationCap,
  Link2,
  Presentation,
  Search,
  ShieldCheck,
} from "lucide-react";

import {
  civilMindResources,
  type CivilMindResource,
} from "@/features/resources/generated-catalog";

const iconMap = {
  pdf: BookOpen,
  document: FileText,
  spreadsheet: FileSpreadsheet,
  presentation: Presentation,
  archive: Archive,
  image: FileImage,
  text: FileText,
  external: Link2,
} satisfies Record<
  CivilMindResource["kind"],
  typeof BookOpen
>;

function formatBytes(bytes: number | null) {
  if (bytes === null) return null;

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(
    bytes /
    1024 /
    1024
  ).toFixed(1)} MB`;
}

type ScopeFilter =
  | "all"
  | "official"
  | "educational"
  | "downloadable";

export function ResourceLibrary() {
  const [query, setQuery] = useState("");
  const [category, setCategory] =
    useState("همه");
  const [scope, setScope] =
    useState<ScopeFilter>("all");

  const categories = useMemo(
    () => [
      "همه",
      ...Array.from(
        new Set(
          civilMindResources.map(
            (item) => item.category,
          ),
        ),
      ).sort((a, b) =>
        a.localeCompare(b, "fa"),
      ),
    ],
    [],
  );

  const filteredResources = useMemo(() => {
    const normalized = query
      .trim()
      .toLocaleLowerCase("fa");

    return civilMindResources.filter(
      (resource) => {
        const categoryMatches =
          category === "همه" ||
          resource.category === category;

        const scopeMatches =
          scope === "all" ||
          (scope === "official" &&
            resource.official) ||
          (scope === "educational" &&
            resource.external &&
            !resource.official) ||
          (scope === "downloadable" &&
            resource.downloadable);

        const searchableText = [
          resource.title,
          resource.category,
          resource.description,
          resource.sourceName,
          resource.edition ?? "",
          resource.format,
          resource.tags.join(" "),
        ]
          .join(" ")
          .toLocaleLowerCase("fa");

        return (
          categoryMatches &&
          scopeMatches &&
          (
            !normalized ||
            searchableText.includes(
              normalized,
            )
          )
        );
      },
    );
  }, [category, query, scope]);

  const localCount =
    civilMindResources.filter(
      (item) => item.downloadable,
    ).length;

  const officialCount =
    civilMindResources.filter(
      (item) => item.official,
    ).length;

  const externalCount =
    civilMindResources.filter(
      (item) => item.external,
    ).length;

  return (
    <div className="space-y-6" dir="rtl">
      <section className="overflow-hidden rounded-3xl border border-cyan-400/20 bg-slate-950/85 p-6 shadow-2xl shadow-cyan-950/20">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-cyan-300">
              <GraduationCap className="size-5" />

              <span className="text-sm font-black">
                CivilMind AI Engineering
                Super Library
              </span>
            </div>

            <h1 className="mt-3 text-3xl font-black text-white">
              ابرکتابخانه مهندسی عمران
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-8 text-slate-400">
              منابع رسمی، سایت‌های معتبر
              عمرانی فارسی، کتاب‌ها، جزوات،
              ابزارها و فایل‌های مهندسی از
              یک نقطه در دسترس هستند.
              محتوای دارای حق نشر بدون مجوز
              کپی نمی‌شود و فقط با لینک منبع اصلی
              ارائه می‌شود.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/5 px-4 py-3 text-center">
              <div className="text-2xl font-black text-emerald-200">
                {officialCount}
              </div>

              <div className="mt-1 text-[11px] text-emerald-200/60">
                منبع رسمی
              </div>
            </div>

            <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/5 px-4 py-3 text-center">
              <div className="text-2xl font-black text-cyan-200">
                {externalCount}
              </div>

              <div className="mt-1 text-[11px] text-cyan-200/60">
                سایت معتبر
              </div>
            </div>

            <div className="rounded-2xl border border-violet-400/20 bg-violet-400/5 px-4 py-3 text-center">
              <div className="text-2xl font-black text-violet-200">
                {localCount}
              </div>

              <div className="mt-1 text-[11px] text-violet-200/60">
                فایل دانلودی
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
        <div className="grid gap-4 xl:grid-cols-[1fr_260px]">
          <label className="relative">
            <Search className="absolute right-4 top-1/2 size-5 -translate-y-1/2 text-slate-500" />

            <input
              value={query}
              onChange={(event) =>
                setQuery(
                  event.target.value,
                )
              }
              placeholder="جست‌وجو در منابع، سایت‌ها، دسته‌بندی‌ها و برچسب‌ها…"
              className="w-full rounded-2xl border border-white/10 bg-slate-950 py-4 pl-4 pr-12 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-400"
            />
          </label>

          <select
            value={category}
            onChange={(event) =>
              setCategory(
                event.target.value,
              )
            }
            className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-4 text-sm text-white outline-none focus:border-cyan-400"
          >
            {categories.map((item) => (
              <option
                key={item}
                value={item}
              >
                {item}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {[
            {
              id: "all",
              label: "همه منابع",
              icon: Globe2,
            },
            {
              id: "official",
              label: "منابع رسمی",
              icon: ShieldCheck,
            },
            {
              id: "educational",
              label: "سایت‌های آموزشی",
              icon: GraduationCap,
            },
            {
              id: "downloadable",
              label: "فایل‌های دانلودی",
              icon: Download,
            },
          ].map((item) => {
            const Icon = item.icon;
            const active =
              scope === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() =>
                  setScope(
                    item.id as ScopeFilter,
                  )
                }
                className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition ${
                  active
                    ? "border-cyan-400 bg-cyan-400/10 text-cyan-100"
                    : "border-white/10 bg-slate-950 text-slate-400 hover:border-white/20 hover:text-white"
                }`}
              >
                <Icon className="size-4" />
                {item.label}
              </button>
            );
          })}
        </div>
      </section>

      <section className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-slate-950/60 px-5 py-4">
        <p className="text-sm text-slate-400">
          نتیجه نمایش داده‌شده:
        </p>

        <span className="rounded-full bg-white/10 px-4 py-1.5 text-sm font-black text-white">
          {filteredResources.length}
        </span>
      </section>

      {filteredResources.length === 0 ? (
        <section className="rounded-3xl border border-amber-400/20 bg-amber-400/5 p-8 text-center">
          <p className="font-bold text-amber-200">
            منبعی با این جست‌وجو یا
            فیلتر پیدا نشد.
          </p>
        </section>
      ) : (
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredResources.map(
            (resource) => {
              const Icon =
                iconMap[resource.kind];

              const actionUrl =
                resource.fileUrl ??
                resource.sourceUrl;

              const size = formatBytes(
                resource.sizeBytes,
              );

              return (
                <article
                  key={resource.id}
                  className="flex min-h-[330px] flex-col rounded-3xl border border-white/10 bg-slate-950/75 p-5 transition hover:-translate-y-1 hover:border-cyan-400/30 hover:shadow-xl hover:shadow-cyan-950/20"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex size-12 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10">
                      <Icon className="size-6 text-cyan-300" />
                    </div>

                    <div className="flex flex-wrap justify-end gap-2">
                      {resource.official && (
                        <span className="flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-bold text-emerald-200">
                          <BadgeCheck className="size-3.5" />
                          رسمی
                        </span>
                      )}

                      <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-slate-300">
                        {resource.format}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 flex-1">
                    <p className="text-xs font-bold text-cyan-300">
                      {resource.category}
                    </p>

                    <h2 className="mt-2 text-lg font-black leading-8 text-white">
                      {resource.title}
                    </h2>

                    <p className="mt-3 line-clamp-4 text-sm leading-7 text-slate-400">
                      {resource.description}
                    </p>

                    <dl className="mt-5 space-y-2 border-t border-white/10 pt-4 text-xs">
                      <div className="flex justify-between gap-4">
                        <dt className="text-slate-500">
                          ارائه‌دهنده
                        </dt>

                        <dd className="text-left text-slate-300">
                          {resource.sourceName}
                        </dd>
                      </div>

                      {resource.edition && (
                        <div className="flex justify-between gap-4">
                          <dt className="text-slate-500">
                            ویرایش
                          </dt>

                          <dd className="text-left text-slate-300">
                            {resource.edition}
                          </dd>
                        </div>
                      )}

                      {size && (
                        <div className="flex justify-between gap-4">
                          <dt className="text-slate-500">
                            حجم
                          </dt>

                          <dd className="text-left text-slate-300">
                            {size}
                          </dd>
                        </div>
                      )}
                    </dl>

                    {resource.tags.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {resource.tags
                          .slice(0, 5)
                          .map((tag) => (
                            <span
                              key={tag}
                              className="rounded-lg bg-white/5 px-2 py-1 text-[10px] text-slate-500"
                            >
                              {tag}
                            </span>
                          ))}
                      </div>
                    )}
                  </div>

                  {actionUrl && (
                    <a
                      href={actionUrl}
                      target={
                        resource.external
                          ? "_blank"
                          : undefined
                      }
                      rel={
                        resource.external
                          ? "noopener noreferrer"
                          : undefined
                      }
                      download={
                        resource.downloadable
                          ? true
                          : undefined
                      }
                      className="mt-5 flex items-center justify-center gap-2 rounded-xl border border-cyan-400/25 bg-cyan-400/10 px-4 py-3 text-sm font-black text-cyan-200 transition hover:bg-cyan-400/20"
                    >
                      {resource.downloadable ? (
                        <>
                          <Download className="size-4" />
                          دانلود فایل
                        </>
                      ) : (
                        <>
                          <ExternalLink className="size-4" />
                          مشاهده منبع اصلی
                        </>
                      )}
                    </a>
                  )}
                </article>
              );
            },
          )}
        </section>
      )}

      <section className="rounded-3xl border border-emerald-400/20 bg-emerald-400/5 p-5">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-1 size-5 shrink-0 text-emerald-300" />

          <div>
            <h2 className="font-black text-emerald-100">
              سیاست حقوق نشر
            </h2>

            <p className="mt-2 text-sm leading-7 text-emerald-100/65">
              فایل‌های رسمی، عمومی، متعلق
              به پروژه یا دارای مجوز انتشار
              می‌توانند مستقیماً دانلود
              شوند. منابع دارای حق نشر سایت‌های دیگر
              فقط با لینک منبع اصلی نمایش داده می‌شوند.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
