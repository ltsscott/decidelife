export type HabitStatus = "pending" | "completed" | "missed" | "protected";
export type MoodState = "focused" | "steady" | "tired" | "stressed" | "proud" | "resetting";
export type MissionCategory = "career" | "fitness" | "nutrition" | "finance" | "trading" | "personal";
export type MissionType = "side" | "major";

export interface UserProfile {
  id: string;
  displayName: string;
  email?: string;
  currentLevel: number;
  totalXp: number;
  highestLevelReached: number;
  currentTitle: string;
  createdAt: string;
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
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string;
  status: HabitStatus;
  xpDelta: number;
  usedProtector: boolean;
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
