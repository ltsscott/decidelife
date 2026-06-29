"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Flame, Settings, Target } from "lucide-react";
import { getScheduledDailyCompletionPercentage, isHabitScheduledForDate } from "@/lib/progression";
import { hasSupabaseConfig } from "@/lib/supabase";
import { useDecideLife } from "@/lib/local-store";

type WidgetSize = "small" | "medium" | "large";

interface WidgetSettings {
  transparency: number;
  keepOnTop: boolean;
  floatingMode: boolean;
  minimalMode: boolean;
  widgetSize: WidgetSize;
  rememberPosition: boolean;
  hideScrollbars: boolean;
  launchOnStartup: boolean;
}

declare global {
  interface Window {
    decideLifeWidget?: {
      getSettings: () => Promise<WidgetSettings>;
      updateSettings: (settings: Partial<WidgetSettings>) => Promise<WidgetSettings>;
      resizeToContent: (size: { width: number; height: number }) => void;
    };
  }
}

const defaultSettings: WidgetSettings = {
  transparency: 0,
  keepOnTop: false,
  floatingMode: true,
  minimalMode: false,
  widgetSize: "medium",
  rememberPosition: true,
  hideScrollbars: true,
  launchOnStartup: false
};

const sizeWidths: Record<WidgetSize, number> = {
  small: 380,
  medium: 420,
  large: 480
};

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function loadBrowserSettings() {
  try {
    return { ...defaultSettings, ...JSON.parse(window.localStorage.getItem("decidelife-widget-settings") ?? "{}") } as WidgetSettings;
  } catch {
    return defaultSettings;
  }
}

