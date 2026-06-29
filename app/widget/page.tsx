"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Flame, Maximize2, Minimize2, Target } from "lucide-react";
import { getScheduledDailyCompletionPercentage, isHabitScheduledForDate } from "@/lib/progression";
import { useDecideLife } from "@/lib/local-store";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export default function WidgetPage() {
  const {
    habits,
    habitLogs,
    missions,
    profile,
    levelProgress,
    todayCompletedHabitIds,
    completeHabit
  } = useDecideLife();
  const [compact, setCompact] = useState(false);
  const today = todayKey();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setCompact(params.get("compact") === "1" || params.get("mode") === "compact");
  }, []);

  const todaysHabits = useMemo(
    () => habits
      .filter((habit) => habit.unlocked && !habit.archived && isHabitScheduledForDate(habit, today))
      .sort((a, b) => a.order - b.order),
    [habits, today]
  );
  const completion = getScheduledDailyCompletionPercentage(habits, todayCompletedHabitIds, today);
  const activeMission = missions.find((mission) => !mission.archived && !mission.locked && !mission.completed);
  const currentStreak = Math.max(0, ...habits.filter((habit) => !habit.archived).map((habit) => habit.currentStreak));

  return (
    <main className="min-h-screen overflow-hidden bg-transparent p-3 text-white">
      <section
        className={[
          "mx-auto border border-cyan/30 bg-black/[0.35] shadow-[0_0_50px_rgba(56,189,248,0.18)] backdrop-blur-[20px]",
          "relative overflow-hidden rounded-[20px]",
          compact ? "max-w-[340px] p-4" : "max-w-[400px] p-5"
        ].join(" ")}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_12%,rgba(56,189,248,0.22),transparent_28%),radial-gradient(circle_at_85%_8%,rgba(139,92,246,0.2),transparent_26%)]" />
        <div className="relative">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan">DecideLife</p>
              <h1 className="mt-1 text-2xl font-semibold leading-none">Level {levelProgress.level}</h1>
              {!compact ? <p className="mt-1 text-xs text-slate-300">{new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}</p> : null}
            </div>
            <button
              type="button"
              className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/[0.06] text-slate-300 transition hover:border-cyan/50 hover:text-cyan"
              title="Toggle compact mode"
              onClick={() => setCompact((value) => !value)}
            >
              {compact ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </button>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-3">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-xs uppercase text-slate-400">XP</p>
                <p className="mt-1 text-lg font-semibold">{profile.totalXp.toLocaleString()}</p>
              </div>
              <p className="text-xs text-cyan">{levelProgress.percentage}%</p>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-950/70">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan via-violet to-cyan shadow-[0_0_18px_rgba(56,189,248,0.55)] transition-[width] duration-700"
                style={{ width: `${levelProgress.percentage}%` }}
              />
            </div>
          </div>

          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">Today</h2>
              <span className="rounded-full border border-cyan/30 bg-cyan/10 px-2 py-0.5 text-[11px] text-cyan">
                {todayCompletedHabitIds.length}/{todaysHabits.length}
              </span>
            </div>
            <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-gradient-to-r from-cyan to-violet transition-[width] duration-700" style={{ width: `${completion}%` }} />
            </div>
            <div className="grid gap-2">
              {todaysHabits.length ? todaysHabits.map((habit) => {
                const log = habitLogs.find((item) => item.habitId === habit.id && item.date === today);
                const done = log?.status === "completed";
                return (
                  <label
                    key={habit.id}
                    className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.045] px-3 py-2 text-sm text-slate-100 transition hover:border-cyan/40 hover:bg-cyan/[0.06]"
                  >
                    <button
                      type="button"
                      className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border transition ${done ? "border-cyan bg-cyan text-slate-950" : "border-slate-500 bg-black/20 text-transparent group-hover:border-cyan"}`}
                      onClick={() => {
                        if (!done) completeHabit(habit.id, today);
                      }}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <span className={done ? "text-slate-400 line-through" : ""}>{habit.name}</span>
                  </label>
                );
              }) : (
                <p className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-slate-400">No scheduled habits today.</p>
              )}
            </div>
          </div>

          {!compact ? (
            <div className="mt-4 grid gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-3">
                <div className="mb-1 flex items-center gap-2 text-xs uppercase text-slate-400">
                  <Target className="h-3.5 w-3.5 text-violet" />
                  Current Mission
                </div>
                <p className="text-sm font-medium text-white">{activeMission?.title ?? "No active mission"}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-3">
                <div className="mb-1 flex items-center gap-2 text-xs uppercase text-slate-400">
                  <Flame className="h-3.5 w-3.5 text-cyan" />
                  Current Streak
                </div>
                <p className="text-sm font-medium text-white">{currentStreak} days</p>
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
