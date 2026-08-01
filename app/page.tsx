"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useConvexAuth } from "convex/react";
import GuestLanding from "@/components/home/guest-landing";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated } = useConvexAuth();

  useEffect(() => {
    if (isAuthenticated) router.replace("/dashboard");
  }, [isAuthenticated, router]);

  return <GuestLanding />;
}
