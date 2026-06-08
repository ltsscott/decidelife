import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { Habit, HabitLog, JournalEntry, Mission, StreakProtectorUsage, UserProfile } from "@/types";

export interface DecideLifeRemoteState {
  profile: UserProfile;
  habits: Habit[];
  habitLogs: HabitLog[];
  missions: Mission[];
  journalEntries: JournalEntry[];
  protectors: StreakProtectorUsage[];
  lastHabitReviewDate: string;
}

type HabitRow = {
  id: string;
  user_id: string;
  name: string;
  description: string;
  order_position: number;
  unlocked: boolean;
  current_streak: number;
  best_streak: number;
  category: string;
  base_xp: number;
  prerequisite_habit_id: string | null;
  streak_multiplier_enabled: boolean;
  archived: boolean;
  testing_streak_override: number | null;
};

type HabitLogRow = {
  id: string;
  user_id: string;
  habit_id: string;
  date: string;
  status: HabitLog["status"];
  xp_delta: number;
  used_protector: boolean;
};

type MissionRow = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: Mission["category"];
  xp_reward: number;
  type: Mission["type"];
  locked: boolean;
  completed: boolean;
  prerequisites: string[] | null;
  unlocks_mission_ids: string[] | null;
  archived: boolean;
};

type JournalEntryRow = {
  id: string;
  user_id: string;
  date: string;
  title: string;
  mood: JournalEntry["mood"];
  tags: string[] | null;
  body: string;
  updated_at: string;
};

type ProtectorRow = {
  id: string;
  user_id: string;
  month: string;
  total_available: number;
  used: number;
};

function withUserProfile(profile: UserProfile, user: User): UserProfile {
  return {
    ...profile,
    id: user.id,
    email: user.email ?? profile.email
  };
}

function habitToRow(habit: Habit, userId: string): HabitRow {
  return {
    id: habit.id,
    user_id: userId,
    name: habit.name,
    description: habit.description,
    order_position: habit.order,
    unlocked: habit.unlocked,
    current_streak: habit.currentStreak,
    best_streak: habit.bestStreak,
    category: habit.category,
    base_xp: habit.baseXp,
    prerequisite_habit_id: habit.prerequisiteHabitId ?? null,
    streak_multiplier_enabled: habit.streakMultiplierEnabled,
    archived: habit.archived,
    testing_streak_override: habit.testingStreakOverride ?? null
  };
}

function rowToHabit(row: HabitRow): Habit {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    order: row.order_position,
    unlocked: row.unlocked,
    currentStreak: row.current_streak,
    bestStreak: row.best_streak,
    category: row.category,
    baseXp: row.base_xp,
    prerequisiteHabitId: row.prerequisite_habit_id ?? undefined,
    streakMultiplierEnabled: row.streak_multiplier_enabled,
    archived: row.archived,
    testingStreakOverride: row.testing_streak_override ?? undefined
  };
}

function habitLogToRow(log: HabitLog, userId: string): HabitLogRow {
  return {
    id: log.id,
    user_id: userId,
    habit_id: log.habitId,
    date: log.date,
    status: log.status,
    xp_delta: log.xpDelta,
    used_protector: log.usedProtector
  };
}

function rowToHabitLog(row: HabitLogRow): HabitLog {
  return {
    id: row.id,
    habitId: row.habit_id,
    date: row.date,
    status: row.status,
    xpDelta: row.xp_delta,
    usedProtector: row.used_protector
  };
}

function missionToRow(mission: Mission, userId: string): MissionRow {
  return {
    id: mission.id,
    user_id: userId,
    title: mission.title,
    description: mission.description,
    category: mission.category,
    xp_reward: mission.xpReward,
    type: mission.type,
    locked: mission.locked,
    completed: mission.completed,
    prerequisites: mission.prerequisites,
    unlocks_mission_ids: mission.unlocksMissionIds,
    archived: mission.archived
  };
}

function rowToMission(row: MissionRow): Mission {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    xpReward: row.xp_reward,
    type: row.type,
    locked: row.locked,
    completed: row.completed,
    prerequisites: row.prerequisites ?? [],
    unlocksMissionIds: row.unlocks_mission_ids ?? [],
    archived: row.archived
  };
}

function journalEntryToRow(entry: JournalEntry, userId: string): JournalEntryRow {
  return {
    id: entry.id,
    user_id: userId,
    date: entry.date,
    title: entry.title,
    mood: entry.mood,
    tags: entry.tags,
    body: entry.body,
    updated_at: entry.updatedAt
  };
}

function rowToJournalEntry(row: JournalEntryRow): JournalEntry {
  return {
    id: row.id,
    date: row.date,
    title: row.title,
    mood: row.mood,
    tags: row.tags ?? [],
    body: row.body,
    updatedAt: row.updated_at
  };
}

function protectorToRow(usage: StreakProtectorUsage, userId: string): ProtectorRow {
  return {
    id: usage.id,
    user_id: userId,
    month: usage.month,
    total_available: usage.totalAvailable,
    used: usage.used
  };
}

