"use client";

import { Check, Crown, Dumbbell, Flame, Gem, Pencil, Sparkles, Star, Trash2, Trophy, X } from "lucide-react";
import { clsx } from "clsx";
import { getHabitCompletionXp, getStreakTier, getStreakTierLabel } from "@/lib/progression";
import type { Habit, HabitLog } from "@/types";

interface HabitCardProps {
  habit: Habit;
  log?: HabitLog;
  onComplete?: (habitId: string) => void;
  onMiss?: (habitId: string) => void;
  onEdit?: (habit: Habit) => void;
  onArchive?: (habitId: string) => void;
  compact?: boolean;
}

const statusStyles = {
  pending: "border-line bg-white/[0.03] text-slate-300",
  completed: "border-mint/45 bg-mint/10 text-mint",
  missed: "border-coral/45 bg-coral/10 text-coral",
  protected: "border-gold/45 bg-gold/10 text-gold"
};

const tierMeta = [
  { Icon: Dumbbell, badge: "", iconTone: "text-slate-300" },
  { Icon: Star, badge: "border-cyan/60 bg-cyan/10 text-cyan", iconTone: "text-cyan" },
  { Icon: Crown, badge: "border-violet/60 bg-violet/10 text-violet-200", iconTone: "text-violet-200" },
  { Icon: Gem, badge: "border-fuchsia-400/60 bg-fuchsia-400/10 text-fuchsia-200", iconTone: "text-fuchsia-200" },
  { Icon: Crown, badge: "border-gold bg-gold/15 text-gold", iconTone: "text-gold" },
  { Icon: Flame, badge: "border-orange-400 bg-orange-500/15 text-orange-200", iconTone: "text-orange-200" },
  { Icon: Trophy, badge: "border-cyan bg-cyan/15 text-cyan", iconTone: "text-cyan" }
];

const tierShell = [
  "border-line bg-panel-glass",
  "tier-1 border-cyan/70 bg-gradient-to-r from-cyan/8 via-panel-glass to-gold/8 shadow-[0_0_34px_rgba(56,189,248,0.22),0_18px_60px_rgba(0,0,0,0.34)]",
  "tier-2 border-gold/80 bg-gradient-to-r from-gold/10 via-panel-glass to-violet/10 shadow-[0_0_42px_rgba(248,193,74,0.3),0_0_24px_rgba(139,92,246,0.18)]",
  "tier-3 border-fuchsia-300/80 bg-gradient-to-r from-gold/12 via-violet/12 to-panel-glass shadow-[0_0_64px_rgba(217,70,239,0.34),0_0_42px_rgba(248,193,74,0.3)]",
  "tier-4 border-gold bg-gradient-to-r from-gold/20 via-panel-soft/95 to-violet/16 shadow-[0_0_86px_rgba(248,193,74,0.5),0_0_42px_rgba(139,92,246,0.24)]",
  "tier-5 border-orange-300 bg-gradient-to-r from-orange-500/22 via-panel-soft/95 to-gold/18 shadow-[0_0_94px_rgba(251,146,60,0.58),0_0_48px_rgba(248,193,74,0.36)]",
  "tier-6 border-cyan bg-gradient-to-r from-cyan/22 via-panel-soft/95 to-gold/20 shadow-[0_0_110px_rgba(56,189,248,0.56),0_0_58px_rgba(248,193,74,0.42)]"
];

function FramePieces({ tier }: { tier: number }) {
  if (tier === 0) return null;

  return (
    <>
      <span className="ornate-rail top" />
      <span className="ornate-rail bottom" />
      {tier >= 2 ? (
        <>
          <span className="ornate-rail inner-top" />
          <span className="ornate-rail inner-bottom" />
        </>
      ) : null}
      {(["tl", "tr", "bl", "br"] as const).map((corner) => (
        <span key={corner} className={`ornate-corner ${corner}`}>
          <span className="ornate-corner-mark" />
          {tier >= 3 ? (
            <>
              <span className="ornate-corner-flourish" />
              <span className="ornate-corner-flourish second" />
            </>
          ) : null}
        </span>
      ))}
      {tier >= 3 ? (
        <>
          <span className="ornate-side left" />
          <span className="ornate-side right" />
        </>
      ) : null}
      {tier >= 2 ? (
        <div className="ornate-center">
          <span className="ornate-wing" />
          {tier >= 3 ? (
            <span className="ornate-crown-plate">
              {tier >= 4 ? <Crown className="h-5 w-5" /> : <Gem className="h-4 w-4" />}
            </span>
          ) : (
            <span className="ornate-gem" />
          )}
          <span className="ornate-wing right" />
        </div>
      ) : null}
      {tier >= 3 ? (
        <div className="ornate-center bottom">
          <span className="ornate-wing" />
          <span className="ornate-gem" />
          <span className="ornate-wing right" />
        </div>
      ) : null}
      {tier >= 4 ? <div className="ornate-shine" /> : null}
      {tier >= 4 ? (
        <>
          <span className="ornate-spark right-14 top-5" />
          <span className="ornate-spark bottom-7 left-12 [animation-delay:700ms]" />
          <Sparkles className="pointer-events-none absolute right-10 top-6 z-[6] h-4 w-4 animate-pulse text-gold" />
          <Sparkles className="pointer-events-none absolute bottom-5 left-20 z-[6] h-3.5 w-3.5 animate-pulse text-gold/80" />
        </>
      ) : null}
      {tier >= 6 ? (
        <>
          <Star className="pointer-events-none absolute left-1/2 top-6 z-[6] h-4 w-4 -translate-x-1/2 animate-pulse text-cyan" />
          <span className="ornate-spark left-1/3 top-4 bg-cyan [animation-delay:350ms]" />
          <span className="ornate-spark bottom-5 right-1/3 bg-cyan [animation-delay:1100ms]" />
        </>
      ) : null}
    </>
  );
}

