"use client";

import type { ReactNode } from "react";
import { ConvexProvider, ConvexReactClient } from "convex/react";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!convexUrl) {
  throw new Error(
    "تنظیم توسعه ناقص است: متغیر NEXT_PUBLIC_CONVEX_URL برای اتصال Convex تعریف نشده است.",
  );
}

const convexClient = new ConvexReactClient(convexUrl);

export interface ConvexClientProviderProps {
  children: ReactNode;
}

export function ConvexClientProvider({
  children,
}: ConvexClientProviderProps) {
  return <ConvexProvider client={convexClient}>{children}</ConvexProvider>;
}