export default function WidgetPage() {
  const {
    habits,
    habitLogs,
    missions,
    profile,
    levelProgress,
    todayCompletedHabitIds,
    completeHabit,
    uncompleteHabit,
    authReady,
    isAuthenticated
  } = useDecideLife();
  const [settings, setSettings] = useState<WidgetSettings>(defaultSettings);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const widgetRef = useRef<HTMLElement>(null);
  const today = todayKey();

  useEffect(() => {
    document.documentElement.classList.add("widget-transparent-page");
    const params = new URLSearchParams(window.location.search);
    const initial = {
      ...loadBrowserSettings(),
      minimalMode: params.get("minimal") === "1" || params.get("mode") === "minimal" || params.get("compact") === "1"
    };

    if (window.decideLifeWidget) {
      window.decideLifeWidget.getSettings().then((desktopSettings) => {
        setSettings({ ...initial, ...desktopSettings });
      }).catch(() => setSettings(initial));
    } else {
      setSettings(initial);
    }

    return () => {
      document.documentElement.classList.remove("widget-transparent-page");
    };
  }, []);

  useEffect(() => {
    if (authReady && hasSupabaseConfig && !isAuthenticated) {
      console.warn("[DecideLife widget] No authenticated Supabase user. Redirecting to login.");
      window.location.assign("/login?next=/widget");
    }
  }, [authReady, isAuthenticated]);

  useEffect(() => {
    if (!settings.hideScrollbars) document.documentElement.classList.remove("widget-hide-scrollbars");
    else document.documentElement.classList.add("widget-hide-scrollbars");
  }, [settings.hideScrollbars]);

  useEffect(() => {
    const node = widgetRef.current;
    if (!node) return;
    const resize = () => {
      const rect = node.getBoundingClientRect();
      const width = Math.max(380, Math.ceil(rect.width + 24));
      const height = Math.max(450, Math.ceil(rect.height + 24));
      window.decideLifeWidget?.resizeToContent({ width, height });
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(node);
    return () => observer.disconnect();
  }, [settings]);

  const updateSettings = async (partial: Partial<WidgetSettings>) => {
    const next = { ...settings, ...partial };
    setSettings(next);
    window.localStorage.setItem("decidelife-widget-settings", JSON.stringify(next));
    if (window.decideLifeWidget) {
      const saved = await window.decideLifeWidget.updateSettings(partial);
      setSettings(saved);
    }
  };

  const todaysHabits = useMemo(
    () => habits
      .filter((habit) => habit.unlocked && !habit.archived && isHabitScheduledForDate(habit, today))
      .sort((a, b) => a.order - b.order),
    [habits, today]
  );
  const completion = getScheduledDailyCompletionPercentage(habits, todayCompletedHabitIds, today);
  const activeMission = missions.find((mission) => !mission.archived && !mission.locked && !mission.completed);
  const currentStreak = Math.max(0, ...habits.filter((habit) => !habit.archived).map((habit) => habit.currentStreak));
  const alpha = Math.max(0, Math.min(1, settings.transparency / 100));
  const isFloating = settings.floatingMode || settings.minimalMode;
  const panelStyle = isFloating
    ? { width: sizeWidths[settings.widgetSize] }
    : {
        width: sizeWidths[settings.widgetSize],
        background: `rgba(255,255,255,${alpha * 0.12})`,
        backdropFilter: "blur(12px)"
      };
  const elementGlass = `rgba(255,255,255,${alpha * 0.05})`;

  if (!authReady && hasSupabaseConfig) {
    return (
      <main className="grid min-h-screen place-items-center bg-transparent p-3 text-white">
        <section className="widget-floating-text p-5 text-sm text-slate-300">Syncing DecideLife account...</section>
      </main>
    );
  }

  return (
    <main className="widget-page min-h-screen overflow-hidden bg-transparent p-3 text-white">
      <section
        ref={widgetRef}
        style={panelStyle}
        className={[
          "relative mx-auto overflow-visible rounded-[20px] p-5 text-white",
          isFloating ? "floating-widget" : "shadow-[0_0_46px_rgba(56,189,248,0.18)]",
          settings.minimalMode ? "minimal-widget" : "",
          isFloating ? "" : "border border-white/[0.08]"
        ].join(" ")}
      >
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_10%_5%,rgba(56,189,248,0.1),transparent_28%),radial-gradient(circle_at_92%_18%,rgba(139,92,246,0.08),transparent_26%)]" />
        <div className="relative">
          <div className="widget-drag-region mb-4 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan">DecideLife</p>
              <h1 className="mt-2 text-2xl font-semibold leading-none">Level {levelProgress.level}</h1>
              {!settings.minimalMode ? <p className="mt-1 text-xs text-slate-300">{new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}</p> : null}
            </div>
            <button
              type="button"
              className="widget-no-drag widget-element-glass grid h-9 w-9 place-items-center rounded-xl text-slate-300 transition hover:text-cyan"
              style={{ background: elementGlass }}
              title="Desktop widget settings"
              onClick={() => setSettingsOpen((value) => !value)}
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>

          {settingsOpen ? (
            <div className="widget-no-drag widget-element-glass mb-4 grid gap-3 rounded-2xl p-3 text-xs text-slate-300">
              <label className="grid gap-1">
                Background Strength {settings.transparency}%
                <input type="range" min={0} max={100} value={settings.transparency} onChange={(event) => void updateSettings({ transparency: Number(event.currentTarget.value) })} />
              </label>
              {[
                ["keepOnTop", "Keep on Top"],
                ["floatingMode", "Floating Widget Mode"],
                ["minimalMode", "Minimal Mode"],
                ["rememberPosition", "Remember Window Position"],
                ["hideScrollbars", "Hide Scrollbars"],
                ["launchOnStartup", "Launch on Windows Startup"]
              ].map(([key, label]) => (
                <label key={key} className="flex items-center justify-between gap-3">
                  <span>{label}</span>
                  <input
                    type="checkbox"
                    checked={Boolean(settings[key as keyof WidgetSettings])}
                    onChange={(event) => void updateSettings({ [key]: event.currentTarget.checked } as Partial<WidgetSettings>)}
                  />
                </label>
              ))}
              <label className="grid gap-1">
                Size
                <select className="rounded-lg bg-black/40 px-2 py-1 text-white" value={settings.widgetSize} onChange={(event) => void updateSettings({ widgetSize: event.currentTarget.value as WidgetSize })}>
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
              </label>
            </div>
          ) : null}

          <div className={isFloating ? "widget-floating-text mb-4" : "mb-4 rounded-2xl bg-white/[0.05] p-3"}>
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-xs uppercase text-slate-400">XP</p>
                <p className="mt-1 text-lg font-semibold">{profile.totalXp.toLocaleString()}</p>
              </div>
              <p className="text-xs text-cyan">{levelProgress.percentage}%</p>
            </div>
            <div className="widget-progress-track mt-3 h-2 overflow-hidden rounded-full">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan via-violet to-cyan shadow-[0_0_18px_rgba(56,189,248,0.55)] transition-[width] duration-700"
                style={{ width: `${levelProgress.percentage}%` }}
              />
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-white">Today</h2>
              <span className="text-[11px] text-cyan">{todayCompletedHabitIds.length}/{todaysHabits.length}</span>
            </div>
            {!settings.minimalMode ? (
              <div className="widget-progress-track mb-3 h-1.5 overflow-hidden rounded-full">
                <div className="h-full rounded-full bg-gradient-to-r from-cyan to-violet transition-[width] duration-700" style={{ width: `${completion}%` }} />
              </div>
            ) : null}
            <div className="grid gap-2">
              {todaysHabits.length ? todaysHabits.map((habit) => {
                const log = habitLogs.find((item) => item.habitId === habit.id && item.date === today);
                const done = log?.status === "completed";
                return (
                  <label
                    key={habit.id}
                    className={[
                      "group flex items-center gap-3 text-sm text-slate-100 transition",
                      isFloating ? "widget-floating-row" : "rounded-xl bg-white/[0.045] px-3 py-2 hover:bg-cyan/[0.06]"
                    ].join(" ")}
                  >
                    <button
                      type="button"
                      className={`widget-no-drag grid h-5 w-5 shrink-0 place-items-center rounded-md border transition ${done ? "border-cyan bg-cyan text-slate-950" : "border-slate-500 bg-black/20 text-transparent group-hover:border-cyan"}`}
                      onClick={() => {
                        if (done) uncompleteHabit(habit.id, today);
                        else completeHabit(habit.id, today);
                      }}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <span className={done ? "text-slate-400 line-through" : ""}>{habit.name}</span>
                  </label>
                );
              }) : (
                <p className="text-sm text-slate-400">No scheduled habits today.</p>
              )}
            </div>
          </div>

          <div className={settings.minimalMode ? "mt-5 grid gap-3" : "mt-4 grid gap-3"}>
            <div className={isFloating ? "widget-floating-text" : "rounded-2xl bg-white/[0.045] p-3"}>
              <div className="mb-1 flex items-center gap-2 text-xs uppercase text-slate-400">
                <Target className="h-3.5 w-3.5 text-violet" />
                Mission
              </div>
              <p className="text-sm font-medium text-white">{activeMission?.title ?? "No active mission"}</p>
            </div>
            <div className={isFloating ? "widget-floating-text" : "rounded-2xl bg-white/[0.045] p-3"}>
              <div className="mb-1 flex items-center gap-2 text-xs uppercase text-slate-400">
                <Flame className="h-3.5 w-3.5 text-cyan" />
                Streak
              </div>
              <p className="text-sm font-medium text-white">{currentStreak} {currentStreak === 1 ? "Day" : "Days"}</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
