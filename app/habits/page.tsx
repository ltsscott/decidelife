"use client";

import { useState } from "react";
import { CalendarDays, Plus } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { HabitCard } from "@/components/HabitCard";
import { HabitFormModal } from "@/components/HabitFormModal";
import { NotificationBanner } from "@/components/NotificationBanner";
import { useDecideLife } from "@/lib/local-store";
import type { Habit } from "@/types";

export default function HabitsPage() {
  const {
    habits,
    habitLogs,
    completeHabit,
    missHabit,
    saveHabit,
    archiveHabit,
    notification,
    dismissNotification
  } = useDecideLife();
  const [logDate, setLogDate] = useState(new Date().toISOString().slice(0, 10));
  const [editingHabit, setEditingHabit] = useState<Habit | undefined>();
  const [formOpen, setFormOpen] = useState(false);
  const visibleHabits = habits.filter((habit) => !habit.archived).sort((a, b) => a.order - b.order);

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl">
        <header className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium text-cyan">Habits</p>
            <h1 className="mt-2 text-4xl font-semibold text-white">Sequential unlocks, simple logging.</h1>
            <p className="mt-3 text-sm text-slate-400">Backfill honestly, protect streaks automatically, and keep the chain clean.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <label className="flex items-center gap-2 rounded-xl border border-line bg-white/[0.04] px-3 py-2 text-sm text-slate-300 backdrop-blur-xl">
              <CalendarDays className="h-4 w-4 text-cyan" />
              Backfill date
              <input
                type="date"
                className="rounded-lg border border-line bg-ink/70 px-2 py-1 text-slate-200 outline-none transition focus:border-cyan/60"
                value={logDate}
                onChange={(event) => setLogDate(event.currentTarget.value)}
              />
            </label>
            <button
              type="button"
              className="dl-button inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-cyan to-mint px-4 text-sm font-semibold text-slate-950 shadow-glow hover:brightness-110"
              onClick={() => {
                setEditingHabit(undefined);
                setFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              New Habit
            </button>
          </div>
        </header>

        <NotificationBanner message={notification} onDismiss={dismissNotification} />

        <section className="grid gap-4 lg:grid-cols-2">
          {visibleHabits.map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              log={habitLogs.find((log) => log.habitId === habit.id && log.date === logDate)}
              onComplete={(habitId, durationMinutes) => completeHabit(habitId, logDate, durationMinutes)}
              onMiss={(habitId) => missHabit(habitId, logDate)}
              onEdit={(item) => {
                setEditingHabit(item);
                setFormOpen(true);
              }}
              onArchive={archiveHabit}
            />
          ))}
        </section>

        {formOpen ? (
          <HabitFormModal
            habit={editingHabit}
            habits={visibleHabits}
            onSave={saveHabit}
            onClose={() => {
              setFormOpen(false);
              setEditingHabit(undefined);
            }}
          />
        ) : null}
      </div>
    </DashboardLayout>
  );
}
