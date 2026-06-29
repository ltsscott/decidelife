"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { habits as seedHabits, habitLogs as seedHabitLogs, journalEntries as seedJournalEntries, journeyMilestones as seedJourneyMilestones, missions as seedMissions, personalQuotes as seedPersonalQuotes, streakProtectorUsages as seedProtectors, tradingJournalEntries as seedTradingJournalEntries, tradingNotes as seedTradingNotes, tradingRules as seedTradingRules, userProfile as seedProfile } from "@/lib/mock-data";
import { calculateLevelProgress, getHabitCompletionXp, getProtectorUsageForCurrentMonth, getScheduledDailyCompletionPercentage, isHabitScheduledForDate, unlockMissions } from "@/lib/progression";
import { hasSupabaseConfig, supabase } from "@/lib/supabase";
import { loadSupabaseState, saveSupabaseState } from "@/lib/supabase-data";
import type { AppTheme, Habit, HabitLog, JournalEntry, JourneyMilestone, Mission, PersonalQuote, StreakProtectorUsage, TradingJournalEntry, TradingNote, TradingRule, UserProfile } from "@/types";
import type { User } from "@supabase/supabase-js";

interface DecideLifeState {
  profile: UserProfile;
  habits: Habit[];
  habitLogs: HabitLog[];
  missions: Mission[];
  journalEntries: JournalEntry[];
  protectors: StreakProtectorUsage[];
  tradingJournalEntries: TradingJournalEntry[];
  tradingNotes: TradingNote[];
  tradingRules: TradingRule[];
  personalQuotes: PersonalQuote[];
  journeyMilestones: JourneyMilestone[];
  lastHabitReviewDate: string;
}

interface DecideLifeContextValue extends DecideLifeState {
  completeHabit: (habitId: string, date?: string, durationMinutes?: number, source?: string) => void;
  uncompleteHabit: (habitId: string, date?: string, source?: string) => void;
  missHabit: (habitId: string, date?: string, source?: string) => void;
  saveHabit: (habit: Habit) => void;
  archiveHabit: (habitId: string) => void;
  completeMission: (missionId: string) => void;
  saveMission: (mission: Mission) => void;
  archiveMission: (missionId: string) => void;
  saveJournalEntry: (entry: JournalEntry) => void;
  deleteJournalEntry: (entryId: string) => void;
  resetAppData: () => void;
  resetDecideLife: () => void;
  setTheme: (theme: AppTheme) => void;
  setTradingAccountType: (accountType: UserProfile["tradingAccountType"]) => void;
  saveTradingJournalEntry: (entry: TradingJournalEntry) => void;
  saveTradingNote: (note: TradingNote) => void;
  deleteTradingNote: (noteId: string) => void;
  saveTradingRule: (rule: TradingRule) => void;
  savePersonalQuote: (quote: PersonalQuote) => void;
  deletePersonalQuote: (quoteId: string) => void;
  saveJourneyMilestone: (milestone: JourneyMilestone) => void;
  deleteJourneyMilestone: (milestoneId: string) => void;
  markMorningBriefViewed: (date: string) => void;
  awardDailyVictory: (date: string) => void;
  setHabitTestingStreakOverride: (habitId: string, streak: number) => void;
  clearHabitTestingStreakOverride: (habitId: string) => void;
  dismissNotification: () => void;
  levelProgress: ReturnType<typeof calculateLevelProgress>;
  todayCompletedHabitIds: string[];
  protectorsRemaining: number;
  notification: string | null;
  authReady: boolean;
  isAuthenticated: boolean;
}

const STORAGE_KEY = "decidelife-state-v1";
const DecideLifeContext = createContext<DecideLifeContextValue | null>(null);

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function createInitialState(): DecideLifeState {
  return {
    profile: clone(seedProfile),
    habits: clone(seedHabits),
    habitLogs: clone(seedHabitLogs),
    missions: clone(seedMissions),
    journalEntries: clone(seedJournalEntries),
    protectors: clone(seedProtectors),
    tradingJournalEntries: clone(seedTradingJournalEntries),
    tradingNotes: clone(seedTradingNotes),
    tradingRules: clone(seedTradingRules),
    personalQuotes: clone(seedPersonalQuotes),
    journeyMilestones: clone(seedJourneyMilestones),
    lastHabitReviewDate: today()
  };
}

