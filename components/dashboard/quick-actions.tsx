"use client";

import Link from "next/link";

const actions = [
  {
    title: "برنامه مطالعه",
    description: "مدیریت برنامه روزانه و مرور مباحث",
    href: "/planner",
    icon: "📚",
  },
  {
    title: "تحلیل آزمون",
    description: "بررسی عملکرد و نقاط ضعف",
    href: "/analytics",
    icon: "📊",
  },
  {
    title: "PDF ها",
    description: "مباحث و منابع مقررات ملی",
    href: "/pdf",
    icon: "📄",
  },
  {
    title: "هوش مصنوعی",
    description: "دستیار هوشمند CivilMind",
    href: "/ai",
    icon: "🤖",
  },
  {
    title: "Knowledge Graph",
    description: "ارتباط بین مباحث",
    href: "/graph",
    icon: "🧠",
  },
];

export default function QuickActions() {
  return (
    <div className="grid gap-4 md:grid-cols-5">

      {actions.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="
          rounded-3xl
          border
          border-zinc-800
          bg-zinc-900
          p-5
          text-white
          transition
          hover:bg-zinc-800
          "
        >

          <div className="text-3xl">
            {item.icon}
          </div>

          <h3 className="mt-4 font-bold">
            {item.title}
          </h3>

          <p className="mt-2 text-sm text-zinc-400">
            {item.description}
          </p>

        </Link>
      ))}

    </div>
  );
}