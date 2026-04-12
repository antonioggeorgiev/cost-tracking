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
  const inner = (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );

  if (!isClerkConfigured) {
    return inner;
  }

  return <ClerkProvider>{inner}</ClerkProvider>;
}
