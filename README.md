# GAINS — macro + gym tracker

A local desktop app for tracking daily macros and workouts while lean-bulking.
Built with **Tauri 2 + SvelteKit (Svelte 5)**. All data is stored locally in the
browser/webview (`localStorage`) — no server, no account, single device.

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

- `src/lib/state.svelte.js` — all reactive state, the food database, persistence,
  and helper logic (totals, last-session, PR). Start here.
- `src/lib/components/Macros.svelte` — macro tracking tab
- `src/lib/components/Gym.svelte` — workout tracking tab
- `src/lib/components/Settings.svelte` — targets tab
- `src/routes/+page.svelte` — tab shell + global styling
- `src-tauri/` — the Rust/Tauri native shell

## Ideas for v2

- Move persistence into Rust + SQLite (`tauri-plugin-sql`) for real history/charts
- Bodyweight log + trend chart to verify you're gaining 0.25–0.5 lb/week
- Weekly protein/calorie adherence stats
