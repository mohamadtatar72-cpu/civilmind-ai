"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import type { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { useCurrentAccount } from "@/features/auth/convex-repository";
import type { CivilMindRole, CivilMindUser } from "@/features/auth/domain";
import {
  roleLabels,
  userStatusLabels,
} from "@/features/auth/domain";
import { AdminAccess } from "./admin-access";
import {
  GlassPanel,
  PageHeader,
  StatusBadge,
} from "@/components/ui/civilmind";

export default function AdminUsers() {
  const account = useCurrentAccount();
  const users = useQuery(
    api.users.adminListUsers,
    account.isAdmin ? { limit: 50 } : "skip",
  ) as CivilMindUser[] | undefined;
  const adminSetRole = useMutation(api.users.adminSetRole);
  const adminSetStatus = useMutation(api.users.adminSetStatus);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function changeRole(user: CivilMindUser, role: CivilMindRole) {
    if (user.role === role) return;
    setWorkingId(user.id);
    setMessage(null);
    try {
      await adminSetRole({
        userId: user.id as Id<"users">,
        role,
        reason: "تغییر نقش از پنل مدیریت CivilMind",
      });
      setMessage("نقش کاربر با موفقیت تغییر کرد.");
    } catch {
      setMessage("تغییر نقش رد شد؛ حفاظت آخرین مدیر یا مجوز حساب بررسی شود.");
    } finally {
      setWorkingId(null);
    }
  }

  async function toggleSuspension(user: CivilMindUser) {
    const nextStatus = user.status === "active" ? "suspended" : "active";
    setWorkingId(user.id);
    setMessage(null);
    try {
      await adminSetStatus({
        userId: user.id as Id<"users">,
        status: nextStatus,
        reason: "تغییر وضعیت حساب از پنل مدیریت CivilMind",
      });
      setMessage("وضعیت حساب به‌روزرسانی شد.");
    } catch {
      setMessage("تغییر وضعیت رد شد؛ حفاظت آخرین مدیر یا مجوز حساب بررسی شود.");
    } finally {
      setWorkingId(null);
    }
  }

  return (
    <AdminAccess>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Admin • Users"
          title="مدیریت کاربران"
          description="نقش و وضعیت حساب‌ها در Backend تغییر می‌کند و تمام عملیات در Audit Log ثبت می‌شوند."
        />
        {message && (
          <GlassPanel className="py-3 text-sm text-slate-200">{message}</GlassPanel>
        )}
        {!users ? (
          <div className="h-56 animate-pulse rounded-2xl border border-white/10 bg-white/[0.04]" />
        ) : users.length === 0 ? (
          <GlassPanel className="py-12 text-center text-slate-400">
            هنوز کاربری ایجاد نشده است.
          </GlassPanel>
        ) : (
          <div className="space-y-4">
            {users.map((user) => (
              <GlassPanel key={user.id}>
                <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate font-bold text-white">
                        {user.displayName ?? user.email ?? "کاربر بدون نام"}
                      </h2>
                      <StatusBadge tone={user.role === "admin" ? "info" : "neutral"}>
                        {roleLabels[user.role]}
                      </StatusBadge>
                      <StatusBadge tone={user.status === "active" ? "success" : "warning"}>
                        {userStatusLabels[user.status]}
                      </StatusBadge>
                    </div>
                    <p className="mt-2 truncate text-sm text-slate-500">
                      {user.email ?? "ایمیل در دسترس نیست"}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {(["free", "premium", "admin"] as const).map((role) => (
                      <button
                        key={role}
                        type="button"
                        disabled={workingId === user.id || user.role === role}
                        onClick={() => changeRole(user, role)}
                        className="rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-white/5 disabled:opacity-40"
                      >
                        {roleLabels[role]}
                      </button>
                    ))}
                    <button
                      type="button"
                      disabled={workingId === user.id}
                      onClick={() => toggleSuspension(user)}
                      className="rounded-lg border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-xs font-bold text-amber-200 hover:bg-amber-400/15 disabled:opacity-40"
                    >
                      {user.status === "active" ? "تعلیق حساب" : "فعال‌سازی حساب"}
                    </button>
                  </div>
                </div>
              </GlassPanel>
            ))}
          </div>
        )}
      </div>
    </AdminAccess>
  );
}
