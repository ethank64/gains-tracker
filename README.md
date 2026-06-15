# GAINS — macro + gym tracker

A local desktop app for tracking daily macros and workouts while lean-bulking.
Built with **Tauri 2 + SvelteKit (Svelte 5)**. Data is stored locally in a
**SQLite** database (via `tauri-plugin-sql`) inside the native app — no server,
no account, single device. Running in a plain browser (`pnpm dev`) falls back to
`localStorage` so the fast dev loop still works.

## Run it

```bash
pnpm install

# Web preview (fastest dev loop, opens in your browser at localhost:1420)
pnpm dev

# Native desktop app (real .app window via Tauri)
pnpm tauri dev

# Build a distributable native app
pnpm tauri build
```

## What it does

- **🍗 Macros** — log foods from a built-in grocery-store food database (or add
  your own), see live progress bars vs. your protein / calorie / carb / fat targets.
- **🏋️ Gym** — log exercises (sets × reps @ weight). Shows your last session and
  all-time PR for each exercise so you know what to beat (progressive overload).
- **⚙️ Targets** — edit your targets, or auto-calculate them from your goal weight.

Default targets are set for a 150 → 170 lb lean bulk: **160g protein, 2,700 cal/day.**

## Code map

- `src/lib/state.svelte.js` — reactive state, the default food database, async
  load + write-through, and helper logic (totals, last-session, PR). Start here.
- `src/lib/db.js` — storage adapter: SQLite (Tauri) or localStorage (browser).
- `src/lib/components/Macros.svelte` — macro tracking tab
- `src/lib/components/Gym.svelte` — workout tracking tab
- `src/lib/components/Settings.svelte` — targets tab
- `src/routes/+page.svelte` — tab shell + global styling
- `src-tauri/src/lib.rs` — Rust shell + SQLite schema migrations
- `src-tauri/capabilities/default.json` — plugin permissions (incl. SQL execute)

## Ideas for v2

- Bodyweight log + trend chart to verify you're gaining 0.25–0.5 lb/week (now
  easy — query the SQLite history directly)
- Weekly protein/calorie adherence stats
