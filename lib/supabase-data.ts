import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { Habit, HabitLog, JournalEntry, JourneyMilestone, Mission, PersonalQuote, StreakProtectorUsage, TradingJournalEntry, TradingNote, TradingRule, UserProfile } from "@/types";

export interface DecideLifeRemoteState {
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

const WIDGET_TABLES = ["profiles", "user_progress", "habits", "habit_logs", "missions", "streak_protectors"];
const WIDGET_SKIPPED_TABLES = [
  "journal_entries",
  "personal_quotes",
  "trading_journal_entries",
  "trading_notes",
  "trading_rules",
  "journey_milestones"
];

interface LoadSupabaseStateOptions {
  route?: string;
  includeTrading?: boolean;
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
  active_days: number[] | null;
  reminder_time: string | null;
  session_minutes: number | null;
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

type TradingJournalRow = {
  id: string;
  user_id: string;
  date: string;
  account_type: UserProfile["tradingAccountType"];
  profit_loss: number;
  trade_count: number;
  execution_score: number;
  a_plus_setups: number;
  session: string;
  pairs: string;
  screenshots: string[] | null;
  general_notes: string;
  followed_rules: boolean;
  overtraded: boolean;
  moved_stop_loss: boolean;
  emotions_affected: boolean;
  biggest_mistake: string;
  best_decision: string;
  improve_tomorrow: string;
  detailed_review: TradingJournalEntry["detailedReview"];
  mistake_tags: string[] | null;
  positive_tags: string[] | null;
  broken_rule_ids: string[] | null;
  average_rr: number;
  wins: number;
  losses: number;
  updated_at: string;
};

type TradingNoteRow = {
  id: string;
  user_id: string;
  date: string;
  body: string;
  created_at: string;
};

type TradingRuleRow = {
  id: string;
  user_id: string;
  text: string;
  archived: boolean;
  created_at: string;
};

type PersonalQuoteRow = {
  id: string;
  user_id: string;
  text: string;
  created_at: string;
};

type JourneyMilestoneRow = {
  id: string;
  user_id: string;
  date: string;
  title: string;
  type: JourneyMilestone["type"];
  notes: string;
  photo: string | null;
  created_at: string;
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
    testing_streak_override: habit.testingStreakOverride ?? null,
    active_days: habit.activeDays,
    reminder_time: habit.reminderTime ?? null,
    session_minutes: habit.sessionMinutes ?? null
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
    testingStreakOverride: row.testing_streak_override ?? undefined,
    activeDays: row.active_days?.length ? row.active_days : [0, 1, 2, 3, 4, 5, 6],
    reminderTime: row.reminder_time ?? undefined,
    sessionMinutes: row.session_minutes ?? undefined
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

function tradingJournalToRow(entry: TradingJournalEntry, userId: string): TradingJournalRow {
  return {
    id: entry.id,
    user_id: userId,
    date: entry.date,
    account_type: entry.accountType,
    profit_loss: entry.profitLoss,
    trade_count: entry.tradeCount,
    execution_score: entry.executionScore,
    a_plus_setups: entry.aPlusSetups,
    session: entry.session,
    pairs: entry.pairs,
    screenshots: entry.screenshots,
    general_notes: entry.generalNotes,
    followed_rules: entry.followedRules,
    overtraded: entry.overtraded,
    moved_stop_loss: entry.movedStopLoss,
    emotions_affected: entry.emotionsAffected,
    biggest_mistake: entry.biggestMistake,
    best_decision: entry.bestDecision,
    improve_tomorrow: entry.improveTomorrow,
    detailed_review: entry.detailedReview,
    mistake_tags: entry.mistakeTags,
    positive_tags: entry.positiveTags,
    broken_rule_ids: entry.brokenRuleIds,
    average_rr: entry.averageRr,
    wins: entry.wins,
    losses: entry.losses,
    updated_at: entry.updatedAt
  };
}

function rowToTradingJournal(row: TradingJournalRow): TradingJournalEntry {
  return {
    id: row.id,
    date: row.date,
    accountType: row.account_type,
    profitLoss: row.profit_loss,
    tradeCount: row.trade_count,
    executionScore: row.execution_score,
    aPlusSetups: row.a_plus_setups,
    session: row.session,
    pairs: row.pairs,
    screenshots: row.screenshots ?? [],
    generalNotes: row.general_notes,
    followedRules: row.followed_rules,
    overtraded: row.overtraded,
    movedStopLoss: row.moved_stop_loss,
    emotionsAffected: row.emotions_affected,
    biggestMistake: row.biggest_mistake,
    bestDecision: row.best_decision,
    improveTomorrow: row.improve_tomorrow,
    detailedReview: row.detailed_review ?? {
      preMarket: "",
      tradePlanning: "",
      duringTrade: "",
      afterTrade: "",
      endOfDay: "",
      improvementFocus: ""
    },
    mistakeTags: row.mistake_tags ?? [],
    positiveTags: row.positive_tags ?? [],
    brokenRuleIds: row.broken_rule_ids ?? [],
    averageRr: row.average_rr,
    wins: row.wins,
    losses: row.losses,
    updatedAt: row.updated_at
  };
}

function tradingNoteToRow(note: TradingNote, userId: string): TradingNoteRow {
  return {
    id: note.id,
    user_id: userId,
    date: note.date,
    body: note.body,
    created_at: note.createdAt
  };
}

function rowToTradingNote(row: TradingNoteRow): TradingNote {
  return {
    id: row.id,
    date: row.date,
    body: row.body,
    createdAt: row.created_at
  };
}

function tradingRuleToRow(rule: TradingRule, userId: string): TradingRuleRow {
  return {
    id: rule.id,
    user_id: userId,
    text: rule.text,
    archived: rule.archived,
    created_at: rule.createdAt
  };
}

function rowToTradingRule(row: TradingRuleRow): TradingRule {
  return {
    id: row.id,
    text: row.text,
    archived: row.archived,
    createdAt: row.created_at
  };
}

function quoteToRow(quote: PersonalQuote, userId: string): PersonalQuoteRow {
  return {
    id: quote.id,
    user_id: userId,
    text: quote.text,
    created_at: quote.createdAt
  };
}

function rowToQuote(row: PersonalQuoteRow): PersonalQuote {
  return {
    id: row.id,
    text: row.text,
    createdAt: row.created_at
  };
}

function milestoneToRow(milestone: JourneyMilestone, userId: string): JourneyMilestoneRow {
  return {
    id: milestone.id,
    user_id: userId,
    date: milestone.date,
    title: milestone.title,
    type: milestone.type,
    notes: milestone.notes,
    photo: milestone.photo ?? null,
    created_at: milestone.createdAt
  };
}

function rowToMilestone(row: JourneyMilestoneRow): JourneyMilestone {
  return {
    id: row.id,
    date: row.date,
    title: row.title,
    type: row.type,
    notes: row.notes,
    photo: row.photo ?? undefined,
    createdAt: row.created_at
  };
}

function isMissingTableError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const maybeError = error as { code?: string; message?: string; details?: string; hint?: string };
  return maybeError.code === "PGRST205" ||
    `${maybeError.message ?? ""} ${maybeError.details ?? ""} ${maybeError.hint ?? ""}`.includes("Could not find the table");
}

function logSupabaseTableRequest(label: string, route: string, error: unknown, count?: number) {
  if (error) {
    console.warn("[DecideLife sync] Supabase table query failed", { route, table: label, error });
    return;
  }
  console.info("[DecideLife sync] Supabase table query succeeded", { route, table: label, count: count ?? 0 });
}

function throwIfSupabaseError(label: string, error: unknown) {
  if (!error) return;
  throw new Error(`Supabase ${label} query failed: ${JSON.stringify(error)}`);
}

function throwIfRequiredWidgetError(label: string, error: unknown) {
  if (!error) return;
  throw new Error(`Supabase widget ${label} query failed: ${JSON.stringify(error)}`);
}

async function runOptionalWidgetQuery<T>(label: string, route: string, query: PromiseLike<{ data: T | null; error: unknown }>, fallback: T) {
  const result = await query;
  logSupabaseTableRequest(label, route, result.error, Array.isArray(result.data) ? result.data.length : result.data ? 1 : 0);
  if (result.error) {
    console.warn("[DecideLife widget sync] Optional table unavailable. Continuing widget load.", { route, table: label, error: result.error });
    return fallback;
  }
  return result.data ?? fallback;
}

export async function loadWidgetState(user: User, fallback: DecideLifeRemoteState) {
  if (!supabase) return fallback;
  const route = "/widget";
  console.info("[DecideLife widget sync] Loading lightweight widget state", {
    route,
    userId: user.id,
    tables: WIDGET_TABLES,
    skippedTables: WIDGET_SKIPPED_TABLES
  });

  const [
    profileResult,
    progressResult,
    habitsResult,
    logsResult,
    missionsResult
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("user_progress").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("habits").select("*").eq("user_id", user.id).order("order_position"),
    supabase.from("habit_logs").select("*").eq("user_id", user.id).order("date"),
    supabase.from("missions").select("*").eq("user_id", user.id)
  ]);

