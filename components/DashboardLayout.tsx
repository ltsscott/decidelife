import { AppSidebar } from "@/components/AppSidebar";
import type { ReactNode } from "react";

export function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <main className="relative min-h-screen lg:grid lg:grid-cols-[18rem_1fr]">
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:56px_56px] opacity-30" />
      <AppSidebar />
      <section className="relative px-4 py-6 sm:px-6 lg:px-10">{children}</section>
    </main>
  );
}
