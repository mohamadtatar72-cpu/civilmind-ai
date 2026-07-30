"use client";

import { useEffect, useState } from "react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { CivilMindUser } from "./domain";

export function useCurrentAccount() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const ensureCurrentUser = useMutation(api.users.ensureCurrentUser);
  const [profileReady, setProfileReady] = useState(false);
  const [provisionError, setProvisionError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    if (!isAuthenticated) {
      setProfileReady(false);
      setProvisionError(null);
      return () => {
        active = false;
      };
    }

    setProvisionError(null);
    void ensureCurrentUser({})
      .then(() => {
        if (active) setProfileReady(true);
      })
      .catch(() => {
        if (active) {
          setProfileReady(false);
          setProvisionError("PROFILE_PROVISION_FAILED");
        }
      });

    return () => {
      active = false;
    };
  }, [ensureCurrentUser, isAuthenticated]);

  const currentUser = useQuery(
    api.users.current,
    isAuthenticated && profileReady ? {} : "skip",
  ) as CivilMindUser | undefined;

  const loading = authLoading || (isAuthenticated && (!profileReady || !currentUser));

  return {
    isAuthenticated,
    loading,
    provisionError,
    user: currentUser,
    isAdmin: currentUser?.role === "admin",
    isPremium: currentUser?.role === "premium" || currentUser?.role === "admin",
  };
}