  logSupabaseTableRequest("profiles", route, profileResult.error, profileResult.data ? 1 : 0);
  logSupabaseTableRequest("user_progress", route, progressResult.error, progressResult.data ? 1 : 0);
  logSupabaseTableRequest("habits", route, habitsResult.error, habitsResult.data?.length ?? 0);
  logSupabaseTableRequest("habit_logs", route, logsResult.error, logsResult.data?.length ?? 0);
  logSupabaseTableRequest("missions", route, missionsResult.error, missionsResult.data?.length ?? 0);
  console.info("[DecideLife widget sync] Skipped optional tables", { route, skippedTables: WIDGET_SKIPPED_TABLES });

  throwIfRequiredWidgetError("profiles", profileResult.error);
  throwIfRequiredWidgetError("user_progress", progressResult.error);
  throwIfRequiredWidgetError("habits", habitsResult.error);
  throwIfRequiredWidgetError("habit_logs", logsResult.error);
  throwIfRequiredWidgetError("missions", missionsResult.error);

  const protectors = await runOptionalWidgetQuery(
    "streak_protectors",
    route,
    supabase.from("streak_protectors").select("*").eq("user_id", user.id),
    []
  );

  if (
    !profileResult.data &&
    !progressResult.data &&
    !habitsResult.data?.length &&
    !missionsResult.data?.length
  ) {
    const seeded = {
      ...fallback,
      profile: withUserProfile(fallback.profile, user),
      protectors: fallback.protectors.map((usage) => ({ ...usage, userId: user.id }))
    };
    await saveWidgetState(user.id, seeded);
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
      createdAt: profileResult.data?.created_at ?? fallback.profile.createdAt,
      theme: profileResult.data?.theme ?? fallback.profile.theme,
      tradingAccountType: profileResult.data?.trading_account_type ?? fallback.profile.tradingAccountType,
      dailyBonusXp: profileResult.data?.daily_bonus_xp ?? fallback.profile.dailyBonusXp,
      reflectionReminderTime: profileResult.data?.reflection_reminder_time ?? fallback.profile.reflectionReminderTime,
      lastMorningBriefDate: profileResult.data?.last_morning_brief_date ?? fallback.profile.lastMorningBriefDate,
      lastDailyVictoryDate: profileResult.data?.last_daily_victory_date ?? fallback.profile.lastDailyVictoryDate
    },
    user
  );

