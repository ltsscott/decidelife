"use client";

import { RotateCcw, SlidersHorizontal } from "lucide-react";
import { clsx } from "clsx";
import { getLevelTier, getLevelTierLabel } from "@/lib/progression";

export interface DevStatOverride {
  enabled: boolean;
  level: number;
  totalXp: number;
  completion: number;
  protectors: number;
}

interface DevStatTesterProps {
  override: DevStatOverride | null;
  realLevel: number;
  realTotalXp: number;
  realCompletion: number;
  realProtectors: number;
  onChange: (override: DevStatOverride) => void;
  onReset: () => void;
}

const presets = [
  { label: "Beginner", level: 1, totalXp: 125, completion: 45, protectors: 2 },
  { label: "Bronze", level: 7, totalXp: 7_600, completion: 62, protectors: 2 },
  { label: "Silver", level: 15, totalXp: 32_500, completion: 78, protectors: 1 },
  { label: "Gold", level: 35, totalXp: 145_000, completion: 88, protectors: 2 },
  { label: "Diamond", level: 75, totalXp: 520_000, completion: 96, protectors: 3 },
  { label: "Mythic", level: 100, totalXp: 1_000_000, completion: 100, protectors: 4 }
];

function clampNumber(value: number, min: number, max: number) {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}

export function DevStatTester({
  override,
  realLevel,
  realTotalXp,
  realCompletion,
  realProtectors,
  onChange,
  onReset
}: DevStatTesterProps) {
  const active = override?.enabled ?? false;
  const draft = override ?? {
    enabled: false,
    level: realLevel,
    totalXp: realTotalXp,
    completion: realCompletion,
    protectors: realProtectors
  };
  const tier = getLevelTier(draft.level);
  const tierLabel = getLevelTierLabel(draft.level);

  const update = (partial: Partial<DevStatOverride>) => {
    onChange({
      enabled: true,
      level: draft.level,
      totalXp: draft.totalXp,
      completion: draft.completion,
      protectors: draft.protectors,
      ...partial
    });
  };

  return (
    <section className="mt-4 rounded-2xl border border-dashed border-cyan/35 bg-cyan/[0.04] p-4 shadow-panel backdrop-blur-xl">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl border border-cyan/30 bg-cyan/10 text-cyan">
            <SlidersHorizontal className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-cyan">Dev Stats</p>
            <p className="text-xs text-slate-400">
              Testing only - previews dashboard tier visuals without saving real progress.
            </p>
          </div>
        </div>
        <div className={clsx("rounded-full border px-3 py-1 text-xs font-semibold uppercase", active ? "border-gold/50 bg-gold/10 text-gold" : "border-line bg-white/[0.04] text-slate-400")}>
          {active ? `Previewing ${tierLabel} / Tier ${tier}` : "Real stats active"}
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[1.15fr_0.75fr_0.75fr_0.75fr_auto]">
        <div>
          <label className="text-xs font-semibold uppercase text-slate-400" htmlFor="dev-preset">Tier Preview</label>
          <select
            id="dev-preset"
            className="mt-2 w-full rounded-xl border border-line bg-ink/80 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan/60"
            value=""
            onChange={(event) => {
              const preset = presets.find((item) => item.label === event.target.value);
              if (preset) update(preset);
            }}
          >
            <option value="" disabled>Choose preset</option>
            {presets.map((preset) => (
              <option key={preset.label} value={preset.label}>
                {preset.label} / Level {preset.level}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase text-slate-400" htmlFor="dev-level">Level</label>
          <input
            id="dev-level"
            min={1}
            max={150}
            type="number"
            className="mt-2 w-full rounded-xl border border-line bg-ink/80 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan/60"
            value={draft.level}
            onChange={(event) => update({ level: clampNumber(Number(event.target.value), 1, 150) })}
          />
        </div>

        <div>
          <label className="text-xs font-semibold uppercase text-slate-400" htmlFor="dev-xp">XP</label>
          <input
            id="dev-xp"
            min={0}
            type="number"
            className="mt-2 w-full rounded-xl border border-line bg-ink/80 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan/60"
            value={draft.totalXp}
            onChange={(event) => update({ totalXp: clampNumber(Number(event.target.value), 0, 9_999_999) })}
          />
        </div>

        <div>
          <label className="text-xs font-semibold uppercase text-slate-400" htmlFor="dev-completion">Daily %</label>
          <input
            id="dev-completion"
            min={0}
            max={100}
            type="number"
            className="mt-2 w-full rounded-xl border border-line bg-ink/80 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan/60"
            value={draft.completion}
            onChange={(event) => update({ completion: clampNumber(Number(event.target.value), 0, 100) })}
          />
        </div>

        <button
          className="self-end rounded-xl border border-line bg-white/[0.04] px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-cyan/45 hover:bg-cyan/10 hover:text-white active:scale-[0.98]"
          type="button"
          onClick={onReset}
        >
          <span className="inline-flex items-center gap-2">
            <RotateCcw className="h-4 w-4" />
            Reset to Real Stats
          </span>
        </button>
      </div>
    </section>
  );
}
