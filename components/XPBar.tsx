import { Sparkles, TrendingUp } from "lucide-react";
import { clsx } from "clsx";
import { getLevelTier } from "@/lib/progression";

interface XPBarProps {
  percentage: number;
  xpIntoLevel: number;
  xpToNextLevel: number;
  level?: number;
  totalXp?: number;
}

const fillStyles = [
  "from-cyan via-mint to-cyan",
  "from-cyan via-mint to-violet",
  "from-gold via-yellow-300 to-gold",
  "from-cyan via-gold to-cyan",
  "from-violet via-gold to-fuchsia-300",
  "from-gold via-violet to-gold",
  "from-gold via-yellow-200 to-orange-300",
  "from-cyan via-blue-400 to-gold"
];

export function XPBar({ percentage, xpIntoLevel, xpToNextLevel, level = 1, totalXp }: XPBarProps) {
  const tier = getLevelTier(level);

  return (
    <div className={clsx("group relative overflow-hidden rounded-xl border bg-panel-glass p-4 shadow-panel backdrop-blur-xl transition duration-300 hover:-translate-y-0.5", tier >= 2 ? "border-gold/45" : "border-line", tier >= 5 && "shadow-premium")}>
      <div className={clsx("absolute -right-16 -top-20 h-44 w-44 rounded-full blur-3xl", tier >= 7 ? "bg-cyan/20" : tier >= 4 ? "bg-violet/18" : "bg-cyan/10")} />
      {tier >= 5 ? <Sparkles className="pointer-events-none absolute right-12 top-8 h-4 w-4 animate-pulse text-gold" /> : null}
      <div className="relative mb-4 flex items-start justify-between gap-3">
        <p className={clsx("text-xs font-semibold uppercase", tier >= 2 ? "text-gold" : "text-slate-400")}>Total XP</p>
        <div className="grid h-8 w-8 place-items-center rounded-lg border border-line bg-white/[0.04] text-cyan">
          <TrendingUp className="h-4 w-4" />
        </div>
      </div>
      <div className="relative">
        <p className="text-2xl font-semibold text-white sm:text-3xl">{(totalXp ?? xpIntoLevel).toLocaleString()}</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
          <div className={clsx("relative h-3 overflow-hidden rounded-full border bg-slate-950/80 shadow-inner", tier >= 4 ? "border-gold/25" : "border-white/5")}>
            <div
              className={clsx("relative h-full rounded-full bg-gradient-to-r transition-[width] duration-700 ease-out", fillStyles[tier], tier >= 3 && "shadow-[0_0_22px_rgba(248,193,74,0.35)]")}
              style={{ width: `${percentage}%` }}
            >
              <div className={clsx("absolute inset-y-0 w-1/2 animate-sheen bg-gradient-to-r from-transparent to-transparent", tier >= 4 ? "via-gold/55" : "via-white/35")} />
            </div>
          </div>
          <p className={clsx("text-xs", tier >= 2 ? "text-gold" : "text-cyan")}>
            {xpIntoLevel.toLocaleString()} / {(xpIntoLevel + xpToNextLevel).toLocaleString()} XP
          </p>
        </div>
        <p className="mt-2 text-sm text-slate-400">Lifetime progress</p>
      </div>
    </div>
  );
}
