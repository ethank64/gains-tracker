// Central reactive state for Gains Tracker.
// Uses Svelte 5 runes ($state) and persists everything to localStorage so your
// data survives app restarts. Single-device, fully local — no server involved.
import { browser } from '$app/environment';

const STORAGE_KEY = 'gains-tracker-v1';

// Starter food database — your grocery-store staples, with macros per common
// serving. Edit/add to this freely in the app; changes are saved.
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

function load() {
	if (!browser) return null;
	try {
		return JSON.parse(localStorage.getItem(STORAGE_KEY));
	} catch {
		return null;
	}
}

const saved = load();

export const state = $state({
	targets: { ...DEFAULT_TARGETS, ...(saved?.targets ?? {}) },
	foods: saved?.foods ?? DEFAULT_FOODS,
	foodLog: saved?.foodLog ?? {}, // { 'YYYY-MM-DD': [ {name, qty, calories, protein, carbs, fat} ] }
	workoutLog: saved?.workoutLog ?? {} // { 'YYYY-MM-DD': [ {exercise, sets, reps, weight} ] }
});

// Auto-save on any change. JSON.stringify reads every nested field, so the
// effect re-runs whenever anything in the tree mutates.
if (browser) {
	$effect.root(() => {
		$effect(() => {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
		});
	});
}

// ---- helpers ----

const round = (n) => Math.round(n * 10) / 10;

export function todayKey() {
	const d = new Date();
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function logFood(food, qty = 1) {
	const k = todayKey();
	if (!state.foodLog[k]) state.foodLog[k] = [];
	state.foodLog[k].push({
		name: food.name,
		qty,
		calories: round(food.calories * qty),
		protein: round(food.protein * qty),
		carbs: round(food.carbs * qty),
		fat: round(food.fat * qty)
	});
}

export function removeFood(i) {
	const k = todayKey();
	state.foodLog[k]?.splice(i, 1);
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

export function addCustomFood(food) {
	state.foods.push({
		name: food.name,
		calories: +food.calories || 0,
		protein: +food.protein || 0,
		carbs: +food.carbs || 0,
		fat: +food.fat || 0
	});
}

export function logWorkout(exercise, sets, reps, weight) {
	const k = todayKey();
	if (!state.workoutLog[k]) state.workoutLog[k] = [];
	state.workoutLog[k].push({
		exercise: exercise.trim(),
		sets: +sets,
		reps: +reps,
		weight: +weight
	});
}

export function removeWorkout(i) {
	const k = todayKey();
	state.workoutLog[k]?.splice(i, 1);
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
		const hit = [...state.workoutLog[k]]
			.reverse()
			.find((w) => w.exercise.toLowerCase() === name);
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