  return {
    ...fallback,
    profile,
    habits: ((habitsResult.data ?? []) as HabitRow[]).map(rowToHabit),
    habitLogs: ((logsResult.data ?? []) as HabitLogRow[]).map(rowToHabitLog),
    missions: ((missionsResult.data ?? []) as MissionRow[]).map(rowToMission),
    protectors: ((protectors ?? []) as ProtectorRow[]).map(rowToProtector),
    lastHabitReviewDate: progress?.last_habit_review_date ?? fallback.lastHabitReviewDate
  };
}

export async function loadSupabaseState(user: User, fallback: DecideLifeRemoteState, options: LoadSupabaseStateOptions = {}) {
  if (!supabase) return fallback;
  const route = options.route ?? "unknown";
  const includeTrading = options.includeTrading ?? route !== "/widget";
  console.info("[DecideLife sync] Loading Supabase state", { route, includeTrading, userId: user.id });

  const [
    profileResult,
    progressResult,
    habitsResult,
    logsResult,
    missionsResult,
    journalResult,
    protectorsResult,
    quotesResult,
    milestonesResult
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("user_progress").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("habits").select("*").eq("user_id", user.id).order("order_position"),
    supabase.from("habit_logs").select("*").eq("user_id", user.id).order("date"),
    supabase.from("missions").select("*").eq("user_id", user.id),
    supabase.from("journal_entries").select("*").eq("user_id", user.id).order("date", { ascending: false }),
    supabase.from("streak_protectors").select("*").eq("user_id", user.id),
    supabase.from("personal_quotes").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("journey_milestones").select("*").eq("user_id", user.id).order("date", { ascending: false })
  ]);

  let tradingJournalResult: { data: unknown[] | null; error: unknown } = { data: includeTrading ? fallback.tradingJournalEntries : [], error: null };
  let tradingNotesResult: { data: unknown[] | null; error: unknown } = { data: includeTrading ? fallback.tradingNotes : [], error: null };
  let tradingRulesResult: { data: unknown[] | null; error: unknown } = { data: includeTrading ? fallback.tradingRules : [], error: null };

  if (includeTrading) {
    const [journal, notes, rules] = await Promise.all([
      supabase.from("trading_journal_entries").select("*").eq("user_id", user.id).order("date", { ascending: false }),
      supabase.from("trading_notes").select("*").eq("user_id", user.id).order("date", { ascending: false }),
      supabase.from("trading_rules").select("*").eq("user_id", user.id)
    ]);
    tradingJournalResult = journal;
    tradingNotesResult = notes;
    tradingRulesResult = rules;
  } else {
    console.info("[DecideLife sync] Skipping trading tables for route", { route, tables: ["trading_journal_entries", "trading_notes", "trading_rules"] });
  }

  logSupabaseTableRequest("profiles", route, profileResult.error, profileResult.data ? 1 : 0);
  logSupabaseTableRequest("user_progress", route, progressResult.error, progressResult.data ? 1 : 0);
  logSupabaseTableRequest("habits", route, habitsResult.error, habitsResult.data?.length ?? 0);
  logSupabaseTableRequest("habit_logs", route, logsResult.error, logsResult.data?.length ?? 0);
  logSupabaseTableRequest("missions", route, missionsResult.error, missionsResult.data?.length ?? 0);
  logSupabaseTableRequest("journal_entries", route, journalResult.error, journalResult.data?.length ?? 0);
  logSupabaseTableRequest("streak_protectors", route, protectorsResult.error, protectorsResult.data?.length ?? 0);
  if (includeTrading) {
    logSupabaseTableRequest("trading_journal_entries", route, tradingJournalResult.error, tradingJournalResult.data?.length ?? 0);
    logSupabaseTableRequest("trading_notes", route, tradingNotesResult.error, tradingNotesResult.data?.length ?? 0);
    logSupabaseTableRequest("trading_rules", route, tradingRulesResult.error, tradingRulesResult.data?.length ?? 0);
  }
  logSupabaseTableRequest("personal_quotes", route, quotesResult.error, quotesResult.data?.length ?? 0);
  logSupabaseTableRequest("journey_milestones", route, milestonesResult.error, milestonesResult.data?.length ?? 0);

  throwIfSupabaseError("profiles", profileResult.error);
  throwIfSupabaseError("user_progress", progressResult.error);
  throwIfSupabaseError("habits", habitsResult.error);
  throwIfSupabaseError("habit_logs", logsResult.error);
  throwIfSupabaseError("missions", missionsResult.error);
  if (journalResult.error && !isMissingTableError(journalResult.error)) throwIfSupabaseError("journal_entries", journalResult.error);
  if (protectorsResult.error && !isMissingTableError(protectorsResult.error)) throwIfSupabaseError("streak_protectors", protectorsResult.error);
  if (includeTrading && tradingJournalResult.error && !isMissingTableError(tradingJournalResult.error)) throwIfSupabaseError("trading_journal_entries", tradingJournalResult.error);
  if (includeTrading && tradingNotesResult.error && !isMissingTableError(tradingNotesResult.error)) throwIfSupabaseError("trading_notes", tradingNotesResult.error);
  if (includeTrading && tradingRulesResult.error && !isMissingTableError(tradingRulesResult.error)) throwIfSupabaseError("trading_rules", tradingRulesResult.error);
  if (quotesResult.error && !isMissingTableError(quotesResult.error)) throwIfSupabaseError("personal_quotes", quotesResult.error);
  if (milestonesResult.error && !isMissingTableError(milestonesResult.error)) throwIfSupabaseError("journey_milestones", milestonesResult.error);

  console.info("[DecideLife sync] Supabase query counts", {
    userId: user.id,
    profiles: profileResult.data ? 1 : 0,
    progress: progressResult.data ? 1 : 0,
    habits: habitsResult.data?.length ?? 0,
    habitLogs: logsResult.data?.length ?? 0,
    missions: missionsResult.data?.length ?? 0,
    journalEntries: journalResult.data?.length ?? 0,
    protectors: protectorsResult.data?.length ?? 0
  });

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
      createdAt: profileResult.data?.created_at ?? fallback.profile.createdAt,
      theme: profileResult.data?.theme ?? fallback.profile.theme,
      tradingAccountType: profileResult.data?.trading_account_type ?? fallback.profile.tradingAccountType,
      dailyBonusXp: profileResult.data?.daily_bonus_xp ?? fallback.profile.dailyBonusXp,
      reflectionReminderTime: profileResult.data?.reflection_reminder_time ?? fallback.profile.reflectionReminderTime,
      lastMorningBriefDate: profileResult.data?.last_morning_brief_date ?? fallback.profile.lastMorningBriefDate,
      lastDailyVictoryDate: profileResult.data?.last_daily_victory_date ?? fallback.profile.lastDailyVictoryDate
    },
    user
  );

  return {
    profile,
    habits: ((habitsResult.data ?? []) as HabitRow[]).map(rowToHabit),
    habitLogs: ((logsResult.data ?? []) as HabitLogRow[]).map(rowToHabitLog),
    missions: ((missionsResult.data ?? []) as MissionRow[]).map(rowToMission),
    journalEntries: !journalResult.error ? ((journalResult.data ?? []) as JournalEntryRow[]).map(rowToJournalEntry) : fallback.journalEntries,
    protectors: !protectorsResult.error ? ((protectorsResult.data ?? []) as ProtectorRow[]).map(rowToProtector) : fallback.protectors,
    tradingJournalEntries: includeTrading && !tradingJournalResult.error ? ((tradingJournalResult.data ?? []) as TradingJournalRow[]).map(rowToTradingJournal) : fallback.tradingJournalEntries,
    tradingNotes: includeTrading && !tradingNotesResult.error ? ((tradingNotesResult.data ?? []) as TradingNoteRow[]).map(rowToTradingNote) : fallback.tradingNotes,
    tradingRules: includeTrading && !tradingRulesResult.error ? ((tradingRulesResult.data ?? []) as TradingRuleRow[]).map(rowToTradingRule) : fallback.tradingRules,
    personalQuotes: !quotesResult.error ? ((quotesResult.data ?? []) as PersonalQuoteRow[]).map(rowToQuote) : fallback.personalQuotes,
    journeyMilestones: !milestonesResult.error ? ((milestonesResult.data ?? []) as JourneyMilestoneRow[]).map(rowToMilestone) : fallback.journeyMilestones,
    lastHabitReviewDate: progress?.last_habit_review_date ?? fallback.lastHabitReviewDate
  };
}

