"use client";

import { useMemo, useState } from "react";
import { BarChart3, BookOpen, CalendarDays, ChevronLeft, ChevronRight, Plus, Save, Trash2 } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { createId } from "@/lib/ids";
import { useDecideLife } from "@/lib/local-store";
import type { TradingAccountType, TradingJournalEntry, TradingNote } from "@/types";

const accountOptions: { value: TradingAccountType; label: string }[] = [
  { value: "phase-1", label: "Phase 1 (eval)" },
  { value: "phase-2", label: "Phase 2 (eval)" },
  { value: "instant-funded", label: "Instant (funded account)" },
  { value: "funded", label: "Funded" },
  { value: "live", label: "Live" }
];

const negativeTags = ["Revenge Trade", "Overtrading", "FOMO", "Entered Early", "Chased Price", "Closed Too Early", "Moved Stop Loss", "Ignored Plan", "Emotional Exit"];
const positiveTags = ["Perfect Patience", "Perfect Execution", "A+ Setup", "Excellent Risk Management", "Followed Plan", "Great Discipline"];

const detailSections = [
  { key: "preMarket", label: "Pre-Market", prompt: "Mental/physical state, sleep, focus, watched setups, and what overtrading would look like today." },
  { key: "tradePlanning", label: "Trade Planning", prompt: "Exact setup, edge, entry, stop loss, take profit, risk, A+ or forced, invalidation." },
  { key: "duringTrade", label: "During Trade", prompt: "Plan discipline, stop loss movement, chasing, fear, greed, impatience, exit acceptance." },
  { key: "afterTrade", label: "After Trade", prompt: "Win/loss, rules followed, what went right, what went wrong, revenge trading." },
  { key: "endOfDay", label: "End of Day", prompt: "Execution quality, A+ setups, risk respected, behavior patterns, mistake, best decision." },
  { key: "improvementFocus", label: "Improvement Focus", prompt: "What to improve, what to repeat, and one rule you refuse to break tomorrow." }
] as const;

function today() {
  return new Date().toISOString().slice(0, 10);
}

function monthKey(date: Date) {
  return date.toISOString().slice(0, 7);
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function createBlankEntry(date: string, accountType: TradingAccountType): TradingJournalEntry {
  return {
    id: createId("trade-journal", date),
    date,
    accountType,
    profitLoss: 0,
    tradeCount: 0,
    executionScore: 5,
    aPlusSetups: 0,
    session: "London",
    pairs: "",
    screenshots: [],
    generalNotes: "",
    followedRules: true,
    overtraded: false,
    movedStopLoss: false,
    emotionsAffected: false,
    biggestMistake: "",
    bestDecision: "",
    improveTomorrow: "",
    detailedReview: {
      preMarket: "",
      tradePlanning: "",
      duringTrade: "",
      afterTrade: "",
      endOfDay: "",
      improvementFocus: ""
    },
    mistakeTags: [],
    positiveTags: [],
    brokenRuleIds: [],
    averageRr: 0,
    wins: 0,
    losses: 0,
    updatedAt: new Date().toISOString()
  };
}

function getCalendarDays(month: Date) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());
  return Array.from({ length: 42 }, (_, index) => {
    const next = new Date(start);
    next.setDate(start.getDate() + index);
    return next;
  });
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

function mostCommon(values: string[]) {
  if (!values.length) return "None yet";
  const counts = new Map<string, number>();
  values.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
  return Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0][0];
}

