"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { CivilMindUser } from "./domain";

interface CurrentAccountState {
  isAuthenticated: boolean;
  loading: boolean;
  provisionError: string | null;
  user: CivilMindUser | undefined;
  isAdmin: boolean;
  isPremium: boolean;
}

const CurrentAccountContext = createContext<CurrentAccountState | undefined>(
  undefined,
);

function useCurrentAccountSource(sessionKey?: string): CurrentAccountState {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const ensureCurrentUser = useMutation(api.users.ensureCurrentUser);
  const [provisionedSessionKey, setProvisionedSessionKey] = useState<
    string | null
  >(null);
  const [failedSessionKey, setFailedSessionKey] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !sessionKey) return;

    let active = true;
    void ensureCurrentUser({})
      .then(() => {
        if (active) {
          setProvisionedSessionKey(sessionKey);
          setFailedSessionKey((current) =>
            current === sessionKey ? null : current,
          );
        }
      })
      .catch(() => {
        if (active) setFailedSessionKey(sessionKey);
      });

    return () => {
      active = false;
    };
  }, [ensureCurrentUser, isAuthenticated, sessionKey]);

  const profileReady = Boolean(
    sessionKey && provisionedSessionKey === sessionKey,
  );
  const provisioningFailed = Boolean(
    sessionKey && failedSessionKey === sessionKey,
  );

  const currentUser = useQuery(
    api.users.current,
    isAuthenticated && profileReady ? {} : "skip",
  ) as CivilMindUser | undefined;

  const loading =
    authLoading ||
    (isAuthenticated &&
      (!sessionKey ||
        (!provisioningFailed && (!profileReady || !currentUser))));

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

export function CurrentAccountProvider({
  children,
  sessionKey,
}: {
  children: ReactNode;
  sessionKey?: string;
}) {
  const account = useCurrentAccountSource(sessionKey);

  return (
    <CurrentAccountContext.Provider value={account}>
      {children}
    </CurrentAccountContext.Provider>
  );
}

export function useCurrentAccount() {
  const account = useContext(CurrentAccountContext);

  if (!account) {
    throw new Error(
      "useCurrentAccount must be used inside CurrentAccountProvider.",
    );
  }

  return account;
}
