"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Trash2, X } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useDecideLife } from "@/lib/local-store";
import type { JournalEntry, MoodState } from "@/types";

const moods: MoodState[] = ["focused", "steady", "tired", "stressed", "proud", "resetting"];

export default function JournalEntryPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { journalEntries, saveJournalEntry, deleteJournalEntry } = useDecideLife();
  const existing = journalEntries.find((entry) => entry.id === params.id);
  const isNew = params.id === "new";
  const starter = useMemo<JournalEntry>(() => {
    const now = new Date().toISOString();
    return (
      existing ?? {
        id: isNew ? `journal-${Date.now()}` : params.id,
        date: now.slice(0, 10),
        title: "",
        mood: "steady",
        tags: [],
        body: "",
        updatedAt: now
      }
    );
  }, [existing, isNew, params.id]);

  const [entry, setEntry] = useState<JournalEntry>(starter);
  const [tagText, setTagText] = useState(entry.tags.join(", "));
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const save = () => {
    saveJournalEntry({
      ...entry,
      tags: tagText.split(",").map((tag) => tag.trim()).filter(Boolean),
      updatedAt: new Date().toISOString()
    });
    router.push("/journal");
  };

  const deleteEntry = () => {
    deleteJournalEntry(entry.id);
    router.push("/journal");
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl">
        <header className="mb-7">
          <p className="text-sm font-medium text-cyan">Journal</p>
          <h1 className="mt-2 text-4xl font-semibold text-white">{isNew ? "New entry" : "Edit entry"}</h1>
          <p className="mt-3 text-sm text-slate-400">A clean writing surface for signal over noise.</p>
        </header>

        <section className="dl-card grid gap-4 p-5">
          <div className="grid gap-4 sm:grid-cols-[1fr_12rem]">
            <label className="grid gap-2 text-sm text-slate-300">
              Title
              <input
                className="rounded-lg border border-line bg-ink/70 px-3 py-2 text-white outline-none transition focus:border-cyan/60"
                value={entry.title}
                onChange={(event) => setEntry({ ...entry, title: event.currentTarget.value })}
              />
            </label>
            <label className="grid gap-2 text-sm text-slate-300">
              Date
              <input
                type="date"
                className="rounded-lg border border-line bg-ink/70 px-3 py-2 text-white outline-none transition focus:border-cyan/60"
                value={entry.date}
                onChange={(event) => setEntry({ ...entry, date: event.currentTarget.value })}
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-[12rem_1fr]">
            <label className="grid gap-2 text-sm text-slate-300">
              Mood
              <select
                className="rounded-lg border border-line bg-ink/70 px-3 py-2 text-white outline-none transition focus:border-cyan/60"
                value={entry.mood}
                onChange={(event) => setEntry({ ...entry, mood: event.currentTarget.value as MoodState })}
              >
                {moods.map((mood) => (
                  <option key={mood} value={mood}>
                    {mood}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm text-slate-300">
              Tags
              <input
                className="rounded-lg border border-line bg-ink/70 px-3 py-2 text-white outline-none transition focus:border-cyan/60"
                value={tagText}
                onChange={(event) => setTagText(event.currentTarget.value)}
                placeholder="systems, training, career"
              />
            </label>
          </div>

          <label className="grid gap-2 text-sm text-slate-300">
            Body
            <textarea
              className="min-h-80 resize-y rounded-xl border border-line bg-ink/70 px-4 py-3 leading-relaxed text-white outline-none transition focus:border-cyan/60"
              value={entry.body}
              onChange={(event) => setEntry({ ...entry, body: event.currentTarget.value })}
            />
          </label>

          <div className="flex flex-col justify-between gap-3 sm:flex-row">
            {!isNew ? (
              <button
                type="button"
                className="dl-button inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-coral/40 bg-coral/10 px-4 text-sm font-medium text-coral hover:bg-coral/15"
                onClick={() => setConfirmDeleteOpen(true)}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            ) : <span />}
            <button
              type="button"
              className="dl-button inline-flex h-10 items-center gap-2 rounded-lg bg-gradient-to-r from-cyan to-mint px-4 text-sm font-semibold text-slate-950 shadow-glow hover:brightness-110"
              onClick={save}
            >
              <Save className="h-4 w-4" />
              Save
            </button>
          </div>
        </section>

        {confirmDeleteOpen ? (
          <div className="fixed inset-0 z-50 grid place-items-center bg-ink/82 p-4 backdrop-blur-xl">
            <section className="w-full max-w-md rounded-xl border border-coral/40 bg-panel p-5 shadow-premium">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-white">Delete journal entry?</h2>
                  <p className="mt-2 text-sm text-slate-400">This removes only this entry from local storage. Other DecideLife data stays unchanged.</p>
                </div>
                <button type="button" className="dl-button grid h-9 w-9 place-items-center rounded-lg border border-line text-slate-300" onClick={() => setConfirmDeleteOpen(false)}>
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" className="dl-button rounded-lg border border-line bg-white/[0.03] px-4 py-2 text-sm text-slate-300" onClick={() => setConfirmDeleteOpen(false)}>
                  Cancel
                </button>
                <button type="button" className="dl-button rounded-lg bg-coral px-4 py-2 text-sm font-medium text-white hover:bg-rose-400" onClick={deleteEntry}>
                  Delete Entry
                </button>
              </div>
            </section>
          </div>
        ) : null}
      </div>
    </DashboardLayout>
  );
}
