import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { DecideLifeProvider } from "@/lib/local-store";

export const metadata: Metadata = {
  title: "DecideLife",
  description: "Personal life progression system"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <DecideLifeProvider>{children}</DecideLifeProvider>
      </body>
    </html>
  );
}
