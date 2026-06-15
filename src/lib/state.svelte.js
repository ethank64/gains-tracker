// Central reactive state for Gains Tracker.
// `state` is the in-memory, reactive source of truth the UI renders from.
// Persistence is delegated to the storage adapter in db.js — SQLite inside the
// Tauri app, localStorage in the browser. Every mutation updates `state` AND
// writes through to the backend; on startup initStore() hydrates from it.
import {
	loadAll,
	saveTargets,
	addFoodDef,
	addFoodEntry,
	removeFoodEntry,
	addWorkoutEntry,
	removeWorkoutEntry
} from '$lib/db.js';

// Starter food database — grocery-store staples, macros per common serving.
const DEFAULT_FOODS = [
	{ name: 'Whey protein (1 scoop)', calories: 120, protein: 25, carbs: 3, fat: 1.5 },
	{ name: 'Protein shake (Core Power)', calories: 170, protein: 26, carbs: 9, fat: 4.5 },
	{ name: 'Rotisserie chicken (4 oz)', calories: 220, protein: 35, carbs: 0, fat: 9 },
	{ name: 'Chicken breast (4 oz)', calories: 185, protein: 35, carbs: 0, fat: 4 },
	{ name: 'Greek yogurt, 2% (1 cup)', calories: 150, protein: 20, carbs: 9, fat: 4 },
	{ name: 'Cottage cheese, 2% (1 cup)', calories: 180, protein: 24, carbs: 8, fat: 5 },
	{ name: 'Egg (1 large)', calories: 72, protein: 6, carbs: 0.4, fat: 5 },
	{ name: 'Canned tuna (1 can, 5 oz)', calories: 100, protein: 22, carbs: 0, fat: 1 },
	{ name: 'Deli turkey (3 slices)', calories: 60, protein: 11, carbs: 1, fat: 1 },
	{ name: 'Whole milk (1 cup)', calories: 150, protein: 8, carbs: 12, fat: 8 },
	{ name: 'Fairlife milk (1 cup)', calories: 120, protein: 13, carbs: 6, fat: 4.5 },
	{ name: 'Oats, dry (1/2 cup)', calories: 150, protein: 5, carbs: 27, fat: 3 },
	{ name: 'Rice pouch (1 pouch)', calories: 280, protein: 6, carbs: 52, fat: 4 },
	{ name: 'White rice, cooked (1 cup)', calories: 205, protein: 4, carbs: 45, fat: 0.4 },
	{ name: 'Bagel (1 plain)', calories: 270, protein: 11, carbs: 53, fat: 1.5 },
	{ name: 'Banana (1 medium)', calories: 105, protein: 1.3, carbs: 27, fat: 0.4 },
	{ name: 'Peanut butter (2 tbsp)', calories: 190, protein: 7, carbs: 8, fat: 16 },
	{ name: 'Almonds (1 oz)', calories: 165, protein: 6, carbs: 6, fat: 14 },
	{ name: 'Avocado (1/2)', calories: 120, protein: 1.5, carbs: 6, fat: 11 },
	{ name: 'Olive oil (1 tbsp)', calories: 120, protein: 0, carbs: 0, fat: 14 }
];

const DEFAULT_TARGETS = {
	bodyweight: 150,
	goalWeight: 170,
	calories: 2700,
	protein: 160,
	carbs: 365,
	fat: 65
};

export const state = $state({
	ready: false, // flips true once data is loaded from the backend
	targets: { ...DEFAULT_TARGETS },
	foods: [],
	foodLog: {}, // { 'YYYY-MM-DD': [ {id, name, qty, calories, protein, carbs, fat} ] }
	workoutLog: {} // { 'YYYY-MM-DD': [ {id, exercise, sets, reps, weight} ] }
});

// Persist target edits (they come from bind:value in the Settings tab, so there's
// no helper to hook). Re-runs whenever a target field changes; the `ready` guard
// stops it from firing during the initial hydrate.
$effect.root(() => {
	$effect(() => {
		const t = state.targets;
		const snapshot = {
			bodyweight: t.bodyweight,
			goalWeight: t.goalWeight,
			calories: t.calories,
			protein: t.protein,
			carbs: t.carbs,
			fat: t.fat
		};
		if (state.ready) saveTargets(snapshot);
	});
});

