import type { Habit, HabitLog, JournalEntry, Mission, StreakProtectorUsage, UserProfile } from "@/types";

const today = new Date().toISOString().slice(0, 10);

export const userProfile: UserProfile = {
  id: "local-user",
  displayName: "Scott",
  currentLevel: 2,
  highestLevelReached: 2,
  totalXp: 1650,
  currentTitle: "Initiate",
  createdAt: "2026-06-01"
};

export const habits: Habit[] = [
  {
    id: "workout",
    name: "Workout",
    description: "Complete the main physical training session for the day.",
    order: 1,
    unlocked: true,
    currentStreak: 5,
    bestStreak: 12,
    category: "fitness",
    baseXp: 100,
    streakMultiplierEnabled: true,
    archived: false
  },
  {
    id: "reading",
    name: "Reading",
    description: "Read with intent for at least one focused session.",
    order: 2,
    unlocked: false,
    currentStreak: 0,
    bestStreak: 0,
    category: "mind",
    baseXp: 100,
    prerequisiteHabitId: "workout",
    streakMultiplierEnabled: true,
    archived: false
  },
  {
    id: "walking",
    name: "Walking / Steps",
    description: "Hit the daily movement target.",
    order: 3,
    unlocked: false,
    currentStreak: 0,
    bestStreak: 0,
    category: "fitness",
    baseXp: 100,
    prerequisiteHabitId: "reading",
    streakMultiplierEnabled: true,
    archived: false
  },
  {
    id: "job-applications",
    name: "Job Applications",
    description: "Send or improve applications for remote work.",
    order: 4,
    unlocked: false,
    currentStreak: 0,
    bestStreak: 0,
    category: "career",
    baseXp: 100,
    prerequisiteHabitId: "walking",
    streakMultiplierEnabled: true,
    archived: false
  },
  {
    id: "trading-study",
    name: "Trading Study",
    description: "Study market structure, review trades, or journal setups.",
    order: 5,
    unlocked: false,
    currentStreak: 0,
    bestStreak: 0,
    category: "trading",
    baseXp: 100,
    prerequisiteHabitId: "job-applications",
    streakMultiplierEnabled: true,
    archived: false
  },
  {
    id: "sleep-schedule",
    name: "Sleep Schedule",
    description: "Protect a consistent bedtime and wake time.",
    order: 6,
    unlocked: false,
    currentStreak: 0,
    bestStreak: 0,
    category: "recovery",
    baseXp: 100,
    prerequisiteHabitId: "trading-study",
    streakMultiplierEnabled: true,
    archived: false
  }
];

export const habitLogs: HabitLog[] = [];

export const missions: Mission[] = [
  {
    id: "land-remote-job",
    title: "Land Remote Job",
    description: "Secure a reliable remote role that creates stable income and schedule freedom.",
    category: "career",
    xpReward: 1500,
    type: "major",
    locked: false,
    completed: false,
    prerequisites: [],
    unlocksMissionIds: ["get-gym-membership", "build-proper-diet", "buy-parallettes", "fund-trading-account-safely"],
    archived: false
  },
  {
    id: "get-gym-membership",
    title: "Get Gym Membership",
    description: "Choose a gym and start training with better equipment access.",
    category: "fitness",
    xpReward: 500,
    type: "major",
    locked: true,
    completed: false,
    prerequisites: ["land-remote-job"],
    unlocksMissionIds: [],
    archived: false
  },
  {
    id: "build-proper-diet",
    title: "Build Proper Diet",
    description: "Create a practical nutrition plan that supports training and energy.",
    category: "nutrition",
    xpReward: 600,
    type: "major",
    locked: true,
    completed: false,
    prerequisites: ["land-remote-job"],
    unlocksMissionIds: [],
    archived: false
  },
  {
    id: "buy-parallettes",
    title: "Buy Parallettes",
    description: "Add home training equipment for calisthenics progressions.",
    category: "fitness",
    xpReward: 350,
    type: "side",
    locked: true,
    completed: false,
    prerequisites: ["land-remote-job"],
    unlocksMissionIds: [],
    archived: false
  },
  {
    id: "fund-trading-account-safely",
    title: "Fund Trading Account Safely",
    description: "Fund an account with strict risk limits and no pressure capital.",
    category: "trading",
    xpReward: 750,
    type: "major",
    locked: true,
    completed: false,
    prerequisites: ["land-remote-job"],
    unlocksMissionIds: ["get-first-trading-payout"],
    archived: false
  },
  {
    id: "get-first-trading-payout",
    title: "Get First Trading Payout",
    description: "Withdraw the first verified trading payout using a rule-based plan.",
    category: "trading",
    xpReward: 1500,
    type: "major",
    locked: true,
    completed: false,
    prerequisites: ["fund-trading-account-safely"],
    unlocksMissionIds: [],
    archived: false
  },
  {
    id: "save-first-500",
    title: "Save First $500",
    description: "Build the first cash buffer and keep it untouched.",
    category: "finance",
    xpReward: 500,
    type: "major",
    locked: false,
    completed: false,
    prerequisites: [],
    unlocksMissionIds: [],
    archived: false
  }
];

export const journalEntries: JournalEntry[] = [
  {
    id: "journal-1",
    date: today,
    title: "First DecideLife Check-In",
    mood: "focused",
    tags: ["launch", "systems"],
    body: "Started the system. Keep the first habit simple, protect the streak, and let the next unlock happen naturally.",
    updatedAt: new Date().toISOString()
  }
];

export const streakProtectorUsages: StreakProtectorUsage[] = [
  {
    id: "protector-2026-06",
    userId: "local-user",
    month: "2026-06",
    totalAvailable: 2,
    used: 0
  }
];
