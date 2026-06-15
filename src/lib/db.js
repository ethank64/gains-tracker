// Storage adapter. Inside the Tauri app this talks to a real SQLite database
// (via tauri-plugin-sql); in a plain browser (pnpm dev) it falls back to
// localStorage so the fast dev loop still works. Both backends expose the same
// async interface, so the rest of the app doesn't care which one is active.
import Database from '@tauri-apps/plugin-sql';

export const isTauri =
	typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

// ---------------------------------------------------------------------------
// SQLite backend (real desktop app)
// ---------------------------------------------------------------------------
let _db;
async function sdb() {
	if (!_db) _db = await Database.load('sqlite:gains.db');
	return _db;
}

const rowToTargets = (r) => ({
	bodyweight: r.bodyweight,
	goalWeight: r.goal_weight,
	calories: r.calories,
	protein: r.protein,
	carbs: r.carbs,
	fat: r.fat
});

function groupByDate(rows) {
	const out = {};
	for (const r of rows) (out[r.date] ??= []).push(r);
	return out;
}

const sqliteBackend = {
	async loadAll() {
		const db = await sdb();
		const t = await db.select('SELECT * FROM targets WHERE id = 1');
		const foods = await db.select('SELECT * FROM foods ORDER BY id');
		const fl = await db.select('SELECT * FROM food_log ORDER BY id');
		const wl = await db.select('SELECT * FROM workout_log ORDER BY id');
		return {
			targets: t.length ? rowToTargets(t[0]) : null,
			foods,
			foodLog: groupByDate(fl),
			workoutLog: groupByDate(wl)
		};
	},
	async saveTargets(t) {
		const db = await sdb();
		await db.execute(
			`INSERT INTO targets (id, bodyweight, goal_weight, calories, protein, carbs, fat)
			 VALUES (1, $1, $2, $3, $4, $5, $6)
			 ON CONFLICT(id) DO UPDATE SET
			   bodyweight=$1, goal_weight=$2, calories=$3, protein=$4, carbs=$5, fat=$6`,
			[t.bodyweight, t.goalWeight, t.calories, t.protein, t.carbs, t.fat]
		);
	},
	async addFoodDef(f) {
		const db = await sdb();
		const r = await db.execute(
			'INSERT INTO foods (name, calories, protein, carbs, fat) VALUES ($1, $2, $3, $4, $5)',
			[f.name, f.calories, f.protein, f.carbs, f.fat]
		);
		return r.lastInsertId;
	},
	async addFoodEntry(e) {
		const db = await sdb();
		const r = await db.execute(
			'INSERT INTO food_log (date, name, qty, calories, protein, carbs, fat) VALUES ($1, $2, $3, $4, $5, $6, $7)',
			[e.date, e.name, e.qty, e.calories, e.protein, e.carbs, e.fat]
		);
		return r.lastInsertId;
	},
	async removeFoodEntry(id) {
		const db = await sdb();
		await db.execute('DELETE FROM food_log WHERE id = $1', [id]);
	},
	async addWorkoutEntry(e) {
		const db = await sdb();
		const r = await db.execute(
			'INSERT INTO workout_log (date, exercise, sets, reps, weight) VALUES ($1, $2, $3, $4, $5)',
			[e.date, e.exercise, e.sets, e.reps, e.weight]
		);
		return r.lastInsertId;
	},
	async removeWorkoutEntry(id) {
		const db = await sdb();
		await db.execute('DELETE FROM workout_log WHERE id = $1', [id]);
	}
};

// ---------------------------------------------------------------------------
// localStorage backend (browser dev fallback) — same shape, kept in one blob.
// ---------------------------------------------------------------------------
const LS_KEY = 'gains-tracker-v2';

function blob() {
	try {
		const b = JSON.parse(localStorage.getItem(LS_KEY));
		if (b) return b;
	} catch {
		/* fall through to fresh blob */
	}
	return { targets: null, foods: [], foodLog: {}, workoutLog: {}, seq: 1 };
}
const persist = (b) => localStorage.setItem(LS_KEY, JSON.stringify(b));

const localBackend = {
	async loadAll() {
		const b = blob();
		return { targets: b.targets, foods: b.foods, foodLog: b.foodLog, workoutLog: b.workoutLog };
	},
	async saveTargets(t) {
		const b = blob();
		b.targets = { ...t };
		persist(b);
	},
	async addFoodDef(f) {
		const b = blob();
		const id = b.seq++;
		b.foods.push({ id, ...f });
		persist(b);
		return id;
	},
	async addFoodEntry(e) {
		const b = blob();
		const id = b.seq++;
		(b.foodLog[e.date] ??= []).push({ id, ...e });
		persist(b);
		return id;
	},
	async removeFoodEntry(id) {
		const b = blob();
		for (const k in b.foodLog) b.foodLog[k] = b.foodLog[k].filter((x) => x.id !== id);
		persist(b);
	},
	async addWorkoutEntry(e) {
		const b = blob();
		const id = b.seq++;
		(b.workoutLog[e.date] ??= []).push({ id, ...e });
		persist(b);
		return id;
	},
	async removeWorkoutEntry(id) {
		const b = blob();
		for (const k in b.workoutLog) b.workoutLog[k] = b.workoutLog[k].filter((x) => x.id !== id);
		persist(b);
	}
};

const backend = isTauri ? sqliteBackend : localBackend;

export const {
	loadAll,
	saveTargets,
	addFoodDef,
	addFoodEntry,
	removeFoodEntry,
	addWorkoutEntry,
	removeWorkoutEntry
} = backend;