// Load everything from the backend, seeding defaults on first run.
export async function initStore() {
	if (state.ready) return;
	const data = await loadAll();

	if (data.targets) {
		state.targets = data.targets;
	} else {
		await saveTargets(DEFAULT_TARGETS);
		state.targets = { ...DEFAULT_TARGETS };
	}

	if (data.foods?.length) {
		state.foods = data.foods;
	} else {
		const seeded = [];
		for (const f of DEFAULT_FOODS) seeded.push({ id: await addFoodDef(f), ...f });
		state.foods = seeded;
	}

	state.foodLog = data.foodLog ?? {};
	state.workoutLog = data.workoutLog ?? {};
	state.ready = true;
}

// ---- helpers ----

const round = (n) => Math.round(n * 10) / 10;

export function todayKey() {
	const d = new Date();
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export async function logFood(food, qty = 1) {
	const k = todayKey();
	const entry = {
		date: k,
		name: food.name,
		qty,
		calories: round(food.calories * qty),
		protein: round(food.protein * qty),
		carbs: round(food.carbs * qty),
		fat: round(food.fat * qty)
	};
	const id = await addFoodEntry(entry);
	if (!state.foodLog[k]) state.foodLog[k] = [];
	state.foodLog[k].push({ id, ...entry });
}

export async function removeFood(i) {
	const k = todayKey();
	const entry = state.foodLog[k]?.[i];
	if (!entry) return;
	await removeFoodEntry(entry.id);
	state.foodLog[k].splice(i, 1);
}

export function todaysFood() {
	return state.foodLog[todayKey()] ?? [];
}

export function todaysTotals() {
	return todaysFood().reduce(
		(t, f) => ({
			calories: round(t.calories + f.calories),
			protein: round(t.protein + f.protein),
			carbs: round(t.carbs + f.carbs),
			fat: round(t.fat + f.fat)
		}),
		{ calories: 0, protein: 0, carbs: 0, fat: 0 }
	);
}

export async function addCustomFood(food) {
	const f = {
		name: food.name,
		calories: +food.calories || 0,
		protein: +food.protein || 0,
		carbs: +food.carbs || 0,
		fat: +food.fat || 0
	};
	const id = await addFoodDef(f);
	state.foods.push({ id, ...f });
}

export async function logWorkout(exercise, sets, reps, weight) {
	const k = todayKey();
	const entry = {
		date: k,
		exercise: exercise.trim(),
		sets: +sets,
		reps: +reps,
		weight: +weight
	};
	const id = await addWorkoutEntry(entry);
	if (!state.workoutLog[k]) state.workoutLog[k] = [];
	state.workoutLog[k].push({ id, ...entry });
}

export async function removeWorkout(i) {
	const k = todayKey();
	const entry = state.workoutLog[k]?.[i];
	if (!entry) return;
	await removeWorkoutEntry(entry.id);
	state.workoutLog[k].splice(i, 1);
}

export function todaysWorkouts() {
	return state.workoutLog[todayKey()] ?? [];
}

// Most recent prior session for an exercise (so you know what to beat).
export function lastSession(exercise) {
	const tk = todayKey();
	const name = exercise.trim().toLowerCase();
	if (!name) return null;
	const keys = Object.keys(state.workoutLog)
		.filter((k) => k !== tk)
		.sort()
		.reverse();
	for (const k of keys) {
		const hit = [...state.workoutLog[k]].reverse().find((w) => w.exercise.toLowerCase() === name);
		if (hit) return { date: k, ...hit };
	}
	return null;
}

// Heaviest weight ever logged for an exercise.
export function prFor(exercise) {
	const name = exercise.trim().toLowerCase();
	if (!name) return 0;
	let max = 0;
	for (const k of Object.keys(state.workoutLog)) {
		for (const w of state.workoutLog[k]) {
			if (w.exercise.toLowerCase() === name) max = Math.max(max, w.weight);
		}
	}
	return max;
}

// Distinct exercise names you've logged before (for autocomplete).
export function knownExercises() {
	const set = new Set();
	for (const k of Object.keys(state.workoutLog)) {
		for (const w of state.workoutLog[k]) set.add(w.exercise);
	}
	return [...set].sort();
}
