import "./globals.css";
import type { Metadata } from "next";
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
  return (
    <html lang="fa" dir="rtl">
      <body>
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  );
}