function rowToProtector(row: ProtectorRow): StreakProtectorUsage {
  return {
    id: row.id,
    userId: row.user_id,
    month: row.month,
    totalAvailable: row.total_available,
    used: row.used
  };
}

export async function loadSupabaseState(user: User, fallback: DecideLifeRemoteState) {
  if (!supabase) return fallback;

  const [
    profileResult,
    progressResult,
    habitsResult,
    logsResult,
    missionsResult,
    journalResult,
    protectorsResult
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("user_progress").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("habits").select("*").eq("user_id", user.id).order("order_position"),
    supabase.from("habit_logs").select("*").eq("user_id", user.id).order("date"),
    supabase.from("missions").select("*").eq("user_id", user.id),
    supabase.from("journal_entries").select("*").eq("user_id", user.id).order("date", { ascending: false }),
    supabase.from("streak_protectors").select("*").eq("user_id", user.id)
  ]);

  if (
    !profileResult.data &&
    !progressResult.data &&
    !habitsResult.data?.length &&
    !missionsResult.data?.length &&
    !journalResult.data?.length
  ) {
    const seeded = {
      ...fallback,
      profile: withUserProfile(fallback.profile, user),
      protectors: fallback.protectors.map((usage) => ({ ...usage, userId: user.id }))
    };
    await saveSupabaseState(user.id, seeded);
    return seeded;
  }

  const progress = progressResult.data;
  const profile = withUserProfile(
    {
      ...fallback.profile,
      displayName: profileResult.data?.display_name ?? fallback.profile.displayName,
      email: profileResult.data?.email ?? user.email ?? fallback.profile.email,
      totalXp: progress?.total_xp ?? fallback.profile.totalXp,
      currentLevel: progress?.current_level ?? fallback.profile.currentLevel,
      highestLevelReached: progress?.highest_level_reached ?? fallback.profile.highestLevelReached,
      currentTitle: progress?.current_title ?? fallback.profile.currentTitle,
      createdAt: profileResult.data?.created_at ?? fallback.profile.createdAt
    },
    user
  );

  return {
    profile,
    habits: habitsResult.data?.length ? (habitsResult.data as HabitRow[]).map(rowToHabit) : fallback.habits,
    habitLogs: logsResult.data?.length ? (logsResult.data as HabitLogRow[]).map(rowToHabitLog) : fallback.habitLogs,
    missions: missionsResult.data?.length ? (missionsResult.data as MissionRow[]).map(rowToMission) : fallback.missions,
    journalEntries: journalResult.data?.length ? (journalResult.data as JournalEntryRow[]).map(rowToJournalEntry) : fallback.journalEntries,
    protectors: protectorsResult.data?.length ? (protectorsResult.data as ProtectorRow[]).map(rowToProtector) : fallback.protectors,
    lastHabitReviewDate: progress?.last_habit_review_date ?? fallback.lastHabitReviewDate
  };
}

export async function saveSupabaseState(userId: string, state: DecideLifeRemoteState) {
  if (!supabase) return;

  const profile = {
    id: userId,
    display_name: state.profile.displayName,
    email: state.profile.email ?? null,
    current_level: state.profile.currentLevel,
    total_xp: state.profile.totalXp,
    highest_level_reached: state.profile.highestLevelReached,
    current_title: state.profile.currentTitle,
    created_at: state.profile.createdAt,
    updated_at: new Date().toISOString()
  };

  const progress = {
    user_id: userId,
    total_xp: state.profile.totalXp,
    current_level: state.profile.currentLevel,
    highest_level_reached: state.profile.highestLevelReached,
    current_title: state.profile.currentTitle,
    last_habit_review_date: state.lastHabitReviewDate,
    updated_at: new Date().toISOString()
  };

  await supabase.from("profiles").upsert(profile);
  await supabase.from("user_progress").upsert(progress);

  await Promise.all([
    supabase.from("habit_logs").delete().eq("user_id", userId),
    supabase.from("habits").delete().eq("user_id", userId),
    supabase.from("missions").delete().eq("user_id", userId),
    supabase.from("journal_entries").delete().eq("user_id", userId),
    supabase.from("streak_protectors").delete().eq("user_id", userId)
  ]);

  await Promise.all([
    state.habits.length ? supabase.from("habits").insert(state.habits.map((habit) => habitToRow(habit, userId))) : Promise.resolve(),
    state.habitLogs.length ? supabase.from("habit_logs").insert(state.habitLogs.map((log) => habitLogToRow(log, userId))) : Promise.resolve(),
    state.missions.length ? supabase.from("missions").insert(state.missions.map((mission) => missionToRow(mission, userId))) : Promise.resolve(),
    state.journalEntries.length ? supabase.from("journal_entries").insert(state.journalEntries.map((entry) => journalEntryToRow(entry, userId))) : Promise.resolve(),
    state.protectors.length ? supabase.from("streak_protectors").insert(state.protectors.map((usage) => protectorToRow(usage, userId))) : Promise.resolve()
  ]);
}
