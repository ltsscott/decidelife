"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { JournalEntryCard } from "@/components/JournalEntryCard";
import { useDecideLife } from "@/lib/local-store";

export default function JournalPage() {
  const { journalEntries } = useDecideLife();
  const [query, setQuery] = useState("");
  const filteredEntries = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return journalEntries;
    return journalEntries.filter((entry) =>
      entry.title.toLowerCase().includes(term) ||
      entry.body.toLowerCase().includes(term) ||
      entry.date.includes(term) ||
      entry.mood.toLowerCase().includes(term) ||
      entry.tags.some((tag) => tag.toLowerCase().includes(term))
    );
  }, [journalEntries, query]);

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl">
        <header className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium text-cyan">Journal</p>
            <h1 className="mt-2 text-4xl font-semibold text-white">Daily entries with history.</h1>
            <p className="mt-3 text-sm text-slate-400">A quieter space for state, signal, and course correction.</p>
          </div>
          <Link
            href="/journal/new"
            className="dl-button inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-cyan to-mint px-4 text-sm font-semibold text-slate-950 shadow-glow hover:brightness-110"
          >
            <Plus className="h-4 w-4" />
            New
          </Link>
        </header>

        <section className="mb-5 rounded-xl border border-line bg-white/[0.03] p-4">
          <input
            className="w-full rounded-lg border border-line bg-ink/70 px-3 py-2 text-white outline-none transition focus:border-cyan/60"
            placeholder="Search by keyword, date, habit, trading, mission, tag..."
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
          />
          <p className="mt-2 text-xs text-slate-500">{filteredEntries.length} result{filteredEntries.length === 1 ? "" : "s"}</p>
        </section>

        <section className="grid gap-4">
          {filteredEntries.map((entry) => (
            <JournalEntryCard key={entry.id} entry={entry} />
          ))}
        </section>
      </div>
    </DashboardLayout>
  );
}
