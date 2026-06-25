"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { createId } from "@/lib/ids";
import type { Habit } from "@/types";

interface HabitFormModalProps {
  habit?: Habit;
  habits: Habit[];
  onSave: (habit: Habit) => void;
  onClose: () => void;
}

const weekdays = [
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
  { value: 0, label: "Sun" }
];

export function HabitFormModal({ habit, habits, onSave, onClose }: HabitFormModalProps) {
  const [name, setName] = useState(habit?.name ?? "");
  const [description, setDescription] = useState(habit?.description ?? "");
  const [category, setCategory] = useState(habit?.category ?? "personal");
  const [baseXp, setBaseXp] = useState(habit?.baseXp ?? 100);
  const [order, setOrder] = useState(habit?.order ?? habits.length + 1);
  const [unlocked, setUnlocked] = useState(habit?.unlocked ?? false);
  const [prerequisiteHabitId, setPrerequisiteHabitId] = useState(habit?.prerequisiteHabitId ?? "");
  const [streakMultiplierEnabled, setStreakMultiplierEnabled] = useState(habit?.streakMultiplierEnabled ?? true);
  const [activeDays, setActiveDays] = useState<number[]>(habit?.activeDays?.length ? habit.activeDays : [0, 1, 2, 3, 4, 5, 6]);
  const [reminderTime, setReminderTime] = useState(habit?.reminderTime ?? "");
  const [sessionMinutes, setSessionMinutes] = useState(habit?.sessionMinutes ?? 0);

  const toggleDay = (day: number) => {
    setActiveDays((current) => {
      const next = current.includes(day) ? current.filter((item) => item !== day) : [...current, day];
      return next.length ? next.sort((a, b) => a - b) : current;
    });
  };

  const submit = () => {
    if (!name.trim()) return;
    onSave({
      id: habit?.id ?? createId("habit", name),
      name: name.trim(),
      description: description.trim(),
      category: category.trim() || "personal",
      baseXp,
      order,
      unlocked,
      prerequisiteHabitId: prerequisiteHabitId || undefined,
      streakMultiplierEnabled,
      currentStreak: habit?.currentStreak ?? 0,
      bestStreak: habit?.bestStreak ?? 0,
      archived: false,
      activeDays,
      reminderTime: reminderTime || undefined,
      sessionMinutes: sessionMinutes > 0 ? sessionMinutes : undefined
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-ink/82 p-3 backdrop-blur-xl sm:p-4">
      <section className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-line bg-panel shadow-premium sm:max-h-[calc(100dvh-2rem)]">
        <div className="flex items-center justify-between gap-4 border-b border-line p-5">
          <h2 className="text-lg font-semibold text-white">{habit ? "Edit Habit" : "New Habit"}</h2>
          <button type="button" className="dl-button grid h-9 w-9 place-items-center rounded-lg border border-line bg-white/[0.03] text-slate-300" onClick={onClose}>
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-4 overflow-y-auto p-5">
          <label className="grid gap-2 text-sm text-slate-300">
            Habit name
            <input className="rounded-lg border border-line bg-ink/70 px-3 py-2 text-white outline-none transition focus:border-cyan/60" value={name} onChange={(event) => setName(event.currentTarget.value)} />
          </label>
          <label className="grid gap-2 text-sm text-slate-300">
            Description
            <textarea className="min-h-24 rounded-lg border border-line bg-ink/70 px-3 py-2 text-white outline-none transition focus:border-cyan/60" value={description} onChange={(event) => setDescription(event.currentTarget.value)} />
          </label>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="grid gap-2 text-sm text-slate-300">
              Category
              <input className="rounded-lg border border-line bg-ink/70 px-3 py-2 text-white outline-none transition focus:border-cyan/60" value={category} onChange={(event) => setCategory(event.currentTarget.value)} />
            </label>
            <label className="grid gap-2 text-sm text-slate-300">
              Base XP
              <input type="number" min={0} className="rounded-lg border border-line bg-ink/70 px-3 py-2 text-white outline-none transition focus:border-cyan/60" value={baseXp} onChange={(event) => setBaseXp(Number(event.currentTarget.value))} />
            </label>
            <label className="grid gap-2 text-sm text-slate-300">
              Order
              <input type="number" min={1} className="rounded-lg border border-line bg-ink/70 px-3 py-2 text-white outline-none transition focus:border-cyan/60" value={order} onChange={(event) => setOrder(Number(event.currentTarget.value))} />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm text-slate-300">
              Reminder time
              <input type="time" className="rounded-lg border border-line bg-ink/70 px-3 py-2 text-white outline-none transition focus:border-cyan/60" value={reminderTime} onChange={(event) => setReminderTime(event.currentTarget.value)} />
            </label>
            <label className="grid gap-2 text-sm text-slate-300">
              Session timer minutes
              <input type="number" min={0} className="rounded-lg border border-line bg-ink/70 px-3 py-2 text-white outline-none transition focus:border-cyan/60" value={sessionMinutes} onChange={(event) => setSessionMinutes(Number(event.currentTarget.value))} />
            </label>
          </div>
          <label className="grid gap-2 text-sm text-slate-300">
            Optional prerequisite habit
            <select className="rounded-lg border border-line bg-ink/70 px-3 py-2 text-white outline-none transition focus:border-cyan/60" value={prerequisiteHabitId} onChange={(event) => setPrerequisiteHabitId(event.currentTarget.value)}>
              <option value="">None</option>
              {habits.filter((item) => item.id !== habit?.id).map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </label>
          <div className="grid gap-2 text-sm text-slate-300">
            Active days
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
              {weekdays.map((day) => (
                <button
                  key={day.value}
                  type="button"
                  className={`dl-button rounded-lg border px-3 py-2 text-sm font-medium ${activeDays.includes(day.value) ? "border-cyan/60 bg-cyan/10 text-cyan" : "border-line bg-white/[0.03] text-slate-400 hover:border-cyan/40"}`}
                  onClick={() => toggleDay(day.value)}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input type="checkbox" checked={unlocked} onChange={(event) => setUnlocked(event.currentTarget.checked)} />
              Is unlocked now?
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input type="checkbox" checked={streakMultiplierEnabled} onChange={(event) => setStreakMultiplierEnabled(event.currentTarget.checked)} />
              Streak multiplier enabled
            </label>
          </div>
        </div>

        <div className="flex shrink-0 justify-end gap-2 border-t border-line bg-panel/95 p-5">
          <button type="button" className="dl-button rounded-lg border border-line bg-white/[0.03] px-4 py-2 text-sm text-slate-300" onClick={onClose}>Cancel</button>
          <button type="button" className="dl-button rounded-lg bg-gradient-to-r from-cyan to-mint px-4 py-2 text-sm font-semibold text-slate-950 shadow-glow hover:brightness-110" onClick={submit}>Save Habit</button>
        </div>
      </section>
    </div>
  );
}
