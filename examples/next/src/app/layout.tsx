import type { ReactNode } from "react";
import "./globals.css";

export const metadata = { title: "Protolab example" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="mx-auto max-w-3xl px-4 font-sans text-neutral-900">{children}</body>
    </html>
  );
}
