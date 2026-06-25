import type { Habit, LevelProgress, Mission, StreakProtectorUsage } from "@/types";

export const MONTHLY_PROTECTORS = 2;

export const levelXpTable = [
  0, 1000, 2100, 3300, 4600, 6000, 7600, 9400, 11400, 13600, 16000, 18600, 21400, 24400, 27600
];

export const titleByLevel = [
  { level: 1, title: "Initiate" },
  { level: 3, title: "Builder" },
  { level: 5, title: "Operator" },
  { level: 8, title: "Strategist" },
  { level: 11, title: "Rainmaker" },
  { level: 14, title: "Architect" }
];

export function getTitleForLevel(level: number) {
  return titleByLevel.reduce((title, rank) => (level >= rank.level ? rank.title : title), "Initiate");
}

export function calculateLevelProgress(totalXp: number, highestLevelReached = 1): LevelProgress {
  const earnedLevel = levelXpTable.reduce((level, threshold, index) => (totalXp >= threshold ? index + 1 : level), 1);
  const level = Math.max(earnedLevel, highestLevelReached);
  const currentLevelXp = levelXpTable[level - 1] ?? levelXpTable[levelXpTable.length - 1];
  const nextLevelXp = levelXpTable[level] ?? currentLevelXp + 3500;
  const xpIntoLevel = Math.max(0, totalXp - currentLevelXp);
  const xpToNextLevel = Math.max(0, nextLevelXp - totalXp);
  const percentage = Math.min(100, Math.round((xpIntoLevel / (nextLevelXp - currentLevelXp)) * 100));

  return {
    level,
    currentLevelXp,
    nextLevelXp,
    xpIntoLevel,
    xpToNextLevel,
    percentage,
    title: getTitleForLevel(level)
  };
}

export function getHabitCompletionXp(streak: number, baseXp = 100, multiplierEnabled = true) {
  const multiplierSteps = multiplierEnabled ? Math.floor(streak / 30) : 0;
  return Math.round(baseXp * (1 + multiplierSteps * 0.1));
}

export function getHabitCardTier(streak: number) {
  if (streak >= 365) return "eternal";
  if (streak >= 180) return "immortal";
  if (streak >= 100) return "legendary";
  if (streak >= 60) return "premium";
  if (streak >= 30) return "glow";
  if (streak >= 7) return "strong";
  return "normal";
}

export function getStreakTier(streak: number) {
  if (streak >= 365) return 6;
  if (streak >= 180) return 5;
  if (streak >= 100) return 4;
  if (streak >= 60) return 3;
  if (streak >= 30) return 2;
  if (streak >= 7) return 1;
  return 0;
}

export function getStreakTierLabel(streak: number) {
  const labels = ["Normal", "Elite", "Master", "Grandmaster", "Legendary", "Immortal", "Eternal"];
  return labels[getStreakTier(streak)];
}

export function getLevelTier(level: number) {
  if (level >= 100) return 7;
  if (level >= 75) return 6;
  if (level >= 50) return 5;
  if (level >= 35) return 4;
  if (level >= 20) return 3;
  if (level >= 10) return 2;
  if (level >= 5) return 1;
  return 0;
}

export function getLevelTierLabel(level: number) {
  const labels = ["Initiate", "Builder", "Disciplined", "Elite", "Master", "Grandmaster", "Legendary", "Eternal"];
  return labels[getLevelTier(level)];
}

export function getDailyCompletionPercentage(habits: Habit[], completedHabitIds: string[]) {
  const unlocked = habits.filter((habit) => habit.unlocked && !habit.archived);
  if (!unlocked.length) return 0;
  return Math.round((completedHabitIds.length / unlocked.length) * 100);
}

export function weekdayForDate(date: string) {
  return new Date(`${date}T00:00:00`).getDay();
}

export function isHabitScheduledForDate(habit: Habit, date: string) {
  const activeDays = habit.activeDays?.length ? habit.activeDays : [0, 1, 2, 3, 4, 5, 6];
  return activeDays.includes(weekdayForDate(date));
}

export function getScheduledHabitsForDate(habits: Habit[], date: string) {
  return habits.filter((habit) => habit.unlocked && !habit.archived && isHabitScheduledForDate(habit, date));
}

export function getScheduledDailyCompletionPercentage(habits: Habit[], completedHabitIds: string[], date: string) {
  const scheduled = getScheduledHabitsForDate(habits, date);
  if (!scheduled.length) return 0;
  return Math.round((completedHabitIds.length / scheduled.length) * 100);
}

export function getProtectorUsageForCurrentMonth(usages: StreakProtectorUsage[]) {
  const month = new Date().toISOString().slice(0, 7);
  return usages.find((usage) => usage.month === month) ?? {
    id: `protector-${month}`,
    userId: "local-user",
    month,
    totalAvailable: MONTHLY_PROTECTORS,
    used: 0
  };
}

export function unlockMissions(missions: Mission[]) {
  const completedIds = new Set(missions.filter((mission) => mission.completed).map((mission) => mission.id));
  return missions.map((mission) => ({
    ...mission,
    locked: mission.prerequisites.length > 0 && mission.prerequisites.every((id) => completedIds.has(id))
      ? false
      : mission.locked
  }));
}
