import Link from "next/link";
import {
  BookOpen,
  Bot,
  CheckCircle2,
  FileQuestion,
  Scale,
  ShieldCheck,
} from "lucide-react";

const primaryJourneys = [
  {
    title: "تمرین با سؤال‌های رسمی",
    description:
      "دوره آزمون، رشته و صلاحیت را انتخاب کنید و سؤال را کنار کلید و منبع رسمی ببینید.",
    href: "/exam",
    action: "مشاهده آزمون‌ها",
    icon: FileQuestion,
  },
  {
    title: "جست‌وجو در کتابخانه",
    description:
      "مقررات، قوانین، راهنماها و وب‌سایت‌های مرجع را در یک مسیر واحد پیدا کنید.",
    href: "/resources",
    action: "ورود به کتابخانه",
    icon: BookOpen,
  },
  {
    title: "فهم بهتر مقررات",
    description:
      "متن مقررات را در سطح ساده، مناسب آزمون یا حرفه‌ای و اجرایی بررسی کنید.",
    href: "/regulation-explainer",
    action: "توضیح مقررات",
    icon: Scale,
  },
] as const;

const trustItems = [
  "نمایش منبع، نسخه و صفحه",
  "تفکیک متن رسمی از توضیح CivilMind",
  "عدم تولید پاسخ بدون مدرک کافی",
  "دسترسی رایگان به منابع رسمی",
];

export default function GuestLanding() {
  return (
    <main
      className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8"
      dir="rtl"
    >
      <section className="mx-auto max-w-6xl overflow-hidden rounded-3xl border border-blue-400/20 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.15),_transparent_38%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.17),_transparent_44%)] p-6 sm:p-10">
        <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-xs font-bold text-cyan-100">
              <ShieldCheck className="size-3.5" />
              آمادگی آزمون با منابع رسمی
            </p>

            <h1 className="mt-5 text-4xl font-black leading-tight text-white sm:text-5xl">
              مسیر ساده و قابل اعتماد برای آمادگی آزمون نظام مهندسی
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300">
              منابع معتبر را پیدا کنید، سؤال‌های رسمی
              را تمرین کنید و مقررات را با ارجاع دقیق
              به سند، نسخه و صفحه بهتر بفهمید.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/exam"
                className="rounded-xl bg-blue-500 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-400"
              >
                شروع تمرین سؤال
              </Link>

              <Link
                href="/resources"
                className="rounded-xl border border-white/20 px-5 py-3 text-sm font-black text-slate-100 transition hover:bg-white/10"
              >
                مشاهده منابع رسمی
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-5 shadow-2xl shadow-cyan-950/30">
            <div className="flex items-center gap-3 text-cyan-200">
              <Bot className="size-5" />
              <span className="font-black">
                CivilMind چگونه کمک می‌کند؟
              </span>
            </div>

            <div className="mt-5 space-y-3">
              {trustItems.map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3 rounded-xl border border-white/8 bg-white/[0.035] p-3"
                >
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-400" />

                  <span className="text-sm leading-6 text-slate-300">
                    {item}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-xl border border-amber-400/20 bg-amber-400/5 p-4">
              <p className="text-xs font-bold text-amber-200">
                وضعیت دستیار هوشمند
              </p>

              <p className="mt-2 text-xs leading-6 text-slate-400">
                بازیابی منابع و Citation فعال است.
                تولید پاسخ زنده مدل پس از اتصال Provider
                تأییدشده فعال خواهد شد.
              </p>

              <Link
                href="/ai"
                className="mt-3 inline-flex text-xs font-bold text-cyan-300 hover:text-cyan-200"
              >
                مشاهده دستیار CivilMind
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-8 max-w-6xl">
        <div className="mb-5">
          <p className="text-sm font-bold text-cyan-300">
            مسیرهای اصلی
          </p>

          <h2 className="mt-2 text-2xl font-black text-white">
            از کجا شروع کنید؟
          </h2>

          <p className="mt-2 text-sm leading-7 text-slate-400">
            CivilMind فعلاً روی سه نیاز اصلی داوطلب
            تمرکز می‌کند؛ بدون ابزارهای نمایشی و مسیرهای
            اضافی.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {primaryJourneys.map((journey) => {
            const Icon = journey.icon;

            return (
              <article
                key={journey.href}
                className="flex min-h-64 flex-col rounded-2xl border border-white/10 bg-slate-900/65 p-5"
              >
                <div className="flex size-11 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">
                  <Icon className="size-5" />
                </div>

                <h3 className="mt-5 text-lg font-black text-white">
                  {journey.title}
                </h3>

                <p className="mt-3 text-sm leading-7 text-slate-400">
                  {journey.description}
                </p>

                <Link
                  href={journey.href}
                  className="mt-auto pt-5 text-sm font-bold text-blue-300 transition hover:text-blue-200"
                >
                  {journey.action}
                </Link>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mx-auto mt-8 max-w-6xl rounded-2xl border border-white/10 bg-slate-900/55 p-6">
        <h2 className="text-xl font-black text-white">
          منابع رسمی رایگان می‌مانند
        </h2>

        <p className="mt-3 max-w-4xl text-sm leading-8 text-slate-400">
          مشاهده منابع رسمی، انتخاب رشته و صلاحیت،
          آرشیو سؤال‌ها و دسترسی به ارجاع سند نباید به
          اشتراک هوش مصنوعی وابسته باشد. قابلیت‌های
          تحلیلی پیشرفته پس از ورود و بر اساس سطح دسترسی
          فعال می‌شوند.
        </p>
      </section>
    </main>
  );
}
