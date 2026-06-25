"use client";

import { useState } from "react";
import { AlertTriangle, Database, Palette, Shield, X } from "lucide-react";
import { AuthPanel } from "@/components/AuthPanel";
import { DashboardLayout } from "@/components/DashboardLayout";
import { DEV_MODE } from "@/lib/dev-mode";
import { createId } from "@/lib/ids";
import { hasSupabaseConfig } from "@/lib/supabase";
import { useDecideLife } from "@/lib/local-store";

export default function SettingsPage() {
  const {
    habits,
    profile,
    personalQuotes,
    protectorsRemaining,
    resetDecideLife,
    setTheme,
    savePersonalQuote,
    deletePersonalQuote,
    setHabitTestingStreakOverride,
    clearHabitTestingStreakOverride
  } = useDecideLife();
  const [resetOpen, setResetOpen] = useState(false);
  const [resetStep, setResetStep] = useState(1);
  const [resetText, setResetText] = useState("");
  const [quoteText, setQuoteText] = useState("");
  const visibleHabits = habits.filter((habit) => !habit.archived).sort((a, b) => a.order - b.order);
  const [testingHabitId, setTestingHabitId] = useState(visibleHabits[0]?.id ?? "");
  const selectedTestingHabit = visibleHabits.find((habit) => habit.id === testingHabitId);
  const [testingStreak, setTestingStreak] = useState(selectedTestingHabit?.testingStreakOverride ?? selectedTestingHabit?.currentStreak ?? 0);

  const updateTestingHabit = (habitId: string) => {
    const habit = visibleHabits.find((item) => item.id === habitId);
    setTestingHabitId(habitId);
    setTestingStreak(habit?.testingStreakOverride ?? habit?.currentStreak ?? 0);
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl">
        <header className="mb-7">
          <p className="text-sm font-medium text-cyan">Settings</p>
          <h1 className="mt-2 text-4xl font-semibold text-white">System status and storage.</h1>
          <p className="mt-3 text-sm text-slate-400">Local-first while Supabase waits in the wings.</p>
        </header>

        <section className="grid gap-4">
          <AuthPanel />

          <article className="dl-card p-5">
            <div className="mb-3 flex items-center gap-3">
              <Database className="h-5 w-5 text-cyan" />
              <h2 className="font-semibold text-white">Supabase</h2>
            </div>
            <p className="text-sm text-slate-400">
              {hasSupabaseConfig
                ? "Supabase credentials are present. The client is ready for authentication and database calls."
                : "Supabase credentials are not configured yet. The prototype is using local browser storage."}
            </p>
            <p className="mt-3 text-xs text-slate-500">Add values to `.env.local` using `.env.example` when your project is ready.</p>
          </article>

          <article className="dl-card p-5">
            <div className="mb-3 flex items-center gap-3">
              <Palette className="h-5 w-5 text-cyan" />
              <div>
                <h2 className="font-semibold text-white">Appearance</h2>
                <p className="text-xs text-slate-500">Theme is saved to your DecideLife profile.</p>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-5">
              {(["blue", "black", "red", "green", "gold"] as const).map((theme) => (
                <button
                  key={theme}
                  type="button"
                  className={`dl-button rounded-xl border px-4 py-3 text-sm font-semibold capitalize transition ${profile.theme === theme ? "border-cyan/60 bg-cyan/10 text-white shadow-glow" : "border-line bg-white/[0.03] text-slate-300 hover:border-cyan/40"}`}
                  onClick={() => setTheme(theme)}
                >
                  {theme}
                </button>
              ))}
            </div>
          </article>

          <article className="dl-card p-5">
            <div className="mb-3 flex items-center gap-3">
              <Palette className="h-5 w-5 text-gold" />
              <div>
                <h2 className="font-semibold text-white">Quotes</h2>
                <p className="text-xs text-slate-500">Only your own quotes appear in the Morning Brief.</p>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
              <input
                className="rounded-lg border border-line bg-ink/70 px-3 py-2 text-white outline-none transition focus:border-cyan/60"
                placeholder="Execute, don't negotiate."
                value={quoteText}
                onChange={(event) => setQuoteText(event.currentTarget.value)}
              />
              <button
                type="button"
                className="dl-button rounded-lg bg-gradient-to-r from-cyan to-mint px-4 py-2 text-sm font-semibold text-slate-950"
                onClick={() => {
                  if (!quoteText.trim()) return;
                  savePersonalQuote({ id: createId("quote", quoteText), text: quoteText.trim(), createdAt: new Date().toISOString() });
                  setQuoteText("");
                }}
              >
                Add Quote
              </button>
            </div>
            <div className="mt-4 grid gap-2">
              {personalQuotes.map((quote) => (
                <div key={quote.id} className="flex items-center justify-between gap-3 rounded-lg border border-line bg-white/[0.03] p-3">
                  <p className="text-sm text-slate-300">{quote.text}</p>
                  <button type="button" className="text-xs text-slate-500 hover:text-coral" onClick={() => deletePersonalQuote(quote.id)}>Delete</button>
                </div>
              ))}
            </div>
          </article>

          <article className="dl-card p-5">
            <div className="mb-3 flex items-center gap-3">
              <Shield className="h-5 w-5 text-gold" />
              <h2 className="font-semibold text-white">Streak Protectors</h2>
            </div>
            <p className="text-sm text-slate-400">
              You have {protectorsRemaining} of 2 protectors remaining this calendar month. They reset on the 1st.
            </p>
          </article>

          {DEV_MODE ? (
            <article className="dl-card p-5">
              <div className="mb-3 flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-cyan" />
                <div>
                  <h2 className="font-semibold text-white">Developer Testing</h2>
                  <p className="text-xs text-slate-500">Testing Only: preview habit streak visuals.</p>
                </div>
              </div>
              <p className="text-sm text-slate-400">
                TEMP TESTING FEATURE - remove before final release. This changes only the visual streak display and card tier.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_10rem_auto_auto]">
                <label className="grid gap-2 text-sm text-slate-300">
                  Habit
                  <select
                    className="rounded-lg border border-line bg-ink/70 px-3 py-2 text-white outline-none transition focus:border-cyan/60"
                    value={testingHabitId}
                    onChange={(event) => updateTestingHabit(event.currentTarget.value)}
                  >
                    {visibleHabits.map((habit) => (
                      <option key={habit.id} value={habit.id}>
                        {habit.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-2 text-sm text-slate-300">
                  Streak
                  <input
                    type="number"
                    min={0}
                    className="rounded-lg border border-line bg-ink/70 px-3 py-2 text-white outline-none transition focus:border-cyan/60"
                    value={testingStreak}
                    onChange={(event) => setTestingStreak(Number(event.currentTarget.value))}
                  />
                </label>
                <button
                  type="button"
                  className="dl-button self-end rounded-lg bg-gradient-to-r from-cyan to-mint px-4 py-2 text-sm font-semibold text-slate-950 shadow-glow hover:brightness-110"
                  disabled={!testingHabitId}
                  onClick={() => setHabitTestingStreakOverride(testingHabitId, testingStreak)}
                >
                  Save Override
                </button>
                <button
                  type="button"
                  className="dl-button self-end rounded-lg border border-line bg-white/[0.03] px-4 py-2 text-sm text-slate-300 hover:border-cyan/60"
                  disabled={!testingHabitId}
                  onClick={() => {
                    clearHabitTestingStreakOverride(testingHabitId);
                    setTestingStreak(selectedTestingHabit?.currentStreak ?? 0);
                  }}
                >
                  Reset
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {[0, 7, 30, 60, 100, 180, 365].map((value) => (
                  <button
                    key={value}
                    type="button"
                    className="dl-button rounded-full border border-line bg-white/[0.03] px-3 py-1 text-xs text-slate-300 hover:border-cyan/60 hover:text-cyan"
                    onClick={() => setTestingStreak(value)}
                  >
                    {value} days
                  </button>
                ))}
              </div>
            </article>
          ) : null}

          <article className="rounded-xl border border-coral/35 bg-coral/5 p-5 shadow-panel backdrop-blur-xl">
              <div className="mb-3 flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-coral" />
                <h2 className="font-semibold text-white">Reset DecideLife</h2>
              </div>
              <p className="text-sm text-slate-400">
                Permanently erase your DecideLife progress while keeping your user account intact.
              </p>
              <button
                type="button"
                className="dl-button mt-4 rounded-lg border border-coral/40 bg-coral/10 px-4 py-2 text-sm font-medium text-coral hover:bg-coral/15"
                onClick={() => {
                  setResetStep(1);
                  setResetText("");
                  setResetOpen(true);
                }}
              >
                Reset DecideLife
              </button>
            </article>
        </section>

        {resetOpen ? (
          <div className="fixed inset-0 z-50 grid place-items-center bg-ink/82 p-4 backdrop-blur-xl">
            <section className="w-full max-w-lg rounded-xl border border-coral/40 bg-panel p-5 shadow-premium">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-white">Reset DecideLife</h2>
                  {resetStep === 1 ? <p className="mt-2 text-sm text-slate-400">This will permanently erase your DecideLife progress.</p> : null}
                  {resetStep === 2 ? <p className="mt-2 text-sm text-slate-400">This cannot be undone.</p> : null}
                  {resetStep === 3 ? (
                    <div className="mt-2 grid gap-3">
                      <p className="text-sm text-slate-400">Type RESET to confirm. This deletes habits, logs, missions, XP, journal entries, trading journals, notes, statistics, calendar data, and streak protectors.</p>
                      <input
                        className="rounded-lg border border-coral/35 bg-ink/70 px-3 py-2 text-white outline-none transition focus:border-coral"
                        value={resetText}
                        onChange={(event) => setResetText(event.currentTarget.value)}
                        placeholder="RESET"
                      />
                    </div>
                  ) : null}
                </div>
                <button type="button" className="dl-button grid h-9 w-9 place-items-center rounded-lg border border-line text-slate-300" onClick={() => setResetOpen(false)}>
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" className="dl-button rounded-lg border border-line bg-white/[0.03] px-4 py-2 text-sm text-slate-300" onClick={() => setResetOpen(false)}>
                  Cancel
                </button>
                {resetStep < 3 ? (
                  <button type="button" className="dl-button rounded-lg bg-coral px-4 py-2 text-sm font-medium text-white hover:bg-rose-400" onClick={() => setResetStep((step) => step + 1)}>
                    Continue
                  </button>
                ) : (
                  <button
                    type="button"
                    className="dl-button rounded-lg bg-coral px-4 py-2 text-sm font-medium text-white hover:bg-rose-400 disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={resetText !== "RESET"}
                    onClick={() => {
                      resetDecideLife();
                      setResetOpen(false);
                    }}
                  >
                    Reset Everything
                  </button>
                )}
              </div>
            </section>
          </div>
        ) : null}
      </div>
    </DashboardLayout>
  );
}