async function runOptionalSupabaseWrite(label: string, route: string, operation: () => PromiseLike<{ error: unknown }>) {
  const result = await operation();
  if (result.error && isMissingTableError(result.error)) {
    console.warn("[DecideLife sync] Optional Supabase table write skipped because table is unavailable", { route, table: label, error: result.error });
    return;
  }
  if (result.error) throw new Error(`Supabase ${label} write failed: ${JSON.stringify(result.error)}`);
  console.info("[DecideLife sync] Supabase table write succeeded", { route, table: label });
}

export async function saveWidgetState(userId: string, state: DecideLifeRemoteState) {
  if (!supabase) return;
  const supabaseClient = supabase;
  const route = "/widget";
  console.info("[DecideLife widget sync] Saving lightweight widget state", {
    route,
    userId,
    tables: WIDGET_TABLES,
    skippedTables: WIDGET_SKIPPED_TABLES
  });

  const profile = {
    id: userId,
    display_name: state.profile.displayName,
    email: state.profile.email ?? null,
    current_level: state.profile.currentLevel,
    total_xp: state.profile.totalXp,
    highest_level_reached: state.profile.highestLevelReached,
    current_title: state.profile.currentTitle,
    theme: state.profile.theme,
    trading_account_type: state.profile.tradingAccountType,
    daily_bonus_xp: state.profile.dailyBonusXp,
    reflection_reminder_time: state.profile.reflectionReminderTime ?? null,
    last_morning_brief_date: state.profile.lastMorningBriefDate ?? null,
    last_daily_victory_date: state.profile.lastDailyVictoryDate ?? null,
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

  await runOptionalSupabaseWrite("profiles", route, () => supabaseClient.from("profiles").upsert(profile));
  await runOptionalSupabaseWrite("user_progress", route, () => supabaseClient.from("user_progress").upsert(progress));

  await Promise.all([
    runOptionalSupabaseWrite("habit_logs", route, () => supabaseClient.from("habit_logs").delete().eq("user_id", userId)),
    runOptionalSupabaseWrite("habits", route, () => supabaseClient.from("habits").delete().eq("user_id", userId)),
    runOptionalSupabaseWrite("missions", route, () => supabaseClient.from("missions").delete().eq("user_id", userId)),
    runOptionalSupabaseWrite("streak_protectors", route, () => supabaseClient.from("streak_protectors").delete().eq("user_id", userId))
  ]);

  await Promise.all([
    state.habits.length ? runOptionalSupabaseWrite("habits", route, () => supabaseClient.from("habits").insert(state.habits.map((habit) => habitToRow(habit, userId)))) : Promise.resolve(),
    state.habitLogs.length ? runOptionalSupabaseWrite("habit_logs", route, () => supabaseClient.from("habit_logs").insert(state.habitLogs.map((log) => habitLogToRow(log, userId)))) : Promise.resolve(),
    state.missions.length ? runOptionalSupabaseWrite("missions", route, () => supabaseClient.from("missions").insert(state.missions.map((mission) => missionToRow(mission, userId)))) : Promise.resolve(),
    state.protectors.length ? runOptionalSupabaseWrite("streak_protectors", route, () => supabaseClient.from("streak_protectors").insert(state.protectors.map((usage) => protectorToRow(usage, userId)))) : Promise.resolve()
  ]);

  console.info("[DecideLife widget sync] Widget save skipped optional tables", { route, skippedTables: WIDGET_SKIPPED_TABLES });
}

export async function saveSupabaseState(userId: string, state: DecideLifeRemoteState, options: LoadSupabaseStateOptions = {}) {
  if (!supabase) return;
  const supabaseClient = supabase;
  const route = options.route ?? "unknown";
  const includeTrading = options.includeTrading ?? route !== "/widget";
  console.info("[DecideLife sync] Saving Supabase state", { route, includeTrading, userId });

  const profile = {
    id: userId,
    display_name: state.profile.displayName,
    email: state.profile.email ?? null,
    current_level: state.profile.currentLevel,
    total_xp: state.profile.totalXp,
    highest_level_reached: state.profile.highestLevelReached,
    current_title: state.profile.currentTitle,
    theme: state.profile.theme,
    trading_account_type: state.profile.tradingAccountType,
    daily_bonus_xp: state.profile.dailyBonusXp,
    reflection_reminder_time: state.profile.reflectionReminderTime ?? null,
    last_morning_brief_date: state.profile.lastMorningBriefDate ?? null,
    last_daily_victory_date: state.profile.lastDailyVictoryDate ?? null,
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

  await runOptionalSupabaseWrite("profiles", route, () => supabaseClient.from("profiles").upsert(profile));
  await runOptionalSupabaseWrite("user_progress", route, () => supabaseClient.from("user_progress").upsert(progress));

  await Promise.all([
    runOptionalSupabaseWrite("habit_logs", route, () => supabaseClient.from("habit_logs").delete().eq("user_id", userId)),
    runOptionalSupabaseWrite("habits", route, () => supabaseClient.from("habits").delete().eq("user_id", userId)),
    runOptionalSupabaseWrite("missions", route, () => supabaseClient.from("missions").delete().eq("user_id", userId)),
    runOptionalSupabaseWrite("journal_entries", route, () => supabaseClient.from("journal_entries").delete().eq("user_id", userId)),
    runOptionalSupabaseWrite("streak_protectors", route, () => supabaseClient.from("streak_protectors").delete().eq("user_id", userId)),
    runOptionalSupabaseWrite("personal_quotes", route, () => supabaseClient.from("personal_quotes").delete().eq("user_id", userId)),
    runOptionalSupabaseWrite("journey_milestones", route, () => supabaseClient.from("journey_milestones").delete().eq("user_id", userId)),
    includeTrading ? runOptionalSupabaseWrite("trading_journal_entries", route, () => supabaseClient.from("trading_journal_entries").delete().eq("user_id", userId)) : Promise.resolve(),
    includeTrading ? runOptionalSupabaseWrite("trading_notes", route, () => supabaseClient.from("trading_notes").delete().eq("user_id", userId)) : Promise.resolve(),
    includeTrading ? runOptionalSupabaseWrite("trading_rules", route, () => supabaseClient.from("trading_rules").delete().eq("user_id", userId)) : Promise.resolve()
  ]);

  await Promise.all([
    state.habits.length ? runOptionalSupabaseWrite("habits", route, () => supabaseClient.from("habits").insert(state.habits.map((habit) => habitToRow(habit, userId)))) : Promise.resolve(),
    state.habitLogs.length ? runOptionalSupabaseWrite("habit_logs", route, () => supabaseClient.from("habit_logs").insert(state.habitLogs.map((log) => habitLogToRow(log, userId)))) : Promise.resolve(),
    state.missions.length ? runOptionalSupabaseWrite("missions", route, () => supabaseClient.from("missions").insert(state.missions.map((mission) => missionToRow(mission, userId)))) : Promise.resolve(),
    state.journalEntries.length ? runOptionalSupabaseWrite("journal_entries", route, () => supabaseClient.from("journal_entries").insert(state.journalEntries.map((entry) => journalEntryToRow(entry, userId)))) : Promise.resolve(),
    state.protectors.length ? runOptionalSupabaseWrite("streak_protectors", route, () => supabaseClient.from("streak_protectors").insert(state.protectors.map((usage) => protectorToRow(usage, userId)))) : Promise.resolve(),
    state.personalQuotes.length ? runOptionalSupabaseWrite("personal_quotes", route, () => supabaseClient.from("personal_quotes").insert(state.personalQuotes.map((quote) => quoteToRow(quote, userId)))) : Promise.resolve(),
    state.journeyMilestones.length ? runOptionalSupabaseWrite("journey_milestones", route, () => supabaseClient.from("journey_milestones").insert(state.journeyMilestones.map((milestone) => milestoneToRow(milestone, userId)))) : Promise.resolve(),
    includeTrading && state.tradingJournalEntries.length ? runOptionalSupabaseWrite("trading_journal_entries", route, () => supabaseClient.from("trading_journal_entries").insert(state.tradingJournalEntries.map((entry) => tradingJournalToRow(entry, userId)))) : Promise.resolve(),
    includeTrading && state.tradingNotes.length ? runOptionalSupabaseWrite("trading_notes", route, () => supabaseClient.from("trading_notes").insert(state.tradingNotes.map((note) => tradingNoteToRow(note, userId)))) : Promise.resolve(),
    includeTrading && state.tradingRules.length ? runOptionalSupabaseWrite("trading_rules", route, () => supabaseClient.from("trading_rules").insert(state.tradingRules.map((rule) => tradingRuleToRow(rule, userId)))) : Promise.resolve()
  ]);
}
