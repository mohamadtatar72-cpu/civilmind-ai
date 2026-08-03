"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import type {
  SearchResult,
  SuperLibraryResource,
} from "@/features/super-library/contracts";

type SearchResponse = {
  query: string;
  total: number;
  offset: number;
  limit: number;
  results: SearchResult[];
};

type AskResponse = {
  status: string;
  answer: string | null;
  message?: string;
  citations: Array<{
    resourceSlug: string;
    title: string;
    edition: string | null;
    page: number;
    sourceUrl: string | null;
    excerpt: string;
  }>;
};

const PAGE_SIZE = 18;

export function SuperLibraryClient({
  initialResources,
}: {
  initialResources: SuperLibraryResource[];
}) {
  const publicResources = useMemo(
    () =>
      initialResources.filter(
        (resource) =>
          resource.publicationStatus !== "needs-review",
      ),
    [initialResources],
  );

  const categories = useMemo(
    () =>
      Array.from(
        new Set(
          publicResources.map(
            (resource) => resource.category,
          ),
        ),
      ).sort((a, b) =>
        a.localeCompare(b, "fa"),
      ),
    [publicResources],
  );

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [kind, setKind] = useState("");
  const [page, setPage] = useState(0);

  const [results, setResults] = useState<
    SearchResult[]
  >(
    publicResources
      .slice(0, PAGE_SIZE)
      .map((resource) => ({
        resource,
        chunks: [],
        score: 0,
      })),
  );

  const [total, setTotal] = useState(
    publicResources.length,
  );

  const [searching, setSearching] = useState(false);

  const [question, setQuestion] = useState("");
  const [askResult, setAskResult] =
    useState<AskResponse | null>(null);
  const [asking, setAsking] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    const timer = window.setTimeout(async () => {
      setSearching(true);

      try {
        const parameters = new URLSearchParams({
          q: query,
          category,
          kind,
          limit: String(PAGE_SIZE),
          offset: String(page * PAGE_SIZE),
        });

        const response = await fetch(
          `/api/resources/search?${parameters.toString()}`,
          {
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          throw new Error(
            `Search failed with ${response.status}`,
          );
        }

        const data =
          (await response.json()) as SearchResponse;

        setResults(data.results);
        setTotal(data.total);
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          return;
        }

        setResults([]);
        setTotal(0);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query, category, kind, page]);

  function changeQuery(value: string) {
    setQuery(value);
    setPage(0);
  }

  function changeCategory(value: string) {
    setCategory(value);
    setPage(0);
  }

  function changeKind(value: string) {
    setKind(value);
    setPage(0);
  }

  async function retrieveCitations(
    event: FormEvent,
  ) {
    event.preventDefault();
    setAsking(true);
    setAskResult(null);

    try {
      const response = await fetch(
        "/api/resources/ask",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            question,
          }),
        },
      );

      setAskResult(
        (await response.json()) as AskResponse,
      );
    } finally {
      setAsking(false);
    }
  }

  const pageCount = Math.max(
    Math.ceil(total / PAGE_SIZE),
    1,
  );

  return (
    <div className="space-y-8" dir="rtl">
      <section className="rounded-3xl border border-cyan-400/20 bg-slate-950/85 p-6">
        <div className="max-w-4xl">
          <p className="text-sm font-bold text-cyan-300">
            منابع مهندسی کنترل‌شده
          </p>

          <h1 className="mt-2 text-3xl font-black text-white">
            ابرکتابخانه مهندسی CivilMind
          </h1>

          <p className="mt-4 text-sm leading-8 text-slate-400">
            جست‌وجو در منابع رسمی پردازش‌شده و
            دسترسی مستقیم به وب‌سایت‌های مرجع.
            اسناد با عنوان یا متادیتای نامطمئن تا زمان
            بررسی از نمایش عمومی خارج می‌شوند.
          </p>
        </div>

        <div className="mt-6 grid gap-3 lg:grid-cols-[1fr_220px_220px]">
          <label className="sr-only" htmlFor="resource-search">
            جست‌وجوی منابع
          </label>

          <input
            id="resource-search"
            value={query}
            onChange={(event) =>
              changeQuery(event.target.value)
            }
            placeholder="عنوان، موضوع یا عبارت موردنظر را جست‌وجو کنید"
            className="w-full rounded-2xl border border-white/10 bg-slate-950 px-5 py-4 text-white outline-none transition focus:border-cyan-400"
          />

          <select
            value={category}
            onChange={(event) =>
              changeCategory(event.target.value)
            }
            aria-label="دسته‌بندی منابع"
            className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-4 text-white outline-none focus:border-cyan-400"
          >
            <option value="">همه دسته‌ها</option>

            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <select
            value={kind}
            onChange={(event) =>
              changeKind(event.target.value)
            }
            aria-label="نوع منبع"
            className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-4 text-white outline-none focus:border-cyan-400"
          >
            <option value="">همه انواع</option>
            <option value="internal-document">
              اسناد پردازش‌شده
            </option>
            <option value="external-website">
              وب‌سایت‌های مرجع
            </option>
          </select>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
          <span className="text-slate-400">
            {searching
              ? "در حال جست‌وجو…"
              : `${total.toLocaleString("fa-IR")} نتیجه`}
          </span>

          {(query || category || kind) && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setCategory("");
                setKind("");
                setPage(0);
              }}
              className="rounded-xl border border-white/10 px-4 py-2 font-bold text-slate-300 transition hover:bg-white/5"
            >
              پاک‌کردن فیلترها
            </button>
          )}
        </div>
      </section>

      {results.length > 0 ? (
        <section
          aria-label="نتایج کتابخانه"
          className="grid gap-5 md:grid-cols-2 xl:grid-cols-3"
        >
          {results.map(({ resource, chunks }) => {
            const isExternal =
              resource.resourceKind ===
                "external-website" ||
              resource.license === "link-only";

            const summary =
              chunks[0]?.text ||
              resource.summary ||
              resource.description;

            return (
              <article
                key={resource.id}
                className="flex min-h-[310px] flex-col rounded-3xl border border-white/10 bg-slate-950/70 p-5"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-bold text-cyan-200">
                    {resource.category}
                  </span>

                  {resource.official && (
                    <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-200">
                      منبع رسمی
                    </span>
                  )}
                </div>

                <h2 className="mt-4 text-lg font-black leading-8 text-white">
                  {resource.displayTitle ||
                    resource.title}
                </h2>

                <p className="mt-3 line-clamp-5 text-sm leading-7 text-slate-400">
                  {summary}
                </p>

                <div className="mt-auto pt-5">
                  <div className="mb-4 flex flex-wrap gap-3 text-xs text-slate-500">
                    {resource.edition && (
                      <span>
                        ویرایش: {resource.edition}
                      </span>
                    )}

                    {resource.pageCount > 0 && (
                      <span>
                        {resource.pageCount.toLocaleString(
                          "fa-IR",
                        )}{" "}
                        صفحه
                      </span>
                    )}

                    {chunks[0]?.page && (
                      <span>
                        نتیجه از صفحه{" "}
                        {chunks[0].page.toLocaleString(
                          "fa-IR",
                        )}
                      </span>
                    )}
                  </div>

                  {isExternal &&
                  resource.sourceUrl ? (
                    <a
                      href={resource.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded-xl bg-violet-400/10 px-4 py-3 text-center text-sm font-bold text-violet-200 transition hover:bg-violet-400/20"
                    >
                      باز کردن وب‌سایت منبع
                    </a>
                  ) : (
                    <Link
                      href={`/resources/${resource.slug}`}
                      className="block rounded-xl bg-cyan-400/10 px-4 py-3 text-center text-sm font-bold text-cyan-200 transition hover:bg-cyan-400/20"
                    >
                      مشاهده سند و متن استخراج‌شده
                    </Link>
                  )}
                </div>
              </article>
            );
          })}
        </section>
      ) : (
        <section className="rounded-3xl border border-white/10 bg-slate-950/70 p-10 text-center">
          <h2 className="font-black text-white">
            نتیجه‌ای پیدا نشد
          </h2>

          <p className="mt-2 text-sm text-slate-400">
            عبارت جست‌وجو یا فیلترها را تغییر دهید.
          </p>
        </section>
      )}

      {pageCount > 1 && (
        <nav
          aria-label="صفحه‌بندی نتایج"
          className="flex items-center justify-center gap-3"
        >
          <button
            type="button"
            disabled={page <= 0}
            onClick={() =>
              setPage((current) =>
                Math.max(current - 1, 0),
              )
            }
            className="rounded-xl border border-white/10 px-5 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            صفحه قبل
          </button>

          <span className="text-sm text-slate-400">
            صفحه {(page + 1).toLocaleString("fa-IR")} از{" "}
            {pageCount.toLocaleString("fa-IR")}
          </span>

          <button
            type="button"
            disabled={page + 1 >= pageCount}
            onClick={() =>
              setPage((current) =>
                Math.min(
                  current + 1,
                  pageCount - 1,
                ),
              )
            }
            className="rounded-xl border border-white/10 px-5 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            صفحه بعد
          </button>
        </nav>
      )}

      <section className="rounded-3xl border border-violet-400/20 bg-violet-400/5 p-6">
        <h2 className="text-xl font-black text-white">
          دستیار Citation-first برای بازیابی منابع مرتبط
        </h2>

        <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-400">
          این دستیار Citation-first ابتدا قطعه‌های مرتبط و
          قابل استناد را از کتابخانه پیدا می‌کند. تا زمان اتصال و تأیید سرویس هوش مصنوعی،
          پاسخ تحلیلی مدل تولید نمی‌شود و فقط منابع واقعی
          بازیابی‌شده نمایش داده می‌شوند.
        </p>

        <form
          onSubmit={retrieveCitations}
          className="mt-5 space-y-3"
        >
          <label
            className="sr-only"
            htmlFor="citation-question"
          >
            پرسش برای بازیابی منابع
          </label>

          <textarea
            id="citation-question"
            value={question}
            onChange={(event) =>
              setQuestion(event.target.value)
            }
            rows={4}
            placeholder="موضوع یا سؤال مهندسی خود را وارد کنید"
            className="w-full rounded-2xl border border-white/10 bg-slate-950 p-4 text-white outline-none transition focus:border-violet-400"
          />

          <button
            type="submit"
            disabled={!question.trim() || asking}
            className="rounded-xl bg-violet-500 px-5 py-3 font-bold text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {asking
              ? "در حال بازیابی…"
              : "پیدا کردن منابع مرتبط"}
          </button>
        </form>

        {askResult && (
          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4 text-sm leading-7 text-amber-200">
              {askResult.status ===
              "no-verified-source"
                ? "برای این پرسش منبع معتبر کافی در کتابخانه پیدا نشد."
                : askResult.message ||
                  "منابع مرتبط بازیابی شدند."}
            </div>

            {askResult.citations.map(
              (citation) => (
                <article
                  key={`${citation.resourceSlug}-${citation.page}`}
                  className="rounded-2xl border border-white/10 bg-slate-950/70 p-4"
                >
                  <Link
                    href={`/resources/${citation.resourceSlug}`}
                    className="font-black text-cyan-300"
                  >
                    {citation.title}
                  </Link>

                  <div className="mt-1 text-xs text-slate-500">
                    {citation.edition
                      ? `ویرایش ${citation.edition} — `
                      : ""}
                    صفحه{" "}
                    {citation.page.toLocaleString(
                      "fa-IR",
                    )}
                  </div>

                  <p className="mt-3 line-clamp-5 text-sm leading-7 text-slate-300">
                    {citation.excerpt}
                  </p>
                </article>
              ),
            )}
          </div>
        )}
      </section>
    </div>
  );
}