function createFreshState(): DecideLifeState {
  return {
    profile: {
      ...clone(seedProfile),
      totalXp: 0,
      currentLevel: 1,
      highestLevelReached: 1,
      currentTitle: "Initiate"
    },
    habits: clone(seedHabits).map((habit) => ({
      ...habit,
      currentStreak: 0,
      bestStreak: 0
    })),
    habitLogs: [],
    missions: clone(seedMissions).map((mission) => ({
      ...mission,
      completed: false
    })),
    journalEntries: [],
    protectors: [],
    tradingJournalEntries: [],
    tradingNotes: [],
    tradingRules: clone(seedTradingRules),
    personalQuotes: clone(seedPersonalQuotes),
    journeyMilestones: [],
    lastHabitReviewDate: today()
  };
}

const initialState: DecideLifeState = {
  ...createInitialState(),
  lastHabitReviewDate: today()
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(date: string, days: number) {
  const next = new Date(`${date}T00:00:00`);
  next.setDate(next.getDate() + days);
  return next.toISOString().slice(0, 10);
}

function monthForDate(date: string) {
  return date.slice(0, 7);
}

function compareDates(a: string, b: string) {
  return a.localeCompare(b);
}

function normalizeState(state: DecideLifeState): DecideLifeState {
  return {
    ...state,
    profile: {
      ...state.profile,
      theme: state.profile.theme ?? "blue",
      tradingAccountType: state.profile.tradingAccountType ?? "phase-1",
      dailyBonusXp: state.profile.dailyBonusXp ?? 50,
      reflectionReminderTime: state.profile.reflectionReminderTime ?? "21:00"
    },
    lastHabitReviewDate: state.lastHabitReviewDate ?? today(),
    habits: state.habits.map((habit, index) => ({
      ...habit,
      order: habit.order ?? index + 1,
      baseXp: habit.baseXp ?? 100,
      streakMultiplierEnabled: habit.streakMultiplierEnabled ?? true,
      archived: habit.archived ?? false,
      testingStreakOverride: habit.testingStreakOverride,
      activeDays: habit.activeDays?.length ? habit.activeDays : [0, 1, 2, 3, 4, 5, 6],
      reminderTime: habit.reminderTime,
      sessionMinutes: habit.sessionMinutes
    })),
    missions: state.missions.map((mission) => ({
      ...mission,
      type: mission.type ?? (mission.xpReward >= 500 ? "major" : "side"),
      prerequisites: mission.prerequisites ?? [],
      unlocksMissionIds: mission.unlocksMissionIds ?? [],
      archived: mission.archived ?? false
    })),
    tradingJournalEntries: state.tradingJournalEntries ?? [],
    tradingNotes: state.tradingNotes ?? [],
    tradingRules: state.tradingRules?.length ? state.tradingRules : clone(seedTradingRules),
    personalQuotes: state.personalQuotes ?? [],
    journeyMilestones: state.journeyMilestones ?? [],
    habitLogs: (state.habitLogs ?? [])
      .filter((log) => !(log.id === "log-1" && log.habitId === "workout" && log.date === today()))
      .map((log) => {
        const legacyStatus = log.status as HabitLog["status"] | "complete";
        const status = legacyStatus === "complete" ? "completed" : legacyStatus;
        return {
          ...log,
          status,
          usedProtector: log.usedProtector ?? status === "protected"
        };
      }) as HabitLog[]
  };
}

function saveState(state: DecideLifeState) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
}

function getStoredLocalState() {
  if (typeof window === "undefined") return createInitialState();
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored ? normalizeState(JSON.parse(stored) as DecideLifeState) : createInitialState();
}

function attachSupabaseUser(state: DecideLifeState, user: User): DecideLifeState {
  return {
    ...state,
    profile: {
      ...state.profile,
      id: user.id,
      email: user.email ?? state.profile.email
    },
    protectors: state.protectors.map((usage) => ({ ...usage, userId: user.id }))
  };
}

function unlockNextHabit(habits: Habit[]) {
  const nextLocked = [...habits].sort((a, b) => a.order - b.order).find((habit) => !habit.unlocked && !habit.archived);
  if (!nextLocked) return { habits, unlockedHabitName: null };
  return {
    habits: habits.map((habit) => (habit.id === nextLocked.id ? { ...habit, unlocked: true } : habit)),
    unlockedHabitName: nextLocked.name
  };
}

