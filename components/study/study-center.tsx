"use client";

import { useState } from "react";
import DailyPlannerCalendar from "@/components/planner/daily-planner-calendar";
import StudyProgressDashboard from "@/components/study/study-progress-dashboard";

type StudyTab = "planner" | "progress";

export default function StudyCenter() {
  const [tab, setTab] = useState<StudyTab>("planner");

  return (
    <div>
      <div className="sticky top-0 z-20 flex gap-2 border-b border-slate-700 bg-slate-950/95 px-5 py-3 backdrop-blur md:px-8" dir="rtl">
        <button
          onClick={() => setTab("planner")}
          className={`rounded-xl px-4 py-2 text-sm font-bold ${
            tab === "planner"
              ? "bg-cyan-500 text-slate-950"
              : "border border-slate-600 text-slate-200"
          }`}
        >
          برنامه روزانه و تقویم
        </button>
        <button
          onClick={() => setTab("progress")}
          className={`rounded-xl px-4 py-2 text-sm font-bold ${
            tab === "progress"
              ? "bg-violet-400 text-slate-950"
              : "border border-slate-600 text-slate-200"
          }`}
        >
          ثبت مطالعه، تست و پیشرفت
        </button>
      </div>
      {tab === "planner" ? <DailyPlannerCalendar /> : <StudyProgressDashboard />}
    </div>
  );
}
