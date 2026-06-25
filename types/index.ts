export type HabitStatus = "pending" | "completed" | "missed" | "protected";
export type MoodState = "focused" | "steady" | "tired" | "stressed" | "proud" | "resetting";
export type MissionCategory = "career" | "fitness" | "nutrition" | "finance" | "trading" | "personal";
export type MissionType = "side" | "major";
export type AppTheme = "blue" | "black" | "red" | "green" | "gold";
export type TradingAccountType = "phase-1" | "phase-2" | "instant-funded" | "funded" | "live";

export interface UserProfile {
  id: string;
  displayName: string;
  email?: string;
  currentLevel: number;
  totalXp: number;
  highestLevelReached: number;
  currentTitle: string;
  createdAt: string;
  theme: AppTheme;
  tradingAccountType: TradingAccountType;
  dailyBonusXp: number;
  reflectionReminderTime?: string;
  lastMorningBriefDate?: string;
  lastDailyVictoryDate?: string;
}

export interface Habit {
  id: string;
  name: string;
  description: string;
  order: number;
  unlocked: boolean;
  currentStreak: number;
  bestStreak: number;
  category: string;
  baseXp: number;
  prerequisiteHabitId?: string;
  streakMultiplierEnabled: boolean;
  archived: boolean;
  testingStreakOverride?: number;
  activeDays: number[];
  reminderTime?: string;
  sessionMinutes?: number;
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string;
  status: HabitStatus;
  xpDelta: number;
  usedProtector: boolean;
  durationMinutes?: number;
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  category: MissionCategory;
  xpReward: number;
  type: MissionType;
  locked: boolean;
  completed: boolean;
  prerequisites: string[];
  unlocksMissionIds: string[];
  archived: boolean;
}

export interface JournalEntry {
  id: string;
  date: string;
  title: string;
  mood: MoodState;
  tags: string[];
  body: string;
  updatedAt: string;
}

export interface LevelProgress {
  level: number;
  currentLevelXp: number;
  nextLevelXp: number;
  xpIntoLevel: number;
  xpToNextLevel: number;
  percentage: number;
  title: string;
}

export interface StreakProtectorUsage {
  id: string;
  userId: string;
  month: string;
  totalAvailable: number;
  used: number;
}

export interface TradingJournalEntry {
  id: string;
  date: string;
  accountType: TradingAccountType;
  profitLoss: number;
  tradeCount: number;
  executionScore: number;
  aPlusSetups: number;
  session: string;
  pairs: string;
  screenshots: string[];
  generalNotes: string;
  followedRules: boolean;
  overtraded: boolean;
  movedStopLoss: boolean;
  emotionsAffected: boolean;
  biggestMistake: string;
  bestDecision: string;
  improveTomorrow: string;
  detailedReview: {
    preMarket: string;
    tradePlanning: string;
    duringTrade: string;
    afterTrade: string;
    endOfDay: string;
    improvementFocus: string;
  };
  mistakeTags: string[];
  positiveTags: string[];
  brokenRuleIds: string[];
  averageRr: number;
  wins: number;
  losses: number;
  updatedAt: string;
}

export interface TradingNote {
  id: string;
  date: string;
  body: string;
  createdAt: string;
}

export interface TradingRule {
  id: string;
  text: string;
  archived: boolean;
  createdAt: string;
}

export interface PersonalQuote {
  id: string;
  text: string;
  createdAt: string;
}

export type JourneyMilestoneType = "habit" | "mission" | "trading" | "level" | "manual";

export interface JourneyMilestone {
  id: string;
  date: string;
  title: string;
  type: JourneyMilestoneType;
  notes: string;
  photo?: string;
  createdAt: string;
}
