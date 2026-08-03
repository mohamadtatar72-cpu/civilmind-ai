import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import AppShell from "@/components/layout/app-shell";

import catalogJson from "@/public/super-library/catalog.json";
import chunksJson from "@/public/super-library/chunks.json";

import type {
  SuperLibraryChunk,
  SuperLibraryResource,
} from "@/features/super-library/contracts";

const catalog = catalogJson as SuperLibraryResource[];
const chunks = chunksJson as SuperLibraryChunk[];

export default async function ResourceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const resource = catalog.find(
    (item) => item.slug === slug,
  );

  if (!resource) {
    notFound();
  }

  if (
    resource.publicationStatus === "needs-review"
  ) {
    notFound();
  }

  if (
    (resource.resourceKind ===
      "external-website" ||
      resource.license === "link-only") &&
    resource.sourceUrl
  ) {
    redirect(resource.sourceUrl);
  }

  const resourceChunks = chunks.filter(
    (chunk) => chunk.resourceSlug === slug,
  );

  return (
    <AppShell>
      <div className="space-y-6" dir="rtl">
        <section className="rounded-3xl border border-cyan-400/20 bg-slate-950/80 p-6">
          <Link
            href="/resources"
            className="text-sm font-bold text-cyan-300"
          >
            بازگشت به ابرکتابخانه
          </Link>

          <div className="mt-5 flex flex-wrap gap-2">
            <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-bold text-cyan-200">
              {resource.category}
            </span>

            {resource.official && (
              <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-200">
                منبع رسمی
              </span>
            )}
          </div>

          <h1 className="mt-4 text-3xl font-black leading-[1.6] text-white">
            {resource.displayTitle ||
              resource.title}
          </h1>

          <p className="mt-4 max-w-4xl text-sm leading-8 text-slate-400">
            {resource.summary ||
              resource.description}
          </p>

          <dl className="mt-7 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-slate-500">
                ناشر یا منبع
              </dt>
              <dd className="mt-1 font-bold text-white">
                {resource.sourceName ||
                  "نیازمند تکمیل منبع"}
              </dd>
            </div>

            {resource.edition && (
              <div>
                <dt className="text-slate-500">
                  ویرایش
                </dt>
                <dd className="mt-1 font-bold text-white">
                  {resource.edition}
                </dd>
              </div>
            )}

            {resource.pageCount > 0 && (
              <div>
                <dt className="text-slate-500">
                  تعداد صفحات
                </dt>
                <dd className="mt-1 font-bold text-white">
                  {resource.pageCount.toLocaleString(
                    "fa-IR",
                  )}
                </dd>
              </div>
            )}

            <div>
              <dt className="text-slate-500">
                روش استخراج
              </dt>
              <dd className="mt-1 font-bold text-white">
                {resource.ocrUsed
                  ? "بازشناسی متن فارسی و انگلیسی"
                  : resource.searchable
                    ? "متن دیجیتال سند"
                    : "متن داخلی موجود نیست"}
              </dd>
            </div>
          </dl>

          {resource.sourceUrl && (
            <div className="mt-6">
              <a
                href={resource.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex rounded-xl border border-white/10 px-4 py-3 font-bold text-white transition hover:bg-white/5"
              >
                مشاهده منبع اصلی
              </a>
            </div>
          )}
        </section>

        {resourceChunks.length > 0 ? (
          <section className="space-y-4">
            <div>
              <h2 className="text-xl font-black text-white">
                متن استخراج‌شده سند
              </h2>

              <p className="mt-2 text-sm text-slate-400">
                متن زیر خروجی پردازش سند است و برای
                جست‌وجو و استناد استفاده می‌شود.
              </p>
            </div>

            {resourceChunks.map((chunk) => (
              <article
                key={chunk.id}
                className="rounded-2xl border border-white/10 bg-slate-950/65 p-5"
              >
                <div className="text-xs font-bold text-cyan-300">
                  صفحه{" "}
                  {chunk.page.toLocaleString(
                    "fa-IR",
                  )}{" "}
                  — بخش{" "}
                  {chunk.chunk.toLocaleString(
                    "fa-IR",
                  )}
                </div>

                <p className="mt-3 whitespace-pre-wrap text-sm leading-8 text-slate-300">
                  {chunk.text}
                </p>
              </article>
            ))}
          </section>
        ) : (
          <section className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-5 text-sm leading-7 text-amber-200">
            متن قابل نمایش برای این سند موجود نیست.
            این منبع تا تکمیل پردازش نباید به‌عنوان
            سند جست‌وجوپذیر معرفی شود.
          </section>
        )}
      </div>
    </AppShell>
  );
}
