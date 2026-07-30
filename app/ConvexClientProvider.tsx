"use client";

import type { ReactNode } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import {
  ConvexProviderWithAuth,
  ConvexReactClient,
} from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { CurrentAccountProvider } from "@/features/auth/convex-repository";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!convexUrl) {
  throw new Error(
    "تنظیم توسعه ناقص است: متغیر NEXT_PUBLIC_CONVEX_URL برای اتصال Convex تعریف نشده است.",
  );
}

const convexClient = new ConvexReactClient(convexUrl);
const fetchNoAccessToken = async () => null;

export interface ConvexClientProviderProps {
  children: ReactNode;
  authEnabled?: boolean;
}

function useDisabledAuth() {
  return {
    isLoading: false,
    isAuthenticated: false,
    fetchAccessToken: fetchNoAccessToken,
  };
}

function ClerkAccountBoundary({ children }: { children: ReactNode }) {
  const { user, isLoaded } = useUser();

  return (
    <CurrentAccountProvider sessionKey={isLoaded ? user?.id : undefined}>
      {children}
    </CurrentAccountProvider>
  );
}

function ClerkConvexProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexProviderWithClerk client={convexClient} useAuth={useAuth}>
      <ClerkAccountBoundary>{children}</ClerkAccountBoundary>
    </ConvexProviderWithClerk>
  );
}

export function ConvexClientProvider({
  children,
  authEnabled = false,
}: ConvexClientProviderProps) {
  if (!authEnabled) {
    return (
      <ConvexProviderWithAuth
        client={convexClient}
        useAuth={useDisabledAuth}
      >
        <CurrentAccountProvider>{children}</CurrentAccountProvider>
      </ConvexProviderWithAuth>
    );
  }

  return <ClerkConvexProvider>{children}</ClerkConvexProvider>;
}
