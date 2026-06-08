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

export function HabitFormModal({ habit, habits, onSave, onClose }: HabitFormModalProps) {
  const [name, setName] = useState(habit?.name ?? "");
  const [description, setDescription] = useState(habit?.description ?? "");
  const [category, setCategory] = useState(habit?.category ?? "personal");
  const [baseXp, setBaseXp] = useState(habit?.baseXp ?? 100);
  const [order, setOrder] = useState(habit?.order ?? habits.length + 1);
  const [unlocked, setUnlocked] = useState(habit?.unlocked ?? false);
  const [prerequisiteHabitId, setPrerequisiteHabitId] = useState(habit?.prerequisiteHabitId ?? "");
  const [streakMultiplierEnabled, setStreakMultiplierEnabled] = useState(habit?.streakMultiplierEnabled ?? true);

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
      archived: false
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/82 p-4 backdrop-blur-xl">
      <section className="w-full max-w-2xl rounded-xl border border-line bg-panel p-5 shadow-premium">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-white">{habit ? "Edit Habit" : "New Habit"}</h2>
          <button type="button" className="dl-button grid h-9 w-9 place-items-center rounded-lg border border-line bg-white/[0.03] text-slate-300" onClick={onClose}>
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-4">
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
          <label className="grid gap-2 text-sm text-slate-300">
            Optional prerequisite habit
            <select className="rounded-lg border border-line bg-ink/70 px-3 py-2 text-white outline-none transition focus:border-cyan/60" value={prerequisiteHabitId} onChange={(event) => setPrerequisiteHabitId(event.currentTarget.value)}>
              <option value="">None</option>
              {habits.filter((item) => item.id !== habit?.id).map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </label>
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

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className="dl-button rounded-lg border border-line bg-white/[0.03] px-4 py-2 text-sm text-slate-300" onClick={onClose}>Cancel</button>
          <button type="button" className="dl-button rounded-lg bg-gradient-to-r from-cyan to-mint px-4 py-2 text-sm font-semibold text-slate-950 shadow-glow hover:brightness-110" onClick={submit}>Save Habit</button>
        </div>
      </section>
    </div>
  );
}
