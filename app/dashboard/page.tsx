"use client";

import { useEffect, useMemo, useState } from "react";
import { Award, CalendarDays, Crown, Flame, Gem, Shield, Sparkles, Star, TrendingUp, Trophy } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { DevStatTester, type DevStatOverride } from "@/components/DevStatTester";
import { HabitCard } from "@/components/HabitCard";
import { MissionCard } from "@/components/MissionCard";
import { NotificationBanner } from "@/components/NotificationBanner";
import { StatCard } from "@/components/StatCard";
import { XPBar } from "@/components/XPBar";
import { getLevelTier, getLevelTierLabel, getScheduledDailyCompletionPercentage, getTitleForLevel, isHabitScheduledForDate } from "@/lib/progression";
import { DEV_MODE } from "@/lib/dev-mode";
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
    journalEntries,
    tradingJournalEntries,
    personalQuotes,
    profile,
    levelProgress,
    todayCompletedHabitIds,
    protectorsRemaining,
    completeHabit,
    uncompleteHabit,
    missHabit,
    completeMission,
    notification,
    dismissNotification,
    markMorningBriefViewed,
    awardDailyVictory
  } = useDecideLife();
  const [devStatOverride, setDevStatOverride] = useState<DevStatOverride | null>(null);
  const [reminderMessage, setReminderMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!DEV_MODE) return;
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
  const unlockedHabits = visibleHabits.filter((habit) => habit.unlocked && isHabitScheduledForDate(habit, today));
  const lockedHabits = visibleHabits.filter((habit) => !habit.unlocked);
  const activeMissions = visibleMissions.filter((mission) => !mission.completed).slice(0, 3);
  const completion = getScheduledDailyCompletionPercentage(habits, todayCompletedHabitIds, today);
  const completedToday = todayCompletedHabitIds.length;
  const totalToday = unlockedHabits.length;
  const perfectDay = totalToday > 0 && completedToday === totalToday;
  const quote = personalQuotes.length ? personalQuotes[Math.abs(today.split("-").join("").split("").reduce((sum, item) => sum + Number(item), 0)) % personalQuotes.length] : null;
  const focusMission = activeMissions[0];
  const identity = completion >= 90 && tradingJournalEntries.some((entry) => entry.date === today && entry.followedRules) ? "Disciplined Trader" :
    completion >= 80 ? "Elite Performer" :
    journalEntries.some((entry) => entry.date === today) ? "Consistent Learner" :
    "Building Discipline";
  const currentChain = (() => {
    let chain = 0;
    let cursor = new Date(`${today}T00:00:00`);
    for (let i = 0; i < 370; i += 1) {
      const key = cursor.toISOString().slice(0, 10);
      const scheduled = habits.filter((habit) => habit.unlocked && !habit.archived && isHabitScheduledForDate(habit, key));
      if (!scheduled.length) {
        cursor.setDate(cursor.getDate() - 1);
        continue;
      }
      const done = scheduled.every((habit) => habitLogs.some((log) => log.habitId === habit.id && log.date === key && log.status === "completed"));
      if (!done) break;
      chain += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return chain;
  })();
  const tomorrow = (() => {
    const next = new Date(`${today}T00:00:00`);
    next.setDate(next.getDate() + 1);
    return next.toISOString().slice(0, 10);
  })();
  const tomorrowHabits = visibleHabits.filter((habit) => habit.unlocked && isHabitScheduledForDate(habit, tomorrow));
  const yearDays = Array.from({ length: 365 }, (_, index) => {
    const date = new Date(`${today.slice(0, 4)}-01-01T00:00:00`);
    date.setDate(date.getDate() + index);
    const key = date.toISOString().slice(0, 10);
    const scheduled = habits.filter((habit) => habit.unlocked && !habit.archived && isHabitScheduledForDate(habit, key));
    const done = scheduled.filter((habit) => habitLogs.some((log) => log.habitId === habit.id && log.date === key && log.status === "completed")).length;
    const ratio = scheduled.length ? done / scheduled.length : 0;
    return { key, ratio };
  });

  useEffect(() => {
    if (perfectDay) awardDailyVictory(today);
  }, [awardDailyVictory, perfectDay, today]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if ("Notification" in window && Notification.permission === "default") {
      void Notification.requestPermission();
    }
    const fired = new Set<string>();
    const checkReminders = () => {
      const now = new Date();
      const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      unlockedHabits.forEach((habit) => {
        if (habit.reminderTime === hhmm && !fired.has(`${today}-${habit.id}-${hhmm}`)) {
          fired.add(`${today}-${habit.id}-${hhmm}`);
          const message = `Time for ${habit.name}. Maintain your streak.`;
          if ("Notification" in window && Notification.permission === "granted") new Notification(message);
          else setReminderMessage(message);
        }
      });
      if (profile.reflectionReminderTime === hhmm && !fired.has(`${today}-reflection-${hhmm}`)) {
        fired.add(`${today}-reflection-${hhmm}`);
        const message = "Your day isn't complete yet.";
        if ("Notification" in window && Notification.permission === "granted") new Notification(message);
        else setReminderMessage(message);
      }
    };
    checkReminders();
    const interval = window.setInterval(checkReminders, 60000);
    return () => window.clearInterval(interval);
  }, [profile.reflectionReminderTime, today, unlockedHabits]);
  const previewEnabled = DEV_MODE && (devStatOverride?.enabled ?? false);
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
    if (!DEV_MODE) return;
    setDevStatOverride(override);
    window.localStorage.setItem(DEV_STAT_OVERRIDE_KEY, JSON.stringify(override));
  };
  const handleDevStatReset = () => {
    if (!DEV_MODE) return;
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

        {DEV_MODE ? (
          <DevStatTester
            override={devStatOverride}
            realLevel={levelProgress.level}
            realTotalXp={profile.totalXp}
            realCompletion={completion}
            realProtectors={protectorsRemaining}
            onChange={handleDevStatChange}
            onReset={handleDevStatReset}
          />
        ) : null}

        <NotificationBanner message={notification} onDismiss={dismissNotification} />
        <NotificationBanner message={reminderMessage} onDismiss={() => setReminderMessage(null)} />

        {profile.lastMorningBriefDate !== today ? (
          <section className="mb-6 rounded-2xl border border-cyan/35 bg-cyan/[0.06] p-5 shadow-glow backdrop-blur-xl">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
              <div>
                <p className="text-sm font-semibold uppercase text-cyan">Morning Brief</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Good Morning, {profile.displayName}.</h2>
                {quote ? <p className="mt-3 text-lg text-slate-200">"{quote.text}"</p> : null}
                <div className="mt-4 grid gap-3 text-sm text-slate-300 sm:grid-cols-2 lg:grid-cols-5">
                  <span>Today&apos;s Habits: <strong className="text-white">{totalToday}</strong></span>
                  <span>Current Streak: <strong className="text-white">{Math.max(...habits.map((habit) => habit.currentStreak), 0)} Days</strong></span>
                  <span>Focus Mission: <strong className="text-white">{focusMission?.title ?? "None"}</strong></span>
                  <span>Trading Today: <strong className="text-white">London Session</strong></span>
                  <span>Identity: <strong className="text-white">{identity}</strong></span>
                </div>
              </div>
              <button className="dl-button rounded-lg border border-cyan/40 bg-cyan/10 px-4 py-2 text-sm font-semibold text-cyan" onClick={() => markMorningBriefViewed(today)}>
                Dismiss
              </button>
            </div>
          </section>
        ) : null}

        <section className={`mb-6 grid gap-4 lg:grid-cols-[1fr_0.7fr] ${perfectDay ? "perfect-day-glow" : ""}`}>
          <article className="dl-card relative overflow-hidden p-5">
            {perfectDay ? <div className="confetti-layer" /> : null}
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <p className="text-sm font-semibold uppercase text-cyan">Today&apos;s Progress</p>
                <h2 className="mt-1 text-3xl font-semibold text-white">{perfectDay ? "Daily Victory" : `${displayCompletion}%`}</h2>
                <p className="mt-1 text-sm text-slate-400">{completedToday} / {totalToday} Habits Completed</p>
              </div>
              {perfectDay ? <span className="rounded-full border border-gold/50 bg-gold/10 px-4 py-2 text-sm font-semibold text-gold">PERFECT DAY +{profile.dailyBonusXp} XP</span> : null}
            </div>
            <div className="mt-4 h-4 overflow-hidden rounded-full border border-line bg-ink/70">
              <div className="h-full rounded-full bg-gradient-to-r from-cyan via-mint to-gold transition-[width] duration-700" style={{ width: `${displayCompletion}%` }} />
            </div>
          </article>

          <article className="dl-card p-5">
            <p className="text-sm font-semibold uppercase text-cyan">Don&apos;t Break The Chain</p>
            <h2 className="mt-2 text-3xl font-semibold text-white">{currentChain} Consecutive Days</h2>
            <p className="mt-2 text-sm text-slate-400">Milestones: 7, 30, 60, 100, 180, 365</p>
            <p className="mt-3 rounded-lg border border-line bg-white/[0.03] px-3 py-2 text-sm text-slate-300">Identity: <span className="font-semibold text-cyan">{identity}</span></p>
          </article>
        </section>

        <section className="mb-6 grid gap-4 xl:grid-cols-3">
          <article className="dl-card p-5">
            <p className="text-sm font-semibold uppercase text-cyan">Weekly Review</p>
            <div className="mt-3 grid gap-2 text-sm text-slate-300">
              <p>Habits Completed: <strong className="text-white">{habitLogs.filter((log) => log.status === "completed").slice(-50).length}</strong></p>
              <p>Completion: <strong className="text-white">{displayCompletion}% today</strong></p>
              <p>Level Progress: <strong className="text-white">{displayLevelProgress.percentage}%</strong></p>
              <p>Best Habit: <strong className="text-white">{[...habits].sort((a, b) => b.currentStreak - a.currentStreak)[0]?.name ?? "None"}</strong></p>
              <p>Trading Summary: <strong className="text-white">{tradingJournalEntries.filter((entry) => entry.date >= today.slice(0, 8) + "01").length} logs this month</strong></p>
              <p>Journal Entries Written: <strong className="text-white">{journalEntries.length}</strong></p>
            </div>
          </article>
          <article className="dl-card p-5">
            <p className="text-sm font-semibold uppercase text-cyan">Tomorrow</p>
            <div className="mt-3 grid gap-2 text-sm text-slate-300">
              <p>Tomorrow&apos;s Habits: <strong className="text-white">{tomorrowHabits.length}</strong></p>
              <p>Trading Scheduled: <strong className="text-white">Check session plan</strong></p>
              <p>Mission Focus: <strong className="text-white">{focusMission?.title ?? "None"}</strong></p>
              <p>Reminders: <strong className="text-white">{tomorrowHabits.filter((habit) => habit.reminderTime).length}</strong></p>
            </div>
          </article>
          <article className="dl-card p-5">
            <div className="mb-3 flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-cyan" />
              <p className="text-sm font-semibold uppercase text-cyan">Consistency Heatmap</p>
            </div>
            <div className="grid grid-cols-[repeat(53,minmax(0,1fr))] gap-1">
              {yearDays.map((day) => (
                <a
                  key={day.key}
                  href={`/journal/${day.key}`}
                  title={`${day.key}: ${Math.round(day.ratio * 100)}%`}
                  className={`h-2.5 rounded-sm ${day.ratio >= 1 ? "bg-cyan" : day.ratio >= 0.66 ? "bg-cyan/60" : day.ratio > 0 ? "bg-cyan/25" : "bg-white/[0.05]"}`}
                />
              ))}
            </div>
          </article>
        </section>

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
                  onComplete={(habitId, durationMinutes) => completeHabit(habitId, today, durationMinutes, "dashboard")}
                  onUncomplete={(habitId) => uncompleteHabit(habitId, today, "dashboard")}
                  onMiss={(habitId) => missHabit(habitId, today, "dashboard")}
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
