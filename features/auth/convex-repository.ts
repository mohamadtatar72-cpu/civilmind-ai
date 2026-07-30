"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { CivilMindUser } from "./domain";

export function useCurrentAccount() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const ensureCurrentUser = useMutation(api.users.ensureCurrentUser);
  const [provisionedUserId, setProvisionedUserId] = useState<string | null>(null);
  const [failedUserId, setFailedUserId] = useState<string | null>(null);
  const clerkUserId = clerkUser?.id;

  useEffect(() => {
    if (!isAuthenticated || !clerkUserId) return;

    let active = true;
    void ensureCurrentUser({})
      .then(() => {
        if (active) setProvisionedUserId(clerkUserId);
      })
      .catch(() => {
        if (active) setFailedUserId(clerkUserId);
      });

    return () => {
      active = false;
    };
  }, [clerkUserId, ensureCurrentUser, isAuthenticated]);

  const profileReady = Boolean(
    clerkUserId && provisionedUserId === clerkUserId,
  );
  const provisioningFailed = Boolean(
    clerkUserId && failedUserId === clerkUserId,
  );

  const currentUser = useQuery(
    api.users.current,
    isAuthenticated && profileReady ? {} : "skip",
  ) as CivilMindUser | undefined;

  const loading =
    authLoading ||
    !clerkLoaded ||
    (isAuthenticated &&
      !provisioningFailed &&
      (!profileReady || !currentUser));

  return {
    isAuthenticated,
    loading,
    provisionError: provisioningFailed ? "PROFILE_PROVISION_FAILED" : null,
    user: currentUser,
    isAdmin: currentUser?.role === "admin",
    isPremium:
      currentUser?.role === "premium" || currentUser?.role === "admin",
  };
}
