import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import { isClerkConfigured } from "@/lib/clerk";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cost Tracking",
  description: "Track expenses, recurring costs, and debts across shared workspaces.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  if (!isClerkConfigured) {
    return (
      <html lang="en">
        <body>{children}</body>
      </html>
    );
  }

  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
