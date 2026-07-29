import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata = {
  title: "CivilMind AI",
  description: "AI Platform for Civil Engineering License Exam",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" className={cn("font-sans", geist.variable)}>
      <body>{children}</body>
    </html>
  );
}