export function HabitCard({ habit, log, onComplete, onMiss, onEdit, onArchive, compact = false }: HabitCardProps) {
  // TEMP TESTING FEATURE - remove before final release.
  const visualStreak = habit.testingStreakOverride ?? habit.currentStreak;
  const tier = getStreakTier(visualStreak);
  const tierLabel = getStreakTierLabel(visualStreak);
  const TierIcon = tierMeta[tier].Icon;
  const locked = !habit.unlocked;
  const status = log?.status ?? "pending";
  const isComplete = status === "completed";
  const isMissed = status === "missed";
  const isProtected = status === "protected";

  return (
    <article
      className={clsx(
        "ornate-card group relative rounded-xl border p-4 transition duration-300 hover:-translate-y-0.5",
        locked ? "border-line bg-panel-glass opacity-55 grayscale-[0.85] blur-[0.2px]" : tierShell[tier],
        isComplete && !locked && "ring-1 ring-mint/55",
        isMissed && !locked && "ring-1 ring-coral/50",
        isProtected && !locked && "ring-1 ring-gold/60"
      )}
    >
      <div className="absolute inset-0 -z-10 rounded-xl bg-panel-glass backdrop-blur-xl" />
      {tier >= 2 && !locked ? <div className="absolute -right-20 -top-20 -z-10 h-48 w-48 rounded-full bg-gold/18 blur-3xl" /> : null}
      {tier >= 3 && !locked ? <div className="absolute -bottom-24 left-8 -z-10 h-52 w-52 rounded-full bg-violet/18 blur-3xl" /> : null}
      {tier >= 5 && !locked ? <div className="absolute -left-20 top-1/3 -z-10 h-44 w-44 rounded-full bg-orange-400/16 blur-3xl" /> : null}
      {tier >= 6 && !locked ? <div className="absolute inset-0 -z-10 rounded-xl bg-[radial-gradient(circle_at_18%_18%,rgba(56,189,248,0.2),transparent_16%),radial-gradient(circle_at_84%_70%,rgba(248,193,74,0.22),transparent_18%)]" /> : null}

      {!locked ? <FramePieces tier={tier} /> : null}

      <div className="relative z-[7] flex items-start gap-4">
        {!compact ? (
          <div className={clsx("crest-ring mt-1 hidden h-16 w-16 shrink-0 rounded-full sm:grid", locked ? "opacity-60" : "")}>
            <Dumbbell className={clsx("relative z-10 h-7 w-7", locked ? "text-slate-400" : tierMeta[tier].iconTone)} />
            {tier >= 4 && !locked ? <Crown className="absolute -top-2 h-4 w-4 text-gold" /> : null}
          </div>
        ) : null}

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className={clsx("text-lg font-semibold text-white", locked && "line-through decoration-slate-500/70")}>{habit.name}</h3>
                {!locked && tier >= 1 ? (
                  <span className={clsx("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide shadow-[0_0_18px_rgba(248,193,74,0.18)]", tierMeta[tier].badge)}>
                    <TierIcon className="h-3 w-3" />
                    {tierLabel}
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-sm leading-relaxed text-slate-400">{habit.description}</p>
            </div>
            <span
              className={clsx(
                "shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium capitalize",
                locked ? "border-line bg-white/[0.03] text-slate-400" : statusStyles[status]
              )}
            >
              {locked ? "Locked" : status}
            </span>
          </div>

          {!locked ? (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-slate-400">
                Best {habit.bestStreak} days · Streak {visualStreak}d · Next +
                {getHabitCompletionXp(habit.currentStreak + 1, habit.baseXp, habit.streakMultiplierEnabled)} XP
                {habit.testingStreakOverride !== undefined ? " · Testing override" : ""}
              </p>
              {!compact ? (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={isComplete}
                    className={clsx(
                      "dl-button inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-semibold shadow-glow hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-55",
                      tier >= 4 ? "bg-gradient-to-r from-gold to-orange-300 text-slate-950" : "bg-gradient-to-r from-cyan to-mint text-slate-950"
                    )}
                    onClick={() => onComplete?.(habit.id)}
                  >
                    <Check className="h-4 w-4" />
                    {isComplete ? "Done" : "Complete"}
                  </button>
                  <button
                    type="button"
                    disabled={isMissed}
                    className="dl-button grid h-9 w-9 place-items-center rounded-lg border border-line bg-white/[0.03] text-slate-300 hover:border-coral/60 hover:text-coral disabled:cursor-not-allowed disabled:opacity-45"
                    title="Mark missed"
                    onClick={() => onMiss?.(habit.id)}
                  >
                    <X className="h-4 w-4" />
                  </button>
                  {onEdit ? (
                    <button
                      type="button"
                      className="dl-button grid h-9 w-9 place-items-center rounded-lg border border-line bg-white/[0.03] text-slate-300 hover:border-cyan/60 hover:text-cyan"
                      title="Edit habit"
                      onClick={() => onEdit(habit)}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  ) : null}
                  {onArchive ? (
                    <button
                      type="button"
                      className="dl-button grid h-9 w-9 place-items-center rounded-lg border border-line bg-white/[0.03] text-slate-300 hover:border-coral/60 hover:text-coral"
                      title="Archive habit"
                      onClick={() => onArchive(habit.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="text-xs text-slate-500">Unlocks after the prerequisite is cleared.</p>
              {!compact && onEdit ? (
                <button
                  type="button"
                  className="dl-button inline-flex h-8 items-center gap-2 rounded-lg border border-line bg-white/[0.03] px-2 text-xs text-slate-300 hover:border-cyan/60 hover:text-cyan"
                  onClick={() => onEdit(habit)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </button>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
