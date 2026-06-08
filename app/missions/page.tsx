"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { MissionFormModal } from "@/components/MissionFormModal";
import { MissionCard } from "@/components/MissionCard";
import { useDecideLife } from "@/lib/local-store";
import type { Mission } from "@/types";

export default function MissionsPage() {
  const { missions, completeMission, saveMission, archiveMission } = useDecideLife();
  const [editingMission, setEditingMission] = useState<Mission | undefined>();
  const [formOpen, setFormOpen] = useState(false);
  const visibleMissions = missions.filter((mission) => !mission.archived);

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl">
        <header className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium text-cyan">Missions</p>
            <h1 className="mt-2 text-4xl font-semibold text-white">One-time goals with clean dependencies.</h1>
            <p className="mt-3 text-sm text-slate-400">Major milestones and side objectives stay readable without becoming noisy.</p>
          </div>
          <button
            type="button"
            className="dl-button inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-cyan to-mint px-4 text-sm font-semibold text-slate-950 shadow-glow hover:brightness-110"
            onClick={() => {
              setEditingMission(undefined);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            New Mission
          </button>
        </header>

        <section className="grid gap-4 lg:grid-cols-2">
          {visibleMissions.map((mission) => (
            <MissionCard
              key={mission.id}
              mission={mission}
              onComplete={completeMission}
              onEdit={(item) => {
                setEditingMission(item);
                setFormOpen(true);
              }}
              onArchive={archiveMission}
            />
          ))}
        </section>

        {formOpen ? (
          <MissionFormModal
            mission={editingMission}
            missions={visibleMissions}
            onSave={saveMission}
            onClose={() => {
              setFormOpen(false);
              setEditingMission(undefined);
            }}
          />
        ) : null}
      </div>
    </DashboardLayout>
  );
}
