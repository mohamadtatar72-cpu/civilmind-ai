import Link from "next/link";
import { notFound } from "next/navigation";

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

          <h1 className="mt-4 text-3xl font-black text-white">
            {resource.title}
          </h1>

          <p className="mt-3 text-sm leading-8 text-slate-400">
            {resource.description}
          </p>

          <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-slate-500">منبع</dt>
              <dd className="mt-1 font-bold text-white">
                {resource.sourceName}
              </dd>
            </div>

            <div>
              <dt className="text-slate-500">ویرایش</dt>
              <dd className="mt-1 font-bold text-white">
                {resource.edition ?? "ثبت نشده"}
              </dd>
            </div>

            <div>
              <dt className="text-slate-500">صفحات</dt>
              <dd className="mt-1 font-bold text-white">
                {resource.pageCount}
              </dd>
            </div>

            <div>
              <dt className="text-slate-500">استخراج</dt>
              <dd className="mt-1 font-bold text-white">
                {resource.ocrUsed
                  ? "OCR فارسی/انگلیسی"
                  : resource.searchable
                    ? "متن دیجیتال"
                    : "لینک منبع"}
              </dd>
            </div>
          </dl>

          <div className="mt-6 flex flex-wrap gap-3">
            {resource.fileUrl && (
              <a
                href={resource.fileUrl}
                className="rounded-xl bg-cyan-500 px-4 py-3 font-bold text-slate-950"
              >
                دریافت فایل
              </a>
            )}

            {resource.sourceUrl && (
              <a
                href={resource.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-white/10 px-4 py-3 font-bold text-white"
              >
                منبع اصلی
              </a>
            )}
          </div>
        </section>

        {resourceChunks.length > 0 ? (
          <section className="space-y-4">
            {resourceChunks.map((chunk) => (
              <article
                key={chunk.id}
                className="rounded-2xl border border-white/10 bg-slate-950/65 p-5"
              >
                <div className="text-xs font-bold text-cyan-300">
                  صفحه {chunk.page} — قطعه {chunk.chunk}
                </div>

                <p className="mt-3 whitespace-pre-wrap text-sm leading-8 text-slate-300">
                  {chunk.text}
                </p>
              </article>
            ))}
          </section>
        ) : (
          <section className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-5 text-sm text-amber-200">
            متن این منبع داخل CivilMind ذخیره نشده است؛
            محتوا فقط از طریق منبع اصلی ارائه می‌شود.
          </section>
        )}
      </div>
    </AppShell>
  );
}
