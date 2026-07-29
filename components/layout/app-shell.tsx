"use client";

import { ReactNode } from "react";
import Link from "next/link";

import {
  LayoutDashboard,
  BookOpen,
  CalendarDays,
  BarChart3,
  BrainCircuit,
  Bot,
  FileText,
  Network,
  Search,
  Target,
  Settings,
  ChevronRight,
} from "lucide-react";


const sections = [
  {
    title: "داشبورد",
    items: [
      { title: "داشبورد", icon: LayoutDashboard, href: "/" },
      { title: "برنامه مطالعه", icon: CalendarDays, href: "/planner" },
      { title: "تحلیل آزمون", icon: BarChart3, href: "/analytics" },
      { title: "پیش‌بینی قبولی", icon: Target, href: "/prediction" },
    ],
  },

  {
    title: "منابع",
    items: [
      { title: "مباحث ۲۲ گانه", icon: BookOpen, href: "/library" },
      { title: "PDF ها", icon: FileText, href: "/pdf" },
    ],
  },

  {
    title: "هوش مصنوعی",
    items: [
      { title: "AI Assistant", icon: Bot, href: "/ai" },
      { title: "Knowledge Graph", icon: Network, href: "/graph" },
      { title: "جستجوی هوشمند", icon: Search, href: "/search" },
      { title: "تحلیل هوشمند", icon: BrainCircuit, href: "/analytics" },
    ],
  },

  {
    title: "سیستم",
    items: [
      { title: "تنظیمات", icon: Settings, href: "/settings" },
    ],
  },
];


export default function AppShell({
  children,
}: {
  children: ReactNode;
}) {

  return (
    <div className="flex min-h-screen bg-zinc-950 text-white">


      <aside className="w-80 border-r border-zinc-800 bg-zinc-900">


        <div className="border-b border-zinc-800 p-7">

          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent">
            CivilMind AI
          </h1>

          <p className="mt-2 text-sm text-zinc-400">
            Civil Engineering Intelligence
          </p>

        </div>



        <div className="p-5 space-y-8">


          {sections.map((section) => (

            <div key={section.title}>


              <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-500">
                {section.title}
              </h3>



              <div className="space-y-1">


                {section.items.map((item) => {

                  const Icon = item.icon;


                  return (

                    <Link
                      key={item.title}
                      href={item.href}
                      className="group flex w-full items-center justify-between rounded-xl px-4 py-3 transition hover:bg-zinc-800"
                    >

                      <div className="flex items-center gap-3">

                        <Icon
                          size={19}
                          className="text-zinc-400 group-hover:text-blue-400"
                        />

                        <span>
                          {item.title}
                        </span>

                      </div>


                      <ChevronRight
                        size={16}
                        className="opacity-0 transition group-hover:opacity-100"
                      />


                    </Link>

                  );

                })}


              </div>


            </div>

          ))}


        </div>


      </aside>



      <main className="flex-1 overflow-auto p-8">

        {children}

      </main>


    </div>
  );
}