export default function TradingPage() {
  const {
    profile,
    tradingJournalEntries,
    tradingNotes,
    tradingRules,
    setTradingAccountType,
    saveTradingJournalEntry,
    saveTradingNote,
    deleteTradingNote,
    saveTradingRule
  } = useDecideLife();
  const [month, setMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(today());
  const [noteBody, setNoteBody] = useState("");
  const [ruleText, setRuleText] = useState("");

  const entry = tradingJournalEntries.find((item) => item.date === selectedDate) ?? createBlankEntry(selectedDate, profile.tradingAccountType);
  const monthEntries = tradingJournalEntries.filter((item) => item.date.startsWith(monthKey(month)));
  const calendarDays = getCalendarDays(month);
  const totalTrades = sum(monthEntries.map((item) => item.tradeCount));
  const wins = sum(monthEntries.map((item) => item.wins));
  const losses = sum(monthEntries.map((item) => item.losses));
  const totalPl = sum(monthEntries.map((item) => item.profitLoss));
  const winRate = wins + losses ? Math.round((wins / (wins + losses)) * 100) : 0;
  const averageScore = monthEntries.length ? Math.round(sum(monthEntries.map((item) => item.executionScore)) / monthEntries.length) : 0;
  const averageRr = monthEntries.length ? (sum(monthEntries.map((item) => item.averageRr)) / monthEntries.length).toFixed(2) : "0.00";
  const largestWin = Math.max(0, ...monthEntries.map((item) => item.profitLoss));
  const largestLoss = Math.min(0, ...monthEntries.map((item) => item.profitLoss));
  const activeRules = tradingRules.filter((rule) => !rule.archived);

  const discipline = useMemo(() => {
    return activeRules.map((rule) => {
      let streak = 0;
      [...tradingJournalEntries].sort((a, b) => b.date.localeCompare(a.date)).some((journal) => {
        if (journal.brokenRuleIds.includes(rule.id)) return true;
        streak += 1;
        return false;
      });
      return { rule, streak };
    });
  }, [activeRules, tradingJournalEntries]);

  const updateEntry = (partial: Partial<TradingJournalEntry>) => {
    const next = { ...entry, ...partial, updatedAt: new Date().toISOString() };
    saveTradingJournalEntry(next);
    if (partial.accountType) setTradingAccountType(partial.accountType);
  };

  const toggleListValue = (list: string[], value: string) => (
    list.includes(value) ? list.filter((item) => item !== value) : [...list, value]
  );

  const uploadScreenshots = async (files: FileList | null) => {
    if (!files?.length) return;
    const images = await Promise.all(Array.from(files).map((file) => new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.readAsDataURL(file);
    })));
    updateEntry({ screenshots: [...entry.screenshots, ...images] });
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl">
        <header className="mb-7">
          <p className="text-sm font-medium text-cyan">Trading</p>
          <h1 className="mt-2 text-4xl font-semibold text-white">Trading workspace.</h1>
          <p className="mt-3 text-sm text-slate-400">Calendar, journal, analytics, notes, and discipline tracking in one place.</p>
        </header>

        <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <article className="dl-card p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <CalendarDays className="h-5 w-5 text-cyan" />
                <h2 className="font-semibold text-white">Monthly Trading Calendar</h2>
              </div>
              <div className="flex items-center gap-2">
                <button className="dl-button rounded-lg border border-line p-2 text-slate-300" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><ChevronLeft className="h-4 w-4" /></button>
                <p className="min-w-36 text-center text-sm font-semibold text-white">{month.toLocaleString("default", { month: "long", year: "numeric" })}</p>
                <button className="dl-button rounded-lg border border-line p-2 text-slate-300" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><ChevronRight className="h-4 w-4" /></button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-2 text-center text-xs text-slate-500">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <p key={day}>{day}</p>)}
            </div>
            <div className="mt-2 grid grid-cols-7 gap-2">
              {calendarDays.map((day) => {
                const key = dateKey(day);
                const dayEntry = tradingJournalEntries.find((item) => item.date === key);
                const active = key === selectedDate;
                const inMonth = day.getMonth() === month.getMonth();
                return (
                  <button
                    key={key}
                    type="button"
                    className={`min-h-24 rounded-xl border p-2 text-left transition ${active ? "border-cyan/70 bg-cyan/10" : "border-line bg-white/[0.025] hover:border-cyan/40"} ${inMonth ? "text-slate-200" : "text-slate-600"}`}
                    onClick={() => setSelectedDate(key)}
                  >
                    <span className="text-xs">{day.getDate()}</span>
                    {dayEntry ? (
                      <div className="mt-2 text-xs">
                        <p className={dayEntry.profitLoss >= 0 ? "font-semibold text-mint" : "font-semibold text-coral"}>{dayEntry.profitLoss >= 0 ? "+" : ""}${dayEntry.profitLoss}</p>
                        <p className="mt-1 text-slate-400">Trades: {dayEntry.tradeCount}</p>
                      </div>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </article>

          <article className="dl-card p-5">
            <div className="mb-4 flex items-center gap-3">
              <BookOpen className="h-5 w-5 text-cyan" />
              <div>
                <h2 className="font-semibold text-white">Daily Trading Journal</h2>
                <p className="text-xs text-slate-500">{selectedDate}</p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-2 text-sm text-slate-300">Account
                <select className="rounded-lg border border-line bg-ink/70 px-3 py-2 text-white" value={entry.accountType} onChange={(event) => updateEntry({ accountType: event.currentTarget.value as TradingAccountType })}>
                  {accountOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
              <label className="grid gap-2 text-sm text-slate-300">Execution score
                <input type="number" min={1} max={10} className="rounded-lg border border-line bg-ink/70 px-3 py-2 text-white" value={entry.executionScore} onChange={(event) => updateEntry({ executionScore: Number(event.currentTarget.value) })} />
              </label>
              <label className="grid gap-2 text-sm text-slate-300">Profit/Loss
                <input type="number" className="rounded-lg border border-line bg-ink/70 px-3 py-2 text-white" value={entry.profitLoss} onChange={(event) => updateEntry({ profitLoss: Number(event.currentTarget.value) })} />
              </label>
              <label className="grid gap-2 text-sm text-slate-300">Number of trades
                <input type="number" min={0} className="rounded-lg border border-line bg-ink/70 px-3 py-2 text-white" value={entry.tradeCount} onChange={(event) => updateEntry({ tradeCount: Number(event.currentTarget.value) })} />
              </label>
              <label className="grid gap-2 text-sm text-slate-300">A+ setups taken
                <input type="number" min={0} className="rounded-lg border border-line bg-ink/70 px-3 py-2 text-white" value={entry.aPlusSetups} onChange={(event) => updateEntry({ aPlusSetups: Number(event.currentTarget.value) })} />
              </label>
              <label className="grid gap-2 text-sm text-slate-300">Session traded
                <input className="rounded-lg border border-line bg-ink/70 px-3 py-2 text-white" value={entry.session} onChange={(event) => updateEntry({ session: event.currentTarget.value })} />
              </label>
              <label className="grid gap-2 text-sm text-slate-300 sm:col-span-2">Pair(s)
                <input className="rounded-lg border border-line bg-ink/70 px-3 py-2 text-white" value={entry.pairs} onChange={(event) => updateEntry({ pairs: event.currentTarget.value })} />
              </label>
              <label className="grid gap-2 text-sm text-slate-300 sm:col-span-2">Screenshot(s)
                <input type="file" multiple accept="image/*" className="rounded-lg border border-line bg-ink/70 px-3 py-2 text-slate-300" onChange={(event) => void uploadScreenshots(event.currentTarget.files)} />
              </label>
            </div>
            {entry.screenshots.length ? (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {entry.screenshots.map((src, index) => <img key={`${src}-${index}`} src={src} alt="Trading screenshot" className="h-24 w-full rounded-lg border border-line object-cover" />)}
              </div>
            ) : null}

            <div className="mt-5 grid gap-3">
              <h3 className="text-sm font-semibold uppercase text-cyan">Trading Psychology</h3>
              {[
                ["followedRules", "Did I follow my rules?"],
                ["overtraded", "Did I overtrade?"],
                ["movedStopLoss", "Did I move my stop loss?"],
                ["emotionsAffected", "Did emotions affect my decisions?"]
              ].map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 text-sm text-slate-300">
                  <input type="checkbox" checked={Boolean(entry[key as keyof TradingJournalEntry])} onChange={(event) => updateEntry({ [key]: event.currentTarget.checked } as Partial<TradingJournalEntry>)} />
                  {label}
                </label>
              ))}
              <textarea className="min-h-24 rounded-lg border border-line bg-ink/70 px-3 py-2 text-white" placeholder="Biggest mistake today" value={entry.biggestMistake} onChange={(event) => updateEntry({ biggestMistake: event.currentTarget.value })} />
              <textarea className="min-h-24 rounded-lg border border-line bg-ink/70 px-3 py-2 text-white" placeholder="Best decision today" value={entry.bestDecision} onChange={(event) => updateEntry({ bestDecision: event.currentTarget.value })} />
              <textarea className="min-h-24 rounded-lg border border-line bg-ink/70 px-3 py-2 text-white" placeholder="One thing to improve tomorrow" value={entry.improveTomorrow} onChange={(event) => updateEntry({ improveTomorrow: event.currentTarget.value })} />
              <textarea className="min-h-28 rounded-lg border border-line bg-ink/70 px-3 py-2 text-white" placeholder="General notes" value={entry.generalNotes} onChange={(event) => updateEntry({ generalNotes: event.currentTarget.value })} />
            </div>

            <div className="mt-5 grid gap-2">
              <h3 className="text-sm font-semibold uppercase text-cyan">Detailed Review</h3>
              {detailSections.map((section) => (
                <details key={section.key} className="rounded-lg border border-line bg-white/[0.025] p-3">
                  <summary className="cursor-pointer text-sm font-medium text-white">{section.label}</summary>
                  <p className="mt-2 text-xs text-slate-500">{section.prompt}</p>
                  <textarea
                    className="mt-3 min-h-24 w-full rounded-lg border border-line bg-ink/70 px-3 py-2 text-white"
                    value={entry.detailedReview[section.key]}
                    onChange={(event) => updateEntry({ detailedReview: { ...entry.detailedReview, [section.key]: event.currentTarget.value } })}
                  />
                </details>
              ))}
            </div>

            <div className="mt-5 grid gap-3">
              <h3 className="text-sm font-semibold uppercase text-cyan">Mistake Tags</h3>
              <div className="flex flex-wrap gap-2">
                {negativeTags.map((tag) => (
                  <button key={tag} type="button" className={`rounded-full border px-3 py-1 text-xs ${entry.mistakeTags.includes(tag) ? "border-coral bg-coral/10 text-coral" : "border-line text-slate-400"}`} onClick={() => updateEntry({ mistakeTags: toggleListValue(entry.mistakeTags, tag) })}>{tag}</button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {positiveTags.map((tag) => (
                  <button key={tag} type="button" className={`rounded-full border px-3 py-1 text-xs ${entry.positiveTags.includes(tag) ? "border-cyan/60 bg-cyan/10 text-cyan" : "border-line text-slate-400"}`} onClick={() => updateEntry({ positiveTags: toggleListValue(entry.positiveTags, tag) })}>{tag}</button>
                ))}
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              <h3 className="text-sm font-semibold uppercase text-cyan">Rules Broken Today</h3>
              {activeRules.map((rule) => (
                <label key={rule.id} className="flex items-center gap-2 text-sm text-slate-300">
                  <input type="checkbox" checked={entry.brokenRuleIds.includes(rule.id)} onChange={() => updateEntry({ brokenRuleIds: toggleListValue(entry.brokenRuleIds, rule.id) })} />
                  {rule.text}
                </label>
              ))}
              <div className="grid gap-3 sm:grid-cols-3">
                <input type="number" className="rounded-lg border border-line bg-ink/70 px-3 py-2 text-white" placeholder="Average RR" value={entry.averageRr} onChange={(event) => updateEntry({ averageRr: Number(event.currentTarget.value) })} />
                <input type="number" className="rounded-lg border border-line bg-ink/70 px-3 py-2 text-white" placeholder="Wins" value={entry.wins} onChange={(event) => updateEntry({ wins: Number(event.currentTarget.value) })} />
                <input type="number" className="rounded-lg border border-line bg-ink/70 px-3 py-2 text-white" placeholder="Losses" value={entry.losses} onChange={(event) => updateEntry({ losses: Number(event.currentTarget.value) })} />
              </div>
              <div className="inline-flex items-center gap-2 text-sm text-slate-400"><Save className="h-4 w-4 text-cyan" />Auto-saved locally and synced to Supabase when signed in.</div>
            </div>
          </article>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_0.8fr]">
          <article className="dl-card p-5">
            <div className="mb-4 flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-cyan" />
              <h2 className="font-semibold text-white">Trading Analytics</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["Total P/L", `$${totalPl}`],
                ["Win Rate", `${winRate}%`],
                ["Wins", wins],
                ["Losses", losses],
                ["Total Trades", totalTrades],
                ["Average RR", averageRr],
                ["Largest Win", `$${largestWin}`],
                ["Largest Loss", `$${largestLoss}`],
                ["Average Execution", averageScore],
                ["Most Common Mistake", mostCommon(monthEntries.flatMap((item) => item.mistakeTags))],
                ["Most Positive Habit", mostCommon(monthEntries.flatMap((item) => item.positiveTags))],
                ["Most Broken Rule", mostCommon(monthEntries.flatMap((item) => item.brokenRuleIds).map((id) => tradingRules.find((rule) => rule.id === id)?.text ?? id))]
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-line bg-white/[0.03] p-4">
                  <p className="text-xs uppercase text-slate-500">{label}</p>
                  <p className="mt-2 text-xl font-semibold text-white">{value}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 grid gap-3">
              <h3 className="text-sm font-semibold uppercase text-cyan">Daily P/L</h3>
              <div className="flex h-32 items-end gap-2 rounded-xl border border-line bg-ink/50 p-3">
                {monthEntries.slice().reverse().map((item) => (
                  <div key={item.id} className="flex flex-1 flex-col items-center gap-1">
                    <div className={item.profitLoss >= 0 ? "w-full rounded-t bg-mint" : "w-full rounded-t bg-coral"} style={{ height: `${Math.min(100, Math.max(8, Math.abs(item.profitLoss) / 10))}%` }} />
                    <span className="text-[10px] text-slate-500">{item.date.slice(8)}</span>
                  </div>
                ))}
              </div>
              <h3 className="text-sm font-semibold uppercase text-cyan">Current Discipline</h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {discipline.map(({ rule, streak }) => (
                  <div key={rule.id} className="rounded-lg border border-line bg-white/[0.025] p-3 text-sm text-slate-300">
                    <span className="font-semibold text-white">{streak}</span> consecutive days respecting: {rule.text}
                  </div>
                ))}
              </div>
            </div>
          </article>

          <div className="grid gap-6">
            <article className="dl-card p-5">
              <h2 className="font-semibold text-white">Trading Notes</h2>
              <div className="mt-4 grid gap-3">
                <textarea className="min-h-24 rounded-lg border border-line bg-ink/70 px-3 py-2 text-white" placeholder="New trading note..." value={noteBody} onChange={(event) => setNoteBody(event.currentTarget.value)} />
                <button className="dl-button inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan to-mint px-4 py-2 text-sm font-semibold text-slate-950" onClick={() => {
                  if (!noteBody.trim()) return;
                  const note: TradingNote = { id: createId("trading-note", noteBody), date: selectedDate, body: noteBody.trim(), createdAt: new Date().toISOString() };
                  saveTradingNote(note);
                  setNoteBody("");
                }}><Plus className="h-4 w-4" />Add Note</button>
                {tradingNotes.map((note) => (
                  <div key={note.id} className="rounded-lg border border-line bg-white/[0.025] p-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="text-xs text-cyan">{note.date}</p>
                      <button className="text-slate-500 hover:text-coral" onClick={() => deleteTradingNote(note.id)}><Trash2 className="h-4 w-4" /></button>
                    </div>
                    <p className="text-sm text-slate-300">{note.body}</p>
                  </div>
                ))}
              </div>
            </article>

            <article className="dl-card p-5">
              <h2 className="font-semibold text-white">Rule Tracking</h2>
              <div className="mt-4 flex gap-2">
                <input className="min-w-0 flex-1 rounded-lg border border-line bg-ink/70 px-3 py-2 text-white" placeholder="Create a permanent trading rule" value={ruleText} onChange={(event) => setRuleText(event.currentTarget.value)} />
                <button className="dl-button rounded-lg border border-cyan/40 bg-cyan/10 px-3 text-sm font-semibold text-cyan" onClick={() => {
                  if (!ruleText.trim()) return;
                  saveTradingRule({ id: createId("rule", ruleText), text: ruleText.trim(), archived: false, createdAt: new Date().toISOString() });
                  setRuleText("");
                }}>Add</button>
              </div>
              <div className="mt-4 grid gap-2">
                {tradingRules.map((rule) => (
                  <div key={rule.id} className="flex items-center justify-between gap-3 rounded-lg border border-line bg-white/[0.025] p-3 text-sm text-slate-300">
                    <span className={rule.archived ? "line-through opacity-50" : ""}>{rule.text}</span>
                    <button className="text-xs text-slate-500 hover:text-coral" onClick={() => saveTradingRule({ ...rule, archived: !rule.archived })}>{rule.archived ? "Restore" : "Archive"}</button>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