function applyXp(profile: UserProfile, xpDelta: number) {
  const totalXp = Math.max(0, profile.totalXp + xpDelta);
  const progress = calculateLevelProgress(totalXp, profile.highestLevelReached);
  return {
    ...profile,
    totalXp,
    highestLevelReached: Math.max(profile.highestLevelReached, progress.level),
    currentLevel: Math.max(profile.currentLevel, progress.level),
    currentTitle: progress.title
  };
}

function getProtectorUsageForMonth(usages: StreakProtectorUsage[], month: string) {
  return usages.find((usage) => usage.month === month) ?? {
    id: `protector-${month}`,
    userId: "local-user",
    month,
    totalAvailable: 2,
    used: 0
  };
}

function changeProtectorUsage(usages: StreakProtectorUsage[], date: string, delta: number) {
  const month = monthForDate(date);
  const usage = getProtectorUsageForMonth(usages, month);
  const nextUsage = {
    ...usage,
    used: Math.max(0, Math.min(usage.totalAvailable, usage.used + delta))
  };
  return usages.some((item) => item.month === month)
    ? usages.map((item) => (item.month === month ? nextUsage : item))
    : [...usages, nextUsage];
}

function recalculateHabitStreaks(habits: Habit[], habitLogs: HabitLog[], currentDate = today()) {
  return habits.map((habit) => {
    const logsByDate = new Map(
      habitLogs
        .filter((log) => log.habitId === habit.id)
        .map((log) => [log.date, log])
    );
    let cursor = isHabitScheduledForDate(habit, currentDate) && (logsByDate.get(currentDate)?.status === "completed" || logsByDate.get(currentDate)?.status === "protected")
      ? currentDate
      : addDays(currentDate, -1);
    let currentStreak = 0;

    while (true) {
      if (!isHabitScheduledForDate(habit, cursor)) {
        cursor = addDays(cursor, -1);
        continue;
      }
      const log = logsByDate.get(cursor);
      if (!log || (log.status !== "completed" && log.status !== "protected")) break;
      currentStreak += 1;
      cursor = addDays(cursor, -1);
    }

    let bestStreak = Math.max(habit.bestStreak ?? 0, currentStreak);
    let run = 0;
    Array.from(logsByDate.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .forEach((log) => {
        if (log.status === "completed" || log.status === "protected") {
          run += 1;
          bestStreak = Math.max(bestStreak, run);
        } else if (log.status === "missed") {
          run = 0;
        }
      });

    return { ...habit, currentStreak, bestStreak };
  });
}

function recalculateHabitXp(habits: Habit[], habitLogs: HabitLog[]) {
  const habitsById = new Map(habits.map((habit) => [habit.id, habit]));
  const streakByHabit = new Map<string, number>();

  return [...habitLogs]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((log) => {
      const habit = habitsById.get(log.habitId);
      if (!habit) return log;
      if (!isHabitScheduledForDate(habit, log.date)) return { ...log, xpDelta: 0, usedProtector: false };
      const currentRun = streakByHabit.get(log.habitId) ?? 0;
      if (log.status === "completed") {
        const nextRun = currentRun + 1;
        streakByHabit.set(log.habitId, nextRun);
        return {
          ...log,
          xpDelta: getHabitCompletionXp(nextRun, habit.baseXp, habit.streakMultiplierEnabled),
          usedProtector: false
        };
      }
      if (log.status === "protected") {
        streakByHabit.set(log.habitId, currentRun + 1);
        return { ...log, xpDelta: 0, usedProtector: true };
      }
      if (log.status === "missed") {
        streakByHabit.set(log.habitId, 0);
        return { ...log, xpDelta: -25, usedProtector: false };
      }
      return { ...log, xpDelta: 0, usedProtector: false };
    });
}

function finalizeHabitState(state: DecideLifeState, habitLogs: HabitLog[], protectors = state.protectors) {
  const oldHabitXp = state.habitLogs.reduce((sum, log) => sum + log.xpDelta, 0);
  const recalculatedLogs = recalculateHabitXp(state.habits, habitLogs);
  const newHabitXp = recalculatedLogs.reduce((sum, log) => sum + log.xpDelta, 0);
    const habits = recalculateHabitStreaks(state.habits, recalculatedLogs);
  return {
    ...state,
    profile: applyXp(state.profile, newHabitXp - oldHabitXp),
    habits,
    habitLogs: recalculatedLogs,
    protectors
  };
}

function logHabitXpChange(params: {
  action: "complete" | "uncomplete" | "miss";
  source: string;
  habitId: string;
  xpBefore: number;
  xpAfter: number;
  xpRewardApplied: number;
}) {
  console.info("[DecideLife XP]", params);
}

function closePendingPreviousDays(state: DecideLifeState) {
  const currentDate = today();
  if (compareDates(state.lastHabitReviewDate, currentDate) >= 0) return state;

  let nextLogs = [...state.habitLogs];
  let protectors = [...state.protectors];
  let cursor = state.lastHabitReviewDate;
  const activeHabits = state.habits.filter((habit) => habit.unlocked && !habit.archived);

  while (compareDates(cursor, currentDate) < 0) {
    activeHabits.filter((habit) => isHabitScheduledForDate(habit, cursor)).forEach((habit) => {
      const existing = nextLogs.find((log) => log.habitId === habit.id && log.date === cursor);
      if (existing && existing.status !== "pending") return;

      const usage = getProtectorUsageForMonth(protectors, monthForDate(cursor));
      const canProtect = usage.used < usage.totalAvailable;
      protectors = canProtect ? changeProtectorUsage(protectors, cursor, 1) : protectors;
      nextLogs = nextLogs.filter((log) => !(log.habitId === habit.id && log.date === cursor));
      nextLogs.push({
        id: existing?.id ?? `log-${habit.id}-${cursor}`,
        habitId: habit.id,
        date: cursor,
        status: canProtect ? "protected" : "missed",
        xpDelta: 0,
        usedProtector: canProtect
      });
    });
    cursor = addDays(cursor, 1);
  }

  return {
    ...finalizeHabitState(state, nextLogs, protectors),
    lastHabitReviewDate: currentDate
  };
}

export function DecideLifeProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DecideLifeState>(initialState);
  const [notification, setNotification] = useState<string | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadLocalState = () => {
      const reviewed = closePendingPreviousDays(getStoredLocalState());
      setState(reviewed);
      saveState(reviewed);
      return reviewed;
    };

    const loadOnlineState = async (user: User, fallback: DecideLifeState) => {
      try {
        console.info("[DecideLife sync] Loading Supabase state", { userId: user.id, fallbackLevel: fallback.profile.currentLevel, fallbackXp: fallback.profile.totalXp });
        const remote = await loadSupabaseState(user, attachSupabaseUser(fallback, user));
        if (cancelled) return;
        const reviewed = closePendingPreviousDays(normalizeState(remote));
        const next = attachSupabaseUser(reviewed, user);
        console.info("[DecideLife sync] Supabase state loaded", {
          userId: user.id,
          level: next.profile.currentLevel,
          xp: next.profile.totalXp,
          habits: next.habits.length,
          unlockedHabits: next.habits.filter((habit) => habit.unlocked && !habit.archived).map((habit) => ({
            id: habit.id,
            name: habit.name,
            order: habit.order,
            baseXp: habit.baseXp,
            activeDays: habit.activeDays
          }))
        });
        setState(next);
        saveState(next);
        await saveSupabaseState(user.id, next);
      } catch (error) {
        console.warn("DecideLife Supabase sync failed. Staying in local fallback mode.", error);
      } finally {
        if (!cancelled) setAuthReady(true);
      }
    };

    const localState = loadLocalState();

    if (!hasSupabaseConfig || !supabase) {
      setAuthReady(true);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      const user = data.session?.user ?? null;
      if (cancelled) return;
      setSupabaseUser(user);
      console.info("[DecideLife auth] Session checked", { authenticated: Boolean(user), userId: user?.id });
      if (user) void loadOnlineState(user, localState);
      else setAuthReady(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      setSupabaseUser(user);
      console.info("[DecideLife auth] Auth state changed", { authenticated: Boolean(user), event: _event, userId: user?.id });
      if (user) {
        setAuthReady(false);
        const reviewed = closePendingPreviousDays(getStoredLocalState());
        saveState(reviewed);
        void loadOnlineState(user, reviewed);
      } else {
        setAuthReady(true);
      }
    });

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!supabaseUser || !supabase) return;
    const supabaseClient = supabase;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let intervalId: ReturnType<typeof setInterval> | null = null;
    let cancelled = false;

    const reloadOnlineState = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const fallback = attachSupabaseUser(getStoredLocalState(), supabaseUser);
        console.info("[DecideLife sync] Remote change detected. Refreshing online state.", { userId: supabaseUser.id });
        void loadSupabaseState(supabaseUser, fallback).then((remote) => {
          if (cancelled) return;
          const reviewed = closePendingPreviousDays(normalizeState(remote));
          const next = attachSupabaseUser(reviewed, supabaseUser);
          console.info("[DecideLife sync] Remote refresh applied", {
            userId: supabaseUser.id,
            level: next.profile.currentLevel,
            xp: next.profile.totalXp,
            habits: next.habits.length,
            unlockedHabits: next.habits.filter((habit) => habit.unlocked && !habit.archived).map((habit) => ({
              id: habit.id,
              name: habit.name,
              order: habit.order,
              baseXp: habit.baseXp,
              activeDays: habit.activeDays
            }))
          });
          setState(next);
          saveState(next);
        }).catch((error) => {
          console.warn("DecideLife Supabase refresh failed.", error);
        });
      }, 700);
    };

    const channel = supabaseClient.channel(`decidelife-sync-${supabaseUser.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "habits", filter: `user_id=eq.${supabaseUser.id}` }, reloadOnlineState)
      .on("postgres_changes", { event: "*", schema: "public", table: "habit_logs", filter: `user_id=eq.${supabaseUser.id}` }, reloadOnlineState)
      .on("postgres_changes", { event: "*", schema: "public", table: "missions", filter: `user_id=eq.${supabaseUser.id}` }, reloadOnlineState)
      .on("postgres_changes", { event: "*", schema: "public", table: "user_progress", filter: `user_id=eq.${supabaseUser.id}` }, reloadOnlineState)
      .on("postgres_changes", { event: "*", schema: "public", table: "streak_protectors", filter: `user_id=eq.${supabaseUser.id}` }, reloadOnlineState)
      .subscribe((status) => {
        console.info("[DecideLife sync] Realtime subscription status", { userId: supabaseUser.id, status });
      });

    intervalId = setInterval(reloadOnlineState, 15000);

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
      void supabaseClient.removeChannel(channel);
    };
  }, [supabaseUser]);

  useEffect(() => {
    document.documentElement.dataset.theme = state.profile.theme ?? "blue";
  }, [state.profile.theme]);

  const updateState = (updater: (current: DecideLifeState) => DecideLifeState) => {
    setState((current) => {
      const next = updater(current);
      saveState(next);
      if (supabaseUser) {
        const onlineState = attachSupabaseUser(next, supabaseUser);
        console.info("[DecideLife sync] Saving Supabase state", { userId: supabaseUser.id, level: onlineState.profile.currentLevel, xp: onlineState.profile.totalXp });
        void saveSupabaseState(supabaseUser.id, onlineState).catch((error) => {
          console.warn("DecideLife Supabase save failed. Local fallback was saved.", error);
        });
      }
      return next;
    });
  };

  const completeHabit = (habitId: string, date = today(), durationMinutes?: number, source = "dashboard") => {
    updateState((current) => {
      const xpBefore = current.profile.totalXp;
      const existingLog = current.habitLogs.find((log) => log.habitId === habitId && log.date === date);
      if (existingLog?.status === "completed") return current;
      const habit = current.habits.find((item) => item.id === habitId);
      if (!habit || !habit.unlocked || habit.archived || !isHabitScheduledForDate(habit, date)) return current;

      const logs = current.habitLogs.filter((log) => !(log.habitId === habitId && log.date === date));
      const protectors = existingLog?.usedProtector ? changeProtectorUsage(current.protectors, date, -1) : current.protectors;
      let next = finalizeHabitState(
        current,
        [...logs, { id: existingLog?.id ?? `log-${habitId}-${date}`, habitId, date, status: "completed", xpDelta: 0, usedProtector: false, durationMinutes }],
        protectors
      );

      const completedHabit = next.habits.find((item) => item.id === habitId);
      if (completedHabit && completedHabit.currentStreak >= 7) {
        const unlockResult = unlockNextHabit(next.habits);
        next = { ...next, habits: unlockResult.habits };
        if (unlockResult.unlockedHabitName) setNotification(`Habit Unlocked: ${unlockResult.unlockedHabitName}`);
      }

      const appliedLog = next.habitLogs.find((log) => log.habitId === habitId && log.date === date);
      logHabitXpChange({
        action: "complete",
        source,
        habitId,
        xpBefore,
        xpAfter: next.profile.totalXp,
        xpRewardApplied: appliedLog?.xpDelta ?? next.profile.totalXp - xpBefore
      });
      return next;
    });
  };

  const uncompleteHabit = (habitId: string, date = today(), source = "dashboard") => {
    updateState((current) => {
      const xpBefore = current.profile.totalXp;
      const existingLog = current.habitLogs.find((log) => log.habitId === habitId && log.date === date);
      if (!existingLog || existingLog.status !== "completed") return current;
      const nextLogs = current.habitLogs.filter((log) => !(log.habitId === habitId && log.date === date));
      const next = finalizeHabitState(current, nextLogs, current.protectors);
      logHabitXpChange({
        action: "uncomplete",
        source,
        habitId,
        xpBefore,
        xpAfter: next.profile.totalXp,
        xpRewardApplied: next.profile.totalXp - xpBefore
      });
      return next;
    });
  };

  const missHabit = (habitId: string, date = today(), source = "dashboard") => {
    updateState((current) => {
      const xpBefore = current.profile.totalXp;
      const existingLog = current.habitLogs.find((log) => log.habitId === habitId && log.date === date);
      if (existingLog?.status === "missed") return current;
      const habit = current.habits.find((item) => item.id === habitId);
      if (!habit || !habit.unlocked || habit.archived || !isHabitScheduledForDate(habit, date)) return current;

      const logs = current.habitLogs.filter((log) => !(log.habitId === habitId && log.date === date));
      const protectors = existingLog?.usedProtector ? changeProtectorUsage(current.protectors, date, -1) : current.protectors;
      const next = finalizeHabitState(
        current,
        [...logs, { id: existingLog?.id ?? `log-${habitId}-${date}`, habitId, date, status: "missed", xpDelta: 0, usedProtector: false }],
        protectors
      );
      logHabitXpChange({
        action: "miss",
        source,
        habitId,
        xpBefore,
        xpAfter: next.profile.totalXp,
        xpRewardApplied: next.profile.totalXp - xpBefore
      });
      return next;
    });
  };

  const saveHabit = (habit: Habit) => {
    updateState((current) => {
      const normalizedHabit: Habit = {
        ...habit,
        baseXp: Number(habit.baseXp) || 100,
        order: Number(habit.order) || current.habits.length + 1,
        currentStreak: habit.currentStreak ?? 0,
        bestStreak: habit.bestStreak ?? 0,
        streakMultiplierEnabled: habit.streakMultiplierEnabled ?? true,
        archived: habit.archived ?? false,
        activeDays: habit.activeDays?.length ? habit.activeDays : [0, 1, 2, 3, 4, 5, 6],
        reminderTime: habit.reminderTime,
        sessionMinutes: habit.sessionMinutes
      };
      const exists = current.habits.some((item) => item.id === normalizedHabit.id);
      const habits = exists
        ? current.habits.map((item) => (item.id === normalizedHabit.id ? normalizedHabit : item))
        : [...current.habits, normalizedHabit];
      const nextState = { ...current, habits: habits.sort((a, b) => a.order - b.order) };
      return finalizeHabitState(nextState, nextState.habitLogs, nextState.protectors);
    });
  };

  const archiveHabit = (habitId: string) => {
    updateState((current) => ({
      ...current,
      habits: current.habits.map((habit) => (habit.id === habitId ? { ...habit, archived: true, unlocked: false } : habit))
    }));
  };

  const completeMission = (missionId: string) => {
    updateState((current) => {
      const mission = current.missions.find((item) => item.id === missionId);
      if (!mission || mission.locked || mission.completed || mission.archived) return current;
      const missions = unlockMissions(
        current.missions.map((item) => {
          if (item.id === missionId) return { ...item, completed: true };
          if (mission.unlocksMissionIds.includes(item.id)) return { ...item, locked: false };
          return item;
        })
      );

      return {
        ...current,
        profile: applyXp(current.profile, mission.xpReward),
        missions
      };
    });
  };

  const saveMission = (mission: Mission) => {
    updateState((current) => {
      const normalizedMission: Mission = {
        ...mission,
        xpReward: Number(mission.xpReward) || 250,
        prerequisites: mission.prerequisites ?? [],
        unlocksMissionIds: mission.unlocksMissionIds ?? [],
        archived: mission.archived ?? false
      };
      const exists = current.missions.some((item) => item.id === normalizedMission.id);
      const missions = exists
        ? current.missions.map((item) => (item.id === normalizedMission.id ? normalizedMission : item))
        : [...current.missions, normalizedMission];
      return { ...current, missions: unlockMissions(missions) };
    });
  };

  const archiveMission = (missionId: string) => {
    updateState((current) => ({
      ...current,
      missions: current.missions.map((mission) => (mission.id === missionId ? { ...mission, archived: true } : mission))
    }));
  };

  const saveJournalEntry = (entry: JournalEntry) => {
    updateState((current) => {
      const entries = current.journalEntries.some((item) => item.id === entry.id)
        ? current.journalEntries.map((item) => (item.id === entry.id ? entry : item))
        : [entry, ...current.journalEntries];
      return { ...current, journalEntries: entries };
    });
  };

  const deleteJournalEntry = (entryId: string) => {
    updateState((current) => ({
      ...current,
      journalEntries: current.journalEntries.filter((entry) => entry.id !== entryId)
    }));
  };

  const setTheme = (theme: AppTheme) => {
    updateState((current) => ({
      ...current,
      profile: { ...current.profile, theme }
    }));
  };

  const setTradingAccountType = (accountType: UserProfile["tradingAccountType"]) => {
    updateState((current) => ({
      ...current,
      profile: { ...current.profile, tradingAccountType: accountType }
    }));
  };

  const saveTradingJournalEntry = (entry: TradingJournalEntry) => {
    updateState((current) => {
      const entries = current.tradingJournalEntries.some((item) => item.id === entry.id)
        ? current.tradingJournalEntries.map((item) => (item.id === entry.id ? entry : item))
        : [entry, ...current.tradingJournalEntries];
      return { ...current, tradingJournalEntries: entries };
    });
  };

  const saveTradingNote = (note: TradingNote) => {
    updateState((current) => {
      const notes = current.tradingNotes.some((item) => item.id === note.id)
        ? current.tradingNotes.map((item) => (item.id === note.id ? note : item))
        : [note, ...current.tradingNotes];
      return { ...current, tradingNotes: notes };
    });
  };

  const deleteTradingNote = (noteId: string) => {
    updateState((current) => ({
      ...current,
      tradingNotes: current.tradingNotes.filter((note) => note.id !== noteId)
    }));
  };

  const saveTradingRule = (rule: TradingRule) => {
    updateState((current) => {
      const rules = current.tradingRules.some((item) => item.id === rule.id)
        ? current.tradingRules.map((item) => (item.id === rule.id ? rule : item))
        : [rule, ...current.tradingRules];
      return { ...current, tradingRules: rules };
    });
  };

  const savePersonalQuote = (quote: PersonalQuote) => {
    updateState((current) => {
      const quotes = current.personalQuotes.some((item) => item.id === quote.id)
        ? current.personalQuotes.map((item) => (item.id === quote.id ? quote : item))
        : [quote, ...current.personalQuotes];
      return { ...current, personalQuotes: quotes };
    });
  };

  const deletePersonalQuote = (quoteId: string) => {
    updateState((current) => ({
      ...current,
      personalQuotes: current.personalQuotes.filter((quote) => quote.id !== quoteId)
    }));
  };

  const saveJourneyMilestone = (milestone: JourneyMilestone) => {
    updateState((current) => {
      const milestones = current.journeyMilestones.some((item) => item.id === milestone.id)
        ? current.journeyMilestones.map((item) => (item.id === milestone.id ? milestone : item))
        : [milestone, ...current.journeyMilestones];
      return { ...current, journeyMilestones: milestones };
    });
  };

  const deleteJourneyMilestone = (milestoneId: string) => {
    updateState((current) => ({
      ...current,
      journeyMilestones: current.journeyMilestones.filter((milestone) => milestone.id !== milestoneId)
    }));
  };

  const markMorningBriefViewed = (date: string) => {
    updateState((current) => ({
      ...current,
      profile: { ...current.profile, lastMorningBriefDate: date }
    }));
  };

  const awardDailyVictory = (date: string) => {
    updateState((current) => {
      if (current.profile.lastDailyVictoryDate === date) return current;
      return {
        ...current,
        profile: applyXp({ ...current.profile, lastDailyVictoryDate: date }, current.profile.dailyBonusXp ?? 50)
      };
    });
  };

  const resetAppData = () => {
    const freshState = supabaseUser ? attachSupabaseUser(createFreshState(), supabaseUser) : createFreshState();
    setNotification(null);
    setState(freshState);
    saveState(freshState);
    if (supabaseUser) {
      void saveSupabaseState(supabaseUser.id, freshState).catch((error) => {
        console.warn("DecideLife Supabase reset save failed. Local fallback was reset.", error);
      });
    }
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(freshState));
      window.location.assign("/dashboard");
    }
  };

  const resetDecideLife = () => {
    const freshState = supabaseUser ? attachSupabaseUser(createFreshState(), supabaseUser) : createFreshState();
    setNotification(null);
    setState(freshState);
    saveState(freshState);
    if (supabaseUser) {
      void saveSupabaseState(supabaseUser.id, freshState).catch((error) => {
        console.warn("DecideLife Supabase reset save failed. Local fallback was reset.", error);
      });
    }
  };

  // TEMP TESTING FEATURE - remove before final release.
  // This is visual-only: habit completion/miss calculations still use log-derived streaks.
  const setHabitTestingStreakOverride = (habitId: string, streak: number) => {
    updateState((current) => ({
      ...current,
      habits: current.habits.map((habit) =>
        habit.id === habitId ? { ...habit, testingStreakOverride: Math.max(0, Math.floor(streak)) } : habit
      )
    }));
  };

  // TEMP TESTING FEATURE - remove before final release.
  const clearHabitTestingStreakOverride = (habitId: string) => {
    updateState((current) => ({
      ...current,
      habits: current.habits.map((habit) => {
        if (habit.id !== habitId) return habit;
        const { testingStreakOverride, ...habitWithoutOverride } = habit;
        return habitWithoutOverride;
      })
    }));
  };

  const value = useMemo<DecideLifeContextValue>(() => {
    const currentUsage = getProtectorUsageForCurrentMonth(state.protectors);
    const todayDate = today();
    const todayCompletedHabitIds = state.habitLogs
      .filter((log) => log.date === todayDate && log.status === "completed")
      .filter((log) => {
        const habit = state.habits.find((item) => item.id === log.habitId);
        return habit ? isHabitScheduledForDate(habit, todayDate) : false;
      })
      .map((log) => log.habitId);

    return {
      ...state,
      levelProgress: calculateLevelProgress(state.profile.totalXp, state.profile.highestLevelReached),
      todayCompletedHabitIds,
      protectorsRemaining: Math.max(0, currentUsage.totalAvailable - currentUsage.used),
      notification,
      authReady,
      isAuthenticated: Boolean(supabaseUser),
      completeHabit,
      uncompleteHabit,
      missHabit,
      saveHabit,
      archiveHabit,
      completeMission,
      saveMission,
      archiveMission,
      dismissNotification: () => setNotification(null),
      saveJournalEntry,
      deleteJournalEntry,
      resetAppData,
      resetDecideLife,
      setTheme,
      setTradingAccountType,
      saveTradingJournalEntry,
      saveTradingNote,
      deleteTradingNote,
      saveTradingRule,
      savePersonalQuote,
      deletePersonalQuote,
      saveJourneyMilestone,
      deleteJourneyMilestone,
      markMorningBriefViewed,
      awardDailyVictory,
      setHabitTestingStreakOverride,
      clearHabitTestingStreakOverride
    };
  }, [state, notification, supabaseUser, authReady]);

  return <DecideLifeContext.Provider value={value}>{children}</DecideLifeContext.Provider>;
}

export function useDecideLife() {
  const context = useContext(DecideLifeContext);
  if (!context) throw new Error("useDecideLife must be used inside DecideLifeProvider");
  return context;
}
