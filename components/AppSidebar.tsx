"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, BookOpen, CheckSquare, Compass, GitBranch, LayoutDashboard, Settings, Target } from "lucide-react";
import { clsx } from "clsx";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/habits", label: "Habits", icon: CheckSquare },
  { href: "/missions", label: "Missions", icon: Target },
  { href: "/journal", label: "Journal", icon: BookOpen },
  { href: "/trading", label: "Trading", icon: BarChart3 },
  { href: "/journey", label: "Journey", icon: GitBranch },
  { href: "/settings", label: "Settings", icon: Settings }
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="relative z-10 flex h-auto w-full flex-col border-b border-line bg-ink/72 p-4 backdrop-blur-2xl lg:sticky lg:top-0 lg:min-h-screen lg:w-72 lg:border-b-0 lg:border-r">
      <div className="mb-7 flex items-center gap-3 rounded-xl border border-line bg-white/[0.03] p-3">
        <div className="grid h-11 w-11 place-items-center rounded-xl border border-cyan/35 bg-gradient-to-br from-cyan/18 to-violet/14 shadow-glow">
          <Compass className="h-5 w-5 text-cyan" />
        </div>
        <div>
          <p className="text-lg font-semibold tracking-normal text-white">DecideLife</p>
          <p className="text-xs text-slate-400">Life command center</p>
        </div>
      </div>

      <nav className="grid gap-2">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "group relative flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition duration-200 active:scale-[0.99]",
                active
                  ? "border border-cyan/30 bg-gradient-to-r from-cyan/14 to-violet/10 text-white shadow-glow"
                  : "border border-transparent text-slate-400 hover:border-line hover:bg-white/[0.04] hover:text-slate-100"
              )}
            >
              {active ? <span className="absolute left-0 h-6 w-1 rounded-r-full bg-cyan" /> : null}
              <Icon className={clsx("h-4 w-4 transition", active ? "text-cyan" : "group-hover:text-cyan")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-8 hidden rounded-xl border border-line bg-white/[0.03] p-3 text-xs text-slate-400 lg:block">
        <p className="font-medium text-slate-200">Focus mode</p>
        <p className="mt-1 leading-relaxed">Progress quietly. Keep the system clean.</p>
      </div>
    </aside>
  );
}
