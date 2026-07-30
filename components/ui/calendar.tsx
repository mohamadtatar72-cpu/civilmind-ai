"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CalendarProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onSelect"> {
  month?: Date;
  selected?: Date;
  onSelect?: (date: Date) => void;
  onMonthChange?: (date: Date) => void;
  disabled?: (date: Date) => boolean;
}

const weekdays = ["ش", "ی", "د", "س", "چ", "پ", "ج"];

export function Calendar({ className, month, selected, onSelect, onMonthChange, disabled, ...props }: CalendarProps) {
  const [internalMonth, setInternalMonth] = React.useState(() => month ?? new Date());
  const visibleMonth = month ?? internalMonth;
  const first = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
  const startOffset = (first.getDay() + 1) % 7;
  const days = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0).getDate();

  function changeMonth(offset: number) {
    const next = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + offset, 1);
    if (!month) setInternalMonth(next);
    onMonthChange?.(next);
  }

  return <div data-slot="calendar" className={cn("w-72 rounded-xl border border-border bg-popover p-3", className)} {...props}>
    <div className="mb-3 flex items-center justify-between">
      <button type="button" onClick={() => changeMonth(-1)} aria-label="ماه قبل" className="rounded-lg p-2 hover:bg-muted"><ChevronRight className="size-4" /></button>
      <strong className="text-sm">{visibleMonth.toLocaleDateString("fa-IR", { month: "long", year: "numeric" })}</strong>
      <button type="button" onClick={() => changeMonth(1)} aria-label="ماه بعد" className="rounded-lg p-2 hover:bg-muted"><ChevronLeft className="size-4" /></button>
    </div>
    <div className="grid grid-cols-7 text-center text-xs text-muted-foreground">{weekdays.map(day => <span key={day} className="py-2">{day}</span>)}</div>
    <div className="grid grid-cols-7 gap-1">{Array.from({ length: startOffset }).map((_, index) => <span key={`empty-${index}`} />)}{Array.from({ length: days }, (_, index) => {
      const date = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), index + 1);
      const isSelected = selected?.toDateString() === date.toDateString();
      const isDisabled = disabled?.(date) ?? false;
      return <CalendarDayButton key={index + 1} date={date} selected={isSelected} disabled={isDisabled} onClick={() => onSelect?.(date)} />;
    })}</div>
  </div>;
}

export function CalendarDayButton({ date, selected, className, ...props }: { date: Date; selected?: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" aria-pressed={selected} className={cn("aspect-square rounded-lg text-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40", selected && "bg-primary text-primary-foreground hover:bg-primary", className)} {...props}>{date.toLocaleDateString("fa-IR", { day: "numeric" })}</button>;
}
