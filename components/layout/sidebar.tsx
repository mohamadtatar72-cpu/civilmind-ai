"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  {
    title: "داشبورد",
    href: "/",
  },

  {
    title: "برنامه مطالعه",
    href: "/planner",
  },

  {
    title: "تحلیل آزمون",
    href: "/analytics",
  },

  {
    title: "پیش‌بینی قبولی",
    href: "/prediction",
  },

  {
    title: "منابع",
    children: [
      {
        title: "مباحث مقررات ملی ساختمان",
        href: "/library",
      },
      {
        title: "منابع رسمی",
        href: "/official-sources",
      },
      {
        title: "PDF ها",
        href: "/pdf",
      },
    ],
  },

  {
    title: "هوش مصنوعی",
    children: [
      {
        title: "AI Assistant",
        href: "/ai",
      },
      {
        title: "Knowledge Graph",
        href: "/graph",
      },
    ],
  },

  {
    title: "تنظیمات",
    href: "/settings",
  },
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


        {items.map((item)=>(
          
          <div key={item.title}>


            {item.href ? (

              <Link
                href={item.href}
                className={`block rounded-xl px-4 py-3 ${
                  pathname === item.href
                  ? "bg-blue-600 text-white"
                  : "text-zinc-300 hover:bg-zinc-800"
                }`}
              >
                {item.title}
              </Link>

            ) : (

              <div className="px-4 py-3 text-white font-bold">
                {item.title}
              </div>

            )}



            {item.children && (

              <div className="ml-4 space-y-1">

                {item.children.map((child)=>(

                  <Link
                    key={child.href}
                    href={child.href}
                    className={`block rounded-xl px-4 py-2 text-sm ${
                      pathname === child.href
                      ? "bg-blue-600 text-white"
                      : "text-zinc-400 hover:bg-zinc-800"
                    }`}
                  >
                    {child.title}
                  </Link>

                ))}

              </div>

            )}

          </div>

        ))}


      </nav>


    </aside>
  );
}
