"use client";

import { useEffect, useMemo, useState } from "react";
import { Award, Crown, Flame, Gem, Shield, Sparkles, Star, TrendingUp, Trophy } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { DevStatTester, type DevStatOverride } from "@/components/DevStatTester";
import { HabitCard } from "@/components/HabitCard";
import { MissionCard } from "@/components/MissionCard";
import { NotificationBanner } from "@/components/NotificationBanner";
import { StatCard } from "@/components/StatCard";
import { XPBar } from "@/components/XPBar";
import { getDailyCompletionPercentage, getLevelTier, getLevelTierLabel, getTitleForLevel } from "@/lib/progression";
import { hasSupabaseConfig } from "@/lib/supabase";
import { useDecideLife } from "@/lib/local-store";
import type { LevelProgress } from "@/types";

const DEV_STAT_OVERRIDE_KEY = "decidelife-dev-stat-override";

function calculateDevLevelProgress(level: number, totalXp: number): LevelProgress {
  const normalizedLevel = Math.max(1, Math.round(level));
  const normalizedXp = Math.max(0, Math.round(totalXp));
  const currentLevelXp = Math.max(0, Math.round((normalizedLevel - 1) * 1250 + Math.pow(normalizedLevel - 1, 2) * 65));
  const levelSpan = Math.max(1000, Math.round(1250 + normalizedLevel * 130));
  const nextLevelXp = currentLevelXp + levelSpan;
  const xpIntoLevel = Math.min(levelSpan, Math.max(0, normalizedXp - currentLevelXp));
  const xpToNextLevel = Math.max(0, nextLevelXp - Math.max(normalizedXp, currentLevelXp));
  const percentage = Math.min(100, Math.round((xpIntoLevel / levelSpan) * 100));

  return {
    level: normalizedLevel,
    currentLevelXp,
    nextLevelXp,
    xpIntoLevel,
    xpToNextLevel,
    percentage,
    title: getTitleForLevel(normalizedLevel)
  };
}

