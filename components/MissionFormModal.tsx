"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { createId } from "@/lib/ids";
import type { Mission, MissionCategory, MissionType } from "@/types";

interface MissionFormModalProps {
  mission?: Mission;
  missions: Mission[];
  onSave: (mission: Mission) => void;
  onClose: () => void;
}

const categories: MissionCategory[] = ["career", "fitness", "nutrition", "finance", "trading", "personal"];

export function MissionFormModal({ mission, missions, onSave, onClose }: MissionFormModalProps) {
  const [title, setTitle] = useState(mission?.title ?? "");
  const [description, setDescription] = useState(mission?.description ?? "");
  const [category, setCategory] = useState<MissionCategory>(mission?.category ?? "personal");
  const [xpReward, setXpReward] = useState(mission?.xpReward ?? 250);
  const [type, setType] = useState<MissionType>(mission?.type ?? "side");
  const [locked, setLocked] = useState(mission?.locked ?? false);
  const [completed, setCompleted] = useState(mission?.completed ?? false);
  const [prerequisiteMissionId, setPrerequisiteMissionId] = useState(mission?.prerequisites[0] ?? "");
  const [unlocksText, setUnlocksText] = useState((mission?.unlocksMissionIds ?? []).join(","));

  const submit = () => {
    if (!title.trim()) return;
    onSave({
      id: mission?.id ?? createId("mission", title),
      title: title.trim(),
      description: description.trim(),
      category,
      xpReward,
      type,
      locked,
      completed,
      prerequisites: prerequisiteMissionId ? [prerequisiteMissionId] : [],
      unlocksMissionIds: unlocksText.split(",").map((id) => id.trim()).filter(Boolean),
      archived: false
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/82 p-4 backdrop-blur-xl">
      <section className="w-full max-w-2xl rounded-xl border border-line bg-panel p-5 shadow-premium">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-white">{mission ? "Edit Mission" : "New Mission"}</h2>
          <button type="button" className="dl-button grid h-9 w-9 place-items-center rounded-lg border border-line bg-white/[0.03] text-slate-300" onClick={onClose}>
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-4">
          <label className="grid gap-2 text-sm text-slate-300">
            Mission title
            <input className="rounded-lg border border-line bg-ink/70 px-3 py-2 text-white outline-none transition focus:border-cyan/60" value={title} onChange={(event) => setTitle(event.currentTarget.value)} />
          </label>
          <label className="grid gap-2 text-sm text-slate-300">
            Description
            <textarea className="min-h-24 rounded-lg border border-line bg-ink/70 px-3 py-2 text-white outline-none transition focus:border-cyan/60" value={description} onChange={(event) => setDescription(event.currentTarget.value)} />
          </label>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="grid gap-2 text-sm text-slate-300">
              Category
              <select className="rounded-lg border border-line bg-ink/70 px-3 py-2 text-white outline-none transition focus:border-cyan/60" value={category} onChange={(event) => setCategory(event.currentTarget.value as MissionCategory)}>
                {categories.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <label className="grid gap-2 text-sm text-slate-300">
              XP reward
              <input type="number" min={0} className="rounded-lg border border-line bg-ink/70 px-3 py-2 text-white outline-none transition focus:border-cyan/60" value={xpReward} onChange={(event) => setXpReward(Number(event.currentTarget.value))} />
            </label>
            <label className="grid gap-2 text-sm text-slate-300">
              Mission type
              <select className="rounded-lg border border-line bg-ink/70 px-3 py-2 text-white outline-none transition focus:border-cyan/60" value={type} onChange={(event) => setType(event.currentTarget.value as MissionType)}>
                <option value="side">Side mission</option>
                <option value="major">Major milestone</option>
              </select>
            </label>
          </div>
          <label className="grid gap-2 text-sm text-slate-300">
            Optional prerequisite mission
            <select className="rounded-lg border border-line bg-ink/70 px-3 py-2 text-white outline-none transition focus:border-cyan/60" value={prerequisiteMissionId} onChange={(event) => setPrerequisiteMissionId(event.currentTarget.value)}>
              <option value="">None</option>
              {missions.filter((item) => item.id !== mission?.id).map((item) => (
                <option key={item.id} value={item.id}>{item.title}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm text-slate-300">
            Missions to unlock after completion
            <select
              multiple
              className="min-h-28 rounded-lg border border-line bg-ink/70 px-3 py-2 text-white outline-none transition focus:border-cyan/60"
              value={unlocksText.split(",").filter(Boolean)}
              onChange={(event) => setUnlocksText(Array.from(event.currentTarget.selectedOptions).map((option) => option.value).join(","))}
            >
              {missions.filter((item) => item.id !== mission?.id).map((item) => (
                <option key={item.id} value={item.id}>{item.title}</option>
              ))}
            </select>
          </label>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input type="checkbox" checked={locked} onChange={(event) => setLocked(event.currentTarget.checked)} />
              Locked
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input type="checkbox" checked={completed} onChange={(event) => setCompleted(event.currentTarget.checked)} />
              Completed
            </label>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className="dl-button rounded-lg border border-line bg-white/[0.03] px-4 py-2 text-sm text-slate-300" onClick={onClose}>Cancel</button>
          <button type="button" className="dl-button rounded-lg bg-gradient-to-r from-cyan to-mint px-4 py-2 text-sm font-semibold text-slate-950 shadow-glow hover:brightness-110" onClick={submit}>Save Mission</button>
        </div>
      </section>
    </div>
  );
}
