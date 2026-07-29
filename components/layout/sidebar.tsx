"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { title: "داشبورد", href: "/dashboard" },
  { title: "برنامه مطالعه", href: "/planner" },
  { title: "تحلیل آزمون", href: "/analytics" },
  { title: "پیش‌بینی قبولی", href: "/analytics" },
  { title: "مباحث ۲۲ گانه", href: "/library" },
  { title: "PDF ها", href: "/pdf" },
  { title: "AI Assistant", href: "/ai" },
  { title: "Knowledge Graph", href: "/graph" },
  { title: "تنظیمات", href: "/settings" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-72 bg-zinc-900 border-r border-zinc-800 flex flex-col">

      <div className="p-6">
        <h1 className="text-3xl font-bold text-white">
          CivilMind AI
        </h1>

        <p className="mt-2 text-zinc-400">
          Civil Engineering Intelligence
        </p>
      </div>


      <nav className="flex-1 px-4 space-y-2">

        {items.map((item) => (

          <Link
            key={item.title}
            href={item.href}
            className={`block rounded-xl px-4 py-3 transition ${
              pathname === item.href
                ? "bg-blue-600 text-white"
                : "text-zinc-300 hover:bg-zinc-800"
            }`}
          >
            {item.title}
          </Link>

        ))}

      </nav>


      <div className="p-4 text-xs text-zinc-500">
        CivilMind AI • نسخه حرفه‌ای
      </div>

    </aside>
  );
}