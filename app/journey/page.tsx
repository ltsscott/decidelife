"use client";

import { useMemo, useState } from "react";
import { Camera, Plus, Trash2 } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { createId } from "@/lib/ids";
import { useDecideLife } from "@/lib/local-store";
import type { JourneyMilestone, JourneyMilestoneType } from "@/types";

const types: JourneyMilestoneType[] = ["manual", "habit", "mission", "trading", "level"];

export default function JourneyPage() {
  const {
    habits,
    missions,
    levelProgress,
    tradingJournalEntries,
    journeyMilestones,
    saveJourneyMilestone,
    deleteJourneyMilestone
  } = useDecideLife();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [type, setType] = useState<JourneyMilestoneType>("manual");
  const [notes, setNotes] = useState("");
  const [photo, setPhoto] = useState("");
  const [filter, setFilter] = useState<JourneyMilestoneType | "all">("all");

  const autoMilestones = useMemo<JourneyMilestone[]>(() => {
    const today = new Date().toISOString().slice(0, 10);
    return [
      ...missions.filter((mission) => mission.completed).map((mission) => ({
        id: `auto-mission-${mission.id}`,
        date: today,
        title: `Mission Completed: ${mission.title}`,
        type: "mission" as const,
        notes: mission.description,
        createdAt: today
      })),
      ...habits.filter((habit) => habit.bestStreak >= 100).map((habit) => ({
        id: `auto-habit-${habit.id}-100`,
        date: today,
        title: `100 Day ${habit.name} Streak`,
        type: "habit" as const,
        notes: `${habit.name} reached ${habit.bestStreak} best streak days.`,
        createdAt: today
      })),
      ...(levelProgress.level >= 25 ? [{
        id: "auto-level-25",
        date: today,
        title: "Level 25",
        type: "level" as const,
        notes: "Reached Level 25 in DecideLife.",
        createdAt: today
      }] : []),
      ...tradingJournalEntries.filter((entry) => entry.profitLoss > 0).slice(0, 3).map((entry) => ({
        id: `auto-trading-${entry.id}`,
        date: entry.date,
        title: `Trading Win: +$${entry.profitLoss}`,
        type: "trading" as const,
        notes: entry.bestDecision || entry.generalNotes,
        createdAt: entry.updatedAt
      }))
    ];
  }, [habits, levelProgress.level, missions, tradingJournalEntries]);

  const milestones = [...journeyMilestones, ...autoMilestones]
    .filter((milestone) => filter === "all" || milestone.type === filter)
    .sort((a, b) => b.date.localeCompare(a.date));

  const uploadPhoto = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhoto(String(reader.result));
    reader.readAsDataURL(file);
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl">
        <header className="mb-7">
          <p className="text-sm font-medium text-cyan">Journey</p>
          <h1 className="mt-2 text-4xl font-semibold text-white">Milestones and identity markers.</h1>
          <p className="mt-3 text-sm text-slate-400">A chronological record of the person you are becoming.</p>
        </header>

        <section className="dl-card mb-6 p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <input className="rounded-lg border border-line bg-ink/70 px-3 py-2 text-white" placeholder="Milestone title" value={title} onChange={(event) => setTitle(event.currentTarget.value)} />
            <input type="date" className="rounded-lg border border-line bg-ink/70 px-3 py-2 text-white" value={date} onChange={(event) => setDate(event.currentTarget.value)} />
            <select className="rounded-lg border border-line bg-ink/70 px-3 py-2 text-white" value={type} onChange={(event) => setType(event.currentTarget.value as JourneyMilestoneType)}>
              {types.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <label className="inline-flex items-center gap-2 rounded-lg border border-line bg-white/[0.03] px-3 py-2 text-sm text-slate-300">
              <Camera className="h-4 w-4 text-cyan" />
              Photo
              <input className="hidden" type="file" accept="image/*" onChange={(event) => uploadPhoto(event.currentTarget.files?.[0])} />
            </label>
            <textarea className="min-h-24 rounded-lg border border-line bg-ink/70 px-3 py-2 text-white sm:col-span-2" placeholder="Notes" value={notes} onChange={(event) => setNotes(event.currentTarget.value)} />
          </div>
          <button
            className="dl-button mt-4 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan to-mint px-4 py-2 text-sm font-semibold text-slate-950"
            onClick={() => {
              if (!title.trim()) return;
              saveJourneyMilestone({ id: createId("milestone", title), date, title: title.trim(), type, notes, photo: photo || undefined, createdAt: new Date().toISOString() });
              setTitle("");
              setNotes("");
              setPhoto("");
            }}
          >
            <Plus className="h-4 w-4" />
            Add Milestone
          </button>
        </section>

        <div className="mb-4 flex flex-wrap gap-2">
          {(["all", ...types] as const).map((item) => (
            <button key={item} className={`rounded-full border px-3 py-1 text-xs capitalize ${filter === item ? "border-cyan/60 bg-cyan/10 text-cyan" : "border-line text-slate-400"}`} onClick={() => setFilter(item)}>
              {item}
            </button>
          ))}
        </div>

        <section className="grid gap-4">
          {milestones.map((milestone) => (
            <article key={milestone.id} className="dl-card p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase text-cyan">{milestone.date} - {milestone.type}</p>
                  <h2 className="mt-1 text-xl font-semibold text-white">{milestone.title}</h2>
                  <p className="mt-2 text-sm text-slate-400">{milestone.notes}</p>
                </div>
                {!milestone.id.startsWith("auto-") ? (
                  <button className="text-slate-500 hover:text-coral" onClick={() => deleteJourneyMilestone(milestone.id)}><Trash2 className="h-4 w-4" /></button>
                ) : null}
              </div>
              {milestone.photo ? <img src={milestone.photo} alt="" className="mt-4 max-h-72 rounded-xl border border-line object-cover" /> : null}
            </article>
          ))}
        </section>
      </div>
    </DashboardLayout>
  );
}
