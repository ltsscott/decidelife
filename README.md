# DecideLife

DecideLife is a personal life-progression prototype built with Next.js, TypeScript, Tailwind CSS, and a Supabase-ready data layer.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Supabase

The app works without Supabase credentials by using local browser storage. To enable Supabase client/auth support, create `.env.local` from `.env.example`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

The first version includes TypeScript models for:

- `UserProfile`
- `Habit`
- `HabitLog`
- `Mission`
- `JournalEntry`
- `LevelProgress`
- `StreakProtectorUsage`

## Prototype behavior

- One habit starts unlocked.
- A 7-day streak unlocks the next habit.
- Habit completion grants XP with 30-day streak multipliers.
- Misses subtract 25 XP without dropping below zero.
- Levels never go backward once reached.
- Monthly streak protectors are tracked locally and reset by calendar month.
- Missions can unlock other missions.
- Journal entries can be created, viewed, and edited by date.
