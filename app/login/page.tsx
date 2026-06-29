"use client";

import Link from "next/link";
import { AuthPanel } from "@/components/AuthPanel";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-ink p-4 text-white">
      <div className="w-full max-w-lg">
        <div className="mb-5 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan">DecideLife</p>
          <h1 className="mt-2 text-3xl font-semibold">Sign in to sync your widget.</h1>
          <p className="mt-2 text-sm text-slate-400">The desktop widget uses your authenticated Supabase account.</p>
        </div>
        <AuthPanel />
        <div className="mt-4 text-center">
          <Link className="text-sm text-cyan hover:text-white" href="/widget">Return to widget</Link>
        </div>
      </div>
    </main>
  );
}
