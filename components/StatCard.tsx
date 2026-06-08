import { Crown, Gem, Sparkles } from "lucide-react";
import { clsx } from "clsx";
import { getLevelTier } from "@/lib/progression";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  detail?: string;
  icon: LucideIcon;
  level?: number;
}

const tierCardStyles = [
  "border-line hover:border-cyan/30",
  "border-cyan/35 hover:border-cyan/55",
  "border-gold/40 bg-gradient-to-br from-panel-glass to-gold/5",
  "border-cyan/55 bg-gradient-to-br from-panel-glass to-cyan/8 shadow-glow",
  "border-violet/55 bg-gradient-to-br from-panel-glass to-violet/10 shadow-[0_0_28px_rgba(139,92,246,0.18)]",
  "border-gold/60 bg-gradient-to-br from-gold/10 to-violet/12 shadow-premium",
  "border-gold/80 bg-gradient-to-br from-gold/16 to-panel-soft shadow-[0_0_42px_rgba(248,193,74,0.3),0_20px_70px_rgba(0,0,0,0.38)]",
  "border-cyan/80 bg-gradient-to-br from-cyan/16 via-panel-soft to-gold/12 shadow-[0_0_56px_rgba(56,189,248,0.34),0_0_32px_rgba(248,193,74,0.24)]"
];

export function StatCard({ label, value, detail, icon: Icon, level = 1 }: StatCardProps) {
  const tier = getLevelTier(level);

  return (
    <div className={clsx("group relative overflow-hidden rounded-xl border bg-panel-glass p-4 shadow-panel backdrop-blur-xl transition duration-300 hover:-translate-y-0.5", tierCardStyles[tier])}>
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan/50 to-transparent opacity-60" />
      {tier >= 2 ? <div className="absolute -right-12 -top-14 h-28 w-28 rounded-full bg-gold/12 blur-2xl" /> : null}
      {tier >= 5 ? <div className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 animate-sheen bg-gradient-to-r from-transparent via-gold/12 to-transparent" /> : null}
      {tier >= 6 ? <Sparkles className="pointer-events-none absolute bottom-4 right-5 h-3.5 w-3.5 animate-pulse text-gold/80" /> : null}

      <div className="relative mb-4 flex items-center justify-between gap-3">
        <p className={clsx("text-xs font-semibold uppercase", tier >= 2 ? "text-gold" : "text-slate-400")}>{label}</p>
        <div className={clsx("grid h-8 w-8 place-items-center rounded-lg border bg-white/[0.04] transition", tier >= 4 ? "border-gold/40 shadow-[0_0_18px_rgba(248,193,74,0.18)]" : "border-line group-hover:border-cyan/30")}>
          <Icon className={clsx("h-4 w-4", tier >= 6 ? "text-gold" : tier >= 3 ? "text-cyan" : "text-cyan")} />
        </div>
      </div>
      <div className="relative flex items-end justify-between gap-2">
        <div>
          <p className="text-2xl font-semibold text-white sm:text-3xl">{value}</p>
          {detail ? <p className={clsx("mt-1 text-sm", tier >= 2 ? "text-slate-300" : "text-slate-400")}>{detail}</p> : null}
        </div>
        {tier >= 5 ? <Crown className="h-5 w-5 text-gold" /> : tier >= 4 ? <Gem className="h-5 w-5 text-violet-200" /> : null}
      </div>
    </div>
  );
}
