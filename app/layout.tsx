import "./globals.css";
import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { ConvexClientProvider } from "./ConvexClientProvider";

export const metadata: Metadata = {
  title: {
    default: "CivilMind AI | سیویل‌مایند",
    template: "%s | CivilMind AI",
  },
  description: "پلتفرم هوشمند آمادگی آزمون نظام مهندسی عمران",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Client-side Clerk only requires the publishable key. Requiring the
  // server secret here caused the entire identity provider to be disabled
  // whenever a Vercel deployment could not read CLERK_SECRET_KEY.
  const authEnabled = Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  );

  const application = (
    <ConvexClientProvider authEnabled={authEnabled}>
      {children}
    </ConvexClientProvider>
  );

  return (
    <html lang="fa" dir="rtl">
      <body>
        {authEnabled ? <ClerkProvider>{application}</ClerkProvider> : application}
      </body>
    </html>
  );
}
