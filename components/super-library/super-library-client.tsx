"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";

import type {
  SearchResult,
  SuperLibraryResource,
} from "@/features/super-library/contracts";

type SearchResponse = {
  query: string;
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

export function SuperLibraryClient({
  initialResources,
}: {
  initialResources: SuperLibraryResource[];
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>(
    initialResources.slice(0, 30).map((resource) => ({
      resource,
      chunks: [],
      score: 0,
    })),
  );

  const [searching, setSearching] = useState(false);
  const [question, setQuestion] = useState("");
  const [askResult, setAskResult] =
    useState<AskResponse | null>(null);
  const [asking, setAsking] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      setSearching(true);

      try {
        const response = await fetch(
          `/api/resources/search?q=${encodeURIComponent(query)}`,
        );

        const data = (await response.json()) as SearchResponse;
        setResults(data.results);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => window.clearTimeout(timer);
  }, [query]);

  async function ask(event: FormEvent) {
    event.preventDefault();
    setAsking(true);

    try {
      const response = await fetch("/api/resources/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question }),
      });

      setAskResult((await response.json()) as AskResponse);
    } finally {
      setAsking(false);
    }
  }

  return (
    <div className="space-y-7" dir="rtl">
      <section className="rounded-3xl border border-cyan-400/20 bg-slate-950/85 p-6">
        <h1 className="text-3xl font-black text-white">
          ابرکتابخانه مهندسی CivilMind AI
        </h1>

        <p className="mt-3 max-w-4xl text-sm leading-8 text-slate-400">
          آرشیو منابع رسمی، نسخه‌ها، متن استخراج‌شده،
          جست‌وجوی داخلی و Citation دقیق به صفحه و منبع.
          محتوای دارای حق نشر فقط به منبع اصلی پیوند می‌شود.
        </p>

        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="جست‌وجو در متن منابع، عنوان، ویرایش و صفحات…"
          className="mt-6 w-full rounded-2xl border border-white/10 bg-slate-950 px-5 py-4 text-white outline-none focus:border-cyan-400"
        />

        {searching && (
          <p className="mt-2 text-xs text-cyan-300">
            در حال جست‌وجو…
          </p>
        )}
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {results.map(({ resource, chunks }) => (
          <article
            key={resource.id}
            className="rounded-3xl border border-white/10 bg-slate-950/70 p-5"
          >
            <div className="text-xs font-bold text-cyan-300">
              {resource.category}
            </div>

            <h2 className="mt-2 text-lg font-black text-white">
              {resource.title}
            </h2>

            <p className="mt-3 line-clamp-3 text-sm leading-7 text-slate-400">
              {chunks[0]?.text ?? resource.description}
            </p>

            <div className="mt-4 text-xs text-slate-500">
              ویرایش: {resource.edition ?? "ثبت نشده"}
              {chunks[0] && ` — صفحه ${chunks[0].page}`}
            </div>

            <Link
              href={`/resources/${resource.slug}`}
              className="mt-5 block rounded-xl bg-cyan-400/10 px-4 py-3 text-center text-sm font-bold text-cyan-200"
            >
              مشاهده منبع و صفحات
            </Link>
          </article>
        ))}
      </section>

      <section className="rounded-3xl border border-violet-400/20 bg-violet-400/5 p-6">
        <h2 className="text-xl font-black text-white">
          دستیار Citation-first
        </h2>

        <p className="mt-2 text-sm leading-7 text-slate-400">
          ابتدا منابع معتبر بازیابی می‌شوند. بدون منبع،
          پاسخ تولید نمی‌شود.
        </p>

        <form onSubmit={ask} className="mt-5 space-y-3">
          <textarea
            value={question}
            onChange={(event) =>
              setQuestion(event.target.value)
            }
            rows={4}
            placeholder="سؤال مهندسی خود را بنویس…"
            className="w-full rounded-2xl border border-white/10 bg-slate-950 p-4 text-white outline-none focus:border-violet-400"
          />

          <button
            disabled={!question.trim() || asking}
            className="rounded-xl bg-violet-500 px-5 py-3 font-bold text-white disabled:opacity-50"
          >
            {asking
              ? "در حال بازیابی منابع…"
              : "بازیابی پاسخ مستند"}
          </button>
        </form>

        {askResult && (
          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4 text-sm text-amber-200">
              {askResult.status === "no-verified-source"
                ? "منبع معتبر کافی پیدا نشد و پاسخی تولید نشد."
                : askResult.message}
            </div>

            {askResult.citations.map((citation) => (
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
                  ویرایش {citation.edition ?? "ثبت نشده"} —
                  صفحه {citation.page}
                </div>

                <p className="mt-3 line-clamp-5 text-sm leading-7 text-slate-300">
                  {citation.excerpt}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
