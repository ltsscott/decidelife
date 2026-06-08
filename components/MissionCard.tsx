"use client";

import { CheckCircle2, Lock, Pencil, Sparkles, Trash2 } from "lucide-react";
import { clsx } from "clsx";
import type { Mission } from "@/types";

interface MissionCardProps {
  mission: Mission;
  onComplete?: (missionId: string) => void;
  onEdit?: (mission: Mission) => void;
  onArchive?: (missionId: string) => void;
}

export function MissionCard({ mission, onComplete, onEdit, onArchive }: MissionCardProps) {
  const major = mission.type === "major";

  return (
    <article
      className={clsx(
        "group relative overflow-hidden rounded-xl border bg-panel-glass p-4 shadow-panel backdrop-blur-xl transition duration-300 hover:-translate-y-0.5",
        mission.locked && "border-line opacity-60 grayscale-[0.65]",
        mission.completed && "border-mint/50 shadow-glow",
        !mission.locked && !mission.completed && major && "border-violet/45",
        !mission.locked && !mission.completed && !major && "border-line hover:border-cyan/30"
      )}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-50" />
      {major && !mission.locked ? <div className="absolute -right-16 -top-16 h-36 w-36 rounded-full bg-violet/14 blur-3xl" /> : null}
      {mission.completed ? <div className="absolute -bottom-16 left-8 h-36 w-36 rounded-full bg-mint/12 blur-3xl" /> : null}

      <div className="relative flex items-start justify-between gap-4">
        <div>
          <div className="mb-3 flex flex-wrap gap-2">
            <span className="rounded-full border border-line bg-white/[0.04] px-2 py-1 text-xs capitalize text-slate-300">{mission.category}</span>
            <span className={clsx("rounded-full border px-2 py-1 text-xs", major ? "border-violet/40 bg-violet/10 text-violet-200" : "border-cyan/35 bg-cyan/10 text-cyan")}>
              {major ? "Major" : "Side"}
            </span>
            <span className={clsx("rounded-full border px-2 py-1 text-xs", mission.locked ? "border-slate-600 text-slate-400" : mission.completed ? "border-mint/40 text-mint" : "border-gold/40 text-gold")}>
              {mission.locked ? "Locked" : mission.completed ? "Completed" : "Active"}
            </span>
          </div>
          <h3 className={clsx("font-semibold text-white", mission.locked && "line-through decoration-slate-500/70")}>{mission.title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-slate-400">{mission.description}</p>
        </div>
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-line bg-white/[0.04]">
          {mission.locked ? <Lock className="h-4 w-4 text-slate-500" /> : <Sparkles className="h-4 w-4 text-gold" />}
        </div>
      </div>
      <div className="relative mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium text-cyan">+{mission.xpReward.toLocaleString()} XP</p>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={mission.locked || mission.completed}
            onClick={() => onComplete?.(mission.id)}
            className="dl-button inline-flex h-9 items-center gap-2 rounded-lg border border-line bg-white/[0.03] px-3 text-sm text-slate-200 enabled:hover:border-mint/60 enabled:hover:text-mint disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CheckCircle2 className="h-4 w-4" />
            {mission.completed ? "Done" : "Complete"}
          </button>
          {onEdit ? (
            <button
              type="button"
              className="dl-button grid h-9 w-9 place-items-center rounded-lg border border-line bg-white/[0.03] text-slate-300 hover:border-cyan/60 hover:text-cyan"
              title="Edit mission"
              onClick={() => onEdit(mission)}
            >
              <Pencil className="h-4 w-4" />
            </button>
          ) : null}
          {onArchive ? (
            <button
              type="button"
              className="dl-button grid h-9 w-9 place-items-center rounded-lg border border-line bg-white/[0.03] text-slate-300 hover:border-coral/60 hover:text-coral"
              title="Archive mission"
              onClick={() => onArchive(mission.id)}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
