"use client";

import { useEffect, useState } from "react";
import { LogIn, LogOut, UserCircle, UserPlus } from "lucide-react";
import { hasSupabaseConfig, supabase } from "@/lib/supabase";

export function AuthPanel() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setSessionEmail(data.session?.user.email ?? null);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionEmail(session?.user.email ?? null);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  const signUp = async () => {
    if (!supabase || !email || !password) return;
    setBusy(true);
    const { error } = await supabase.auth.signUp({ email, password });
    setBusy(false);
    setMessage(error ? error.message : "Account created. If email confirmation is enabled, check your inbox before logging in.");
  };

  const signIn = async () => {
    if (!supabase || !email || !password) return;
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    setMessage(error ? error.message : "Logged in. DecideLife will sync your data online.");
  };

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setSessionEmail(null);
  };

  return (
    <article className="dl-card p-5">
      <div className="mb-3 flex items-center gap-3">
        <UserCircle className="h-5 w-5 text-cyan" />
        <h2 className="font-semibold text-white">Authentication</h2>
      </div>

      {!hasSupabaseConfig ? (
        <p className="text-sm text-slate-400">Local profile mode is active until Supabase keys are added.</p>
      ) : sessionEmail ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-300">Signed in as {sessionEmail}</p>
          <button className="dl-button rounded-lg border border-line bg-white/[0.03] px-3 py-2 text-sm text-slate-200 hover:border-cyan/60" onClick={signOut}>
            <LogOut className="mr-2 inline h-4 w-4" />
            Sign out
          </button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto_auto]">
          <input
            type="email"
            className="rounded-lg border border-line bg-ink/70 px-3 py-2 text-white outline-none transition focus:border-cyan/60"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.currentTarget.value)}
          />
          <input
            type="password"
            className="rounded-lg border border-line bg-ink/70 px-3 py-2 text-white outline-none transition focus:border-cyan/60"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.currentTarget.value)}
          />
          <button
            className="dl-button inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-cyan/40 bg-cyan/10 px-4 text-sm font-semibold text-cyan hover:border-cyan/70 hover:bg-cyan/15 disabled:opacity-50"
            onClick={signUp}
            disabled={busy || !email || !password}
          >
            <UserPlus className="h-4 w-4" />
            Sign up
          </button>
          <button
            className="dl-button inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan to-mint px-4 text-sm font-semibold text-slate-950 shadow-glow hover:brightness-110"
            onClick={signIn}
            disabled={busy || !email || !password}
          >
            <LogIn className="h-4 w-4" />
            Log in
          </button>
          {message ? <p className="text-sm text-slate-400 sm:col-span-4">{message}</p> : null}
        </div>
      )}
    </article>
  );
}
