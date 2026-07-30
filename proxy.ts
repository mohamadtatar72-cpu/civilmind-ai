import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";

const protectedPrefixes = [
  "/profile",
  "/settings",
  "/planner",
  "/admin",
] as const;

function isProtectedPath(pathname: string) {
  return protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

const clerkConfigured = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY,
);

const unauthenticatedPassThrough = (_request: NextRequest) => NextResponse.next();

const authenticatedProxy = clerkMiddleware(async (auth, request) => {
  if (isProtectedPath(request.nextUrl.pathname)) {
    await auth.protect();
  }
});

export default clerkConfigured ? authenticatedProxy : unauthenticatedPassThrough;

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};