export default function DashboardPage() {
  const {
    habits,
    habitLogs,
    missions,
    profile,
    levelProgress,
    todayCompletedHabitIds,
    protectorsRemaining,
    completeHabit,
    missHabit,
    completeMission,
    notification,
    dismissNotification
  } = useDecideLife();
  const [devStatOverride, setDevStatOverride] = useState<DevStatOverride | null>(null);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(DEV_STAT_OVERRIDE_KEY);
      if (saved) {
        setDevStatOverride(JSON.parse(saved) as DevStatOverride);
      }
    } catch {
      setDevStatOverride(null);
    }
  }, []);

  const today = new Date().toISOString().slice(0, 10);
  const visibleHabits = habits.filter((habit) => !habit.archived).sort((a, b) => a.order - b.order);
  const visibleMissions = missions.filter((mission) => !mission.archived);
  const unlockedHabits = visibleHabits.filter((habit) => habit.unlocked);
  const lockedHabits = visibleHabits.filter((habit) => !habit.unlocked);
  const activeMissions = visibleMissions.filter((mission) => !mission.completed).slice(0, 3);
  const completion = getDailyCompletionPercentage(habits, todayCompletedHabitIds);
  const previewEnabled = devStatOverride?.enabled ?? false;
  const displayLevelProgress = useMemo(
    () => previewEnabled && devStatOverride
      ? calculateDevLevelProgress(devStatOverride.level, devStatOverride.totalXp)
      : levelProgress,
    [devStatOverride, levelProgress, previewEnabled]
  );
  const displayTotalXp = previewEnabled && devStatOverride ? devStatOverride.totalXp : profile.totalXp;
  const displayCompletion = previewEnabled && devStatOverride ? devStatOverride.completion : completion;
  const displayProtectors = previewEnabled && devStatOverride ? devStatOverride.protectors : protectorsRemaining;
  const displayTitle = previewEnabled ? getLevelTierLabel(displayLevelProgress.level) : profile.currentTitle;
  const levelTier = getLevelTier(displayLevelProgress.level);
  const levelTierLabel = getLevelTierLabel(displayLevelProgress.level);
  const LevelIcon = levelTier >= 7 ? Gem : levelTier >= 5 ? Crown : levelTier >= 3 ? Trophy : Shield;
  const levelFrameTier = levelTier >= 7 ? 7 : levelTier;
  const handleDevStatChange = (override: DevStatOverride) => {
    // TEMP TESTING FEATURE - remove before final release.
    setDevStatOverride(override);
    window.localStorage.setItem(DEV_STAT_OVERRIDE_KEY, JSON.stringify(override));
  };
  const handleDevStatReset = () => {
    // TEMP TESTING FEATURE - remove before final release.
    setDevStatOverride(null);
    window.localStorage.removeItem(DEV_STAT_OVERRIDE_KEY);
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl">
        <header className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium text-cyan">Command Center</p>
            <h1 className="mt-2 max-w-3xl text-4xl font-semibold text-white sm:text-5xl">Today decides the next unlock.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-400">Track the few actions that compound into the life you are building.</p>
          </div>
          <div className="rounded-full border border-line bg-white/[0.04] px-3 py-2 text-sm text-slate-400 backdrop-blur-xl">
            Storage: {hasSupabaseConfig ? "Supabase connected" : "Local fallback"}
          </div>
        </header>

        <DevStatTester
          override={devStatOverride}
          realLevel={levelProgress.level}
          realTotalXp={profile.totalXp}
          realCompletion={completion}
          realProtectors={protectorsRemaining}
          onChange={handleDevStatChange}
          onReset={handleDevStatReset}
        />

        <NotificationBanner message={notification} onDismiss={dismissNotification} />

        <section
          className={[
            `ornate-card progression-frame tier-${levelFrameTier} relative rounded-2xl border p-4 shadow-panel backdrop-blur-xl`,
            levelTier >= 7 ? "border-cyan/75 bg-gradient-to-br from-cyan/12 via-panel-glass to-gold/10 shadow-[0_0_64px_rgba(56,189,248,0.28)]" :
            levelTier >= 6 ? "border-gold/75 bg-gradient-to-br from-gold/14 via-panel-glass to-violet/12 shadow-[0_0_56px_rgba(248,193,74,0.3)]" :
            levelTier >= 4 ? "border-violet/55 bg-gradient-to-br from-violet/10 via-panel-glass to-gold/8" :
            levelTier >= 2 ? "border-gold/45 bg-gradient-to-br from-gold/8 via-panel-glass to-panel-glass" :
            "border-line bg-panel-glass"
          ].join(" ")}
        >
          {levelTier >= 2 ? (
            <>
              <span className="ornate-rail top" />
              <span className="ornate-rail bottom" />
              <span className="ornate-corner tl"><span className="ornate-corner-mark" /></span>
              <span className="ornate-corner tr"><span className="ornate-corner-mark" /></span>
              <span className="ornate-corner bl"><span className="ornate-corner-mark" /></span>
              <span className="ornate-corner br"><span className="ornate-corner-mark" /></span>
            </>
          ) : null}
          {levelTier >= 4 ? (
            <>
              <span className="ornate-side left" />
              <span className="ornate-side right" />
              <div className="ornate-center">
                <span className="ornate-wing" />
                <Crown className="h-5 w-5" />
                <span className="ornate-wing right" />
              </div>
              <div className="ornate-center bottom">
                <span className="ornate-wing" />
                <span className="ornate-gem" />
                <span className="ornate-wing right" />
              </div>
            </>
          ) : null}
          {levelTier >= 5 ? <div className="ornate-shine" /> : null}
          {levelTier >= 6 ? (
            <>
              <Sparkles className="pointer-events-none absolute right-6 top-5 z-[6] h-4 w-4 animate-pulse text-gold" />
              <span className="ornate-spark right-24 top-7" />
              <span className="ornate-spark bottom-6 left-1/3 [animation-delay:650ms]" />
            </>
          ) : null}
          {levelTier >= 7 ? (
            <>
              <Star className="pointer-events-none absolute left-1/2 top-6 z-[6] h-4 w-4 -translate-x-1/2 animate-pulse text-cyan" />
              <span className="ornate-spark bottom-7 right-1/4 bg-cyan [animation-delay:1150ms]" />
            </>
          ) : null}

          <div className="relative z-[7] grid gap-4 xl:grid-cols-[12rem_1fr]">
            <aside className="relative overflow-hidden rounded-xl border border-line bg-ink/35 p-4">
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-transparent" />
              <div className="relative flex items-center gap-3 xl:block">
                <div className="crest-ring h-16 w-16 rounded-full xl:mx-auto">
                  <LevelIcon className={levelTier >= 7 ? "relative z-10 h-8 w-8 text-cyan" : "relative z-10 h-8 w-8 text-gold"} />
                  {levelTier >= 5 ? <Crown className="absolute -top-2 h-4 w-4 text-gold" /> : null}
                </div>
                <div className="xl:mt-4 xl:text-center">
                  <p className="inline-flex rounded-md border border-line bg-white/[0.04] px-2 py-1 text-xs font-semibold uppercase text-slate-300">
                    Tier {levelTier}
                  </p>
                  <h2 className={levelTier >= 7 ? "mt-2 text-xl font-semibold uppercase text-cyan" : levelTier >= 2 ? "mt-2 text-xl font-semibold uppercase text-gold" : "mt-2 text-xl font-semibold uppercase text-white"}>
                    {levelTierLabel}
                  </h2>
                  <p className="mt-1 text-sm text-cyan">Level {displayLevelProgress.level}</p>
                  <p className="mt-2 text-xs leading-relaxed text-slate-400">{previewEnabled ? "Dev preview active" : "Progression frame active"}</p>
                </div>
              </div>
            </aside>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1fr_2.55fr_1.15fr_1fr_1fr]">
              <StatCard label="Current Level" value={displayLevelProgress.level} detail={displayTitle} icon={Award} level={displayLevelProgress.level} />
              <XPBar
                percentage={displayLevelProgress.percentage}
                xpIntoLevel={displayLevelProgress.xpIntoLevel}
                xpToNextLevel={displayLevelProgress.xpToNextLevel}
                level={displayLevelProgress.level}
                totalXp={displayTotalXp}
              />
              <StatCard label="Rank" value={levelTierLabel} detail="Title unlocks by level" icon={TrendingUp} level={displayLevelProgress.level} />
              <StatCard label="Protectors" value={displayProtectors} detail="Reset monthly" icon={Shield} level={displayLevelProgress.level} />
              <StatCard label="Daily Complete" value={`${displayCompletion}%`} detail="Unlocked habits today" icon={Flame} level={displayLevelProgress.level} />
            </div>
          </div>
        </section>

        <section className="mt-7 grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
          <div>
            <div className="mb-3 flex items-center justify-between rounded-xl border border-line bg-white/[0.03] px-4 py-3">
              <h2 className="text-lg font-semibold text-white">Active Habits</h2>
              <p className="text-sm text-slate-400">{unlockedHabits.length} unlocked</p>
            </div>
            <div className="grid gap-4">
              {unlockedHabits.map((habit) => (
                <HabitCard
                  key={habit.id}
                  habit={habit}
                  log={habitLogs.find((log) => log.habitId === habit.id && log.date === today)}
                  onComplete={completeHabit}
                  onMiss={missHabit}
                />
              ))}
            </div>
          </div>

          <div className="grid content-start gap-6">
            <div>
              <h2 className="mb-3 rounded-xl border border-line bg-white/[0.03] px-4 py-3 text-lg font-semibold text-white">Locked Habits</h2>
              <div className="grid gap-3">
                {lockedHabits.map((habit) => (
                  <HabitCard key={habit.id} habit={habit} compact />
                ))}
              </div>
            </div>

            <div>
              <h2 className="mb-3 rounded-xl border border-line bg-white/[0.03] px-4 py-3 text-lg font-semibold text-white">Active Missions</h2>
              <div className="grid gap-3">
                {activeMissions.map((mission) => (
                  <MissionCard key={mission.id} mission={mission} onComplete={completeMission} />
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
