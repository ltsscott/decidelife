import Link from "next/link";
import type { JournalEntry } from "@/types";

export function JournalEntryCard({ entry }: { entry: JournalEntry }) {
  return (
    <Link href={`/journal/${entry.id}`} className="group block rounded-xl border border-line bg-panel-glass p-4 shadow-panel backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 hover:border-cyan/35">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-cyan">{entry.date}</p>
          <h3 className="mt-1 font-semibold text-white transition group-hover:text-cyan">{entry.title}</h3>
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-400">{entry.body}</p>
        </div>
        <span className="rounded-full border border-violet/35 bg-violet/10 px-2.5 py-1 text-xs capitalize text-violet-200">{entry.mood}</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {entry.tags.map((tag) => (
          <span key={tag} className="rounded-full border border-line bg-white/[0.04] px-2.5 py-1 text-xs text-slate-400">
            {tag}
          </span>
        ))}
      </div>
    </Link>
  );
}
