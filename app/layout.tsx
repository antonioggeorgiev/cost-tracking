import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import { isClerkConfigured } from "@/lib/clerk";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "Cost Tracking",
  description: "Track expenses, recurring costs, and debts across shared workspaces.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const inner = (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body>{children}</body>
    </html>
  );

  if (!isClerkConfigured) {
    return inner;
  }

  return <ClerkProvider>{inner}</ClerkProvider>;
}
