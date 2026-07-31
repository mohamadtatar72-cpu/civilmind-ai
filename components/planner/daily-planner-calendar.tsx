"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

type TaskType = "study" | "test" | "review" | "other";
type Priority = "low" | "medium" | "high";
type TaskStatus = "planned" | "in_progress" | "completed";

const inputClass =
  "w-full rounded-xl border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400";

function toDayKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function fromDayKey(dayKey: string) {
  const [year, month, day] = dayKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function getCalendarDays(cursor: Date) {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const start = new Date(first);
  const saturdayBasedOffset = (first.getDay() + 1) % 7;
  start.setDate(first.getDate() - saturdayBasedOffset);
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}

const typeLabels: Record<TaskType, string> = {
  study: "مطالعه",
  test: "تست",
  review: "مرور",
  other: "سایر",
};

const priorityLabels: Record<Priority, string> = {
  low: "کم",
  medium: "متوسط",
  high: "زیاد",
};

const statusLabels: Record<TaskStatus, string> = {
  planned: "برنامه‌ریزی‌شده",
  in_progress: "در حال انجام",
  completed: "تکمیل‌شده",
};

export default function DailyPlannerCalendar() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const todayKey = toDayKey(new Date());
  const [cursor, setCursor] = useState(() => new Date());
  const [selectedDayKey, setSelectedDayKey] = useState(todayKey);
  const [title, setTitle] = useState("");
  const [taskType, setTaskType] = useState<TaskType>("study");
  const [plannedMinutes, setPlannedMinutes] = useState("45");
  const [priority, setPriority] = useState<Priority>("medium");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const calendarDays = useMemo(() => getCalendarDays(cursor), [cursor]);
  const startDayKey = toDayKey(calendarDays[0]);
  const endDayKey = toDayKey(calendarDays[calendarDays.length - 1]);

  const tasks = useQuery(
    api.planner.getRange,
    isAuthenticated ? { startDayKey, endDayKey } : "skip",
  );
  const createTask = useMutation(api.planner.createTask);
  const setTaskStatus = useMutation(api.planner.setTaskStatus);
  const rescheduleTask = useMutation(api.planner.rescheduleTask);
  const cancelTask = useMutation(api.planner.cancelTask);

  const tasksByDay = useMemo(() => {
    const map = new Map<string, NonNullable<typeof tasks>>();
    for (const task of tasks ?? []) {
      const group = map.get(task.dayKey) ?? [];
      group.push(task);
      map.set(task.dayKey, group);
    }
    return map;
  }, [tasks]);

  const selectedTasks = tasksByDay.get(selectedDayKey) ?? [];
  const selectedMinutes = selectedTasks
    .filter((task) => task.status !== "completed")
    .reduce((sum, task) => sum + task.plannedMinutes, 0);

  async function submitTask(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      await createTask({
        dayKey: selectedDayKey,
        title,
        taskType,
        plannedMinutes: Number(plannedMinutes),
        priority,
      });
      setTitle("");
      setMessage("فعالیت به برنامه روز انتخاب‌شده اضافه شد.");
    } catch {
      setMessage("ثبت فعالیت ممکن نشد؛ عنوان و زمان را بررسی کنید.");
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(taskId: Id<"plannerTasks">, status: TaskStatus) {
    setMessage("");
    try {
      await setTaskStatus({ taskId, status });
    } catch {
      setMessage("به‌روزرسانی وضعیت ممکن نشد.");
    }
  }

  async function moveToTomorrow(taskId: Id<"plannerTasks">, dayKey: string) {
    const date = fromDayKey(dayKey);
    date.setDate(date.getDate() + 1);
    try {
      await rescheduleTask({ taskId, dayKey: toDayKey(date) });
      setMessage("فعالیت به روز بعد منتقل شد.");
    } catch {
      setMessage("جابه‌جایی فعالیت ممکن نشد.");
    }
  }

  async function cancel(taskId: Id<"plannerTasks">) {
    try {
      await cancelTask({ taskId });
      setMessage("فعالیت از برنامه فعال خارج شد.");
    } catch {
      setMessage("لغو فعالیت ممکن نشد.");
    }
  }

  if (isLoading) {
    return <div className="p-8 text-slate-300">در حال بررسی ورود امن…</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="p-5 md:p-8" dir="rtl">
        <div className="mx-auto max-w-xl rounded-2xl border border-slate-600 bg-slate-900 p-8 text-center">
          <h1 className="text-2xl font-black text-white">برنامه‌ریز شخصی</h1>
          <p className="mt-3 text-slate-300">
            برای ساخت تقویم و برنامه روزانه، ابتدا وارد حساب خود شوید.
          </p>
          <Link href="/sign-in" className="mt-6 inline-flex rounded-xl bg-cyan-500 px-5 py-2.5 font-bold text-slate-950">
            ورود امن
          </Link>
        </div>
      </div>
    );
  }

  const monthLabel = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    month: "long",
    year: "numeric",
  }).format(cursor);

  return (
    <div className="space-y-6 p-5 md:p-8" dir="rtl">
      <header>
        <p className="text-sm font-bold text-cyan-300">Sprint 2C • Daily Planner</p>
        <h1 className="mt-2 text-3xl font-black text-white">برنامه روزانه و تقویم مطالعه</h1>
        <p className="mt-2 text-slate-300">
          فعالیت‌ها را برای هر روز ثبت کنید و پیشرفت اجرای برنامه را زنده ببینید.
        </p>
      </header>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <div className="rounded-2xl border border-slate-600 bg-slate-900 p-4 md:p-6">
          <div className="mb-5 flex items-center justify-between">
            <button
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
              className="rounded-lg border border-slate-500 px-3 py-2 text-white hover:bg-slate-800"
              aria-label="ماه قبل"
            >
              ماه قبل
            </button>
            <h2 className="text-xl font-black text-white">{monthLabel}</h2>
            <button
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
              className="rounded-lg border border-slate-500 px-3 py-2 text-white hover:bg-slate-800"
              aria-label="ماه بعد"
            >
              ماه بعد
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-300">
            {["ش", "ی", "د", "س", "چ", "پ", "ج"].map((day) => (
              <div key={day} className="py-2">{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((date) => {
              const dayKey = toDayKey(date);
              const dayTasks = tasksByDay.get(dayKey) ?? [];
              const completed = dayTasks.filter((task) => task.status === "completed").length;
              const isCurrentMonth = date.getMonth() === cursor.getMonth();
              const isSelected = dayKey === selectedDayKey;
              return (
                <button
                  key={dayKey}
                  onClick={() => setSelectedDayKey(dayKey)}
                  className={`min-h-20 rounded-xl border p-2 text-right transition ${
                    isSelected
                      ? "border-cyan-300 bg-cyan-400/15"
                      : "border-slate-700 bg-slate-950 hover:border-slate-500"
                  } ${isCurrentMonth ? "text-white" : "text-slate-500"}`}
                >
                  <span className="text-sm font-bold">
                    {new Intl.DateTimeFormat("fa-IR-u-ca-persian", { day: "numeric" }).format(date)}
                  </span>
                  {dayTasks.length > 0 && (
                    <span className="mt-2 block text-[11px] text-cyan-200">
                      {completed.toLocaleString("fa-IR")} / {dayTasks.length.toLocaleString("fa-IR")} انجام
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-5">
          <form onSubmit={submitTask} className="space-y-4 rounded-2xl border border-slate-600 bg-slate-900 p-5">
            <div>
              <h2 className="text-xl font-black text-white">افزودن فعالیت</h2>
              <p className="mt-1 text-sm text-slate-300">
                {new Intl.DateTimeFormat("fa-IR-u-ca-persian", { dateStyle: "full" }).format(fromDayKey(selectedDayKey))}
              </p>
            </div>
            <input required minLength={2} maxLength={160} value={title} onChange={(event) => setTitle(event.target.value)} className={inputClass} placeholder="عنوان فعالیت" />
            <div className="grid grid-cols-2 gap-3">
              <select value={taskType} onChange={(event) => setTaskType(event.target.value as TaskType)} className={inputClass}>
                {Object.entries(typeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
              <select value={priority} onChange={(event) => setPriority(event.target.value as Priority)} className={inputClass}>
                {Object.entries(priorityLabels).map(([value, label]) => <option key={value} value={value}>اولویت {label}</option>)}
              </select>
            </div>
            <label className="block space-y-2 text-sm text-slate-200">
              <span>زمان برنامه‌ریزی‌شده (دقیقه)</span>
              <input required type="number" min={5} max={720} step={5} value={plannedMinutes} onChange={(event) => setPlannedMinutes(event.target.value)} className={inputClass} />
            </label>
            <button disabled={saving} className="w-full rounded-xl bg-cyan-500 px-4 py-2.5 font-black text-slate-950 disabled:opacity-50">
              افزودن به برنامه
            </button>
          </form>

          <div className="rounded-2xl border border-slate-600 bg-slate-900 p-5">
            <p className="text-sm text-slate-300">زمان باقی‌مانده برنامه این روز</p>
            <p className="mt-2 text-3xl font-black text-white">
              {selectedMinutes.toLocaleString("fa-IR")} دقیقه
            </p>
          </div>
        </div>
      </section>

      {message && <p className="rounded-xl border border-cyan-400/40 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100">{message}</p>}

      <section className="rounded-2xl border border-slate-600 bg-slate-900 p-5">
        <h2 className="text-xl font-black text-white">برنامه روز انتخاب‌شده</h2>
        {tasks === undefined ? (
          <p className="mt-4 text-slate-300">در حال دریافت برنامه…</p>
        ) : selectedTasks.length === 0 ? (
          <p className="mt-4 text-slate-300">برای این روز هنوز فعالیتی ثبت نشده است.</p>
        ) : (
          <div className="mt-5 space-y-3">
            {selectedTasks.map((task) => (
              <article key={task.id} className="rounded-xl border border-slate-600 bg-slate-950 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-white">{task.title}</h3>
                    <p className="mt-1 text-sm text-slate-300">
                      {typeLabels[task.taskType]} • {task.plannedMinutes.toLocaleString("fa-IR")} دقیقه • اولویت {priorityLabels[task.priority]}
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                    task.status === "completed" ? "bg-emerald-400 text-slate-950" : "bg-slate-700 text-white"
                  }`}>
                    {statusLabels[task.status as TaskStatus]}
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {task.status !== "completed" && (
                    <>
                      <button onClick={() => changeStatus(task.id, "in_progress")} className="rounded-lg border border-amber-300 px-3 py-1.5 text-xs font-bold text-amber-200">شروع</button>
                      <button onClick={() => changeStatus(task.id, "completed")} className="rounded-lg bg-emerald-400 px-3 py-1.5 text-xs font-bold text-slate-950">تکمیل</button>
                    </>
                  )}
                  {task.status === "completed" && (
                    <button onClick={() => changeStatus(task.id, "planned")} className="rounded-lg border border-slate-400 px-3 py-1.5 text-xs font-bold text-white">بازگردانی</button>
                  )}
                  <button onClick={() => moveToTomorrow(task.id, task.dayKey)} className="rounded-lg border border-cyan-300 px-3 py-1.5 text-xs font-bold text-cyan-100">انتقال به فردا</button>
                  <button onClick={() => cancel(task.id)} className="rounded-lg border border-rose-400 px-3 py-1.5 text-xs font-bold text-rose-200">لغو</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
