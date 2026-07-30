"use client";

import type { ReactNode } from "react";
import { useAuth } from "@clerk/nextjs";
import {
  ConvexProviderWithAuth,
  ConvexReactClient,
} from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";

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

function ClerkConvexProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexProviderWithClerk client={convexClient} useAuth={useAuth}>
      {children}
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
        {children}
      </ConvexProviderWithAuth>
    );
  }

  return <ClerkConvexProvider>{children}</ClerkConvexProvider>;
}
