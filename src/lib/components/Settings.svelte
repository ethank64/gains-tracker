<script>
	import { state } from '$lib/state.svelte.js';

	// Suggested numbers derived from goal weight, so you can sanity-check edits.
	let suggestedProtein = $derived(Math.round(state.targets.goalWeight));
	let suggestedCalories = $derived(Math.round(state.targets.bodyweight * 18));

	function applySuggested() {
		state.targets.protein = suggestedProtein;
		state.targets.calories = suggestedCalories;
		// fat ~0.4g/lb bodyweight, carbs fill the rest
		state.targets.fat = Math.round(state.targets.bodyweight * 0.4);
		const remaining = state.targets.calories - state.targets.protein * 4 - state.targets.fat * 9;
		state.targets.carbs = Math.max(0, Math.round(remaining / 4));
	}
</script>

<div class="card">
	<h3>Your targets</h3>
	<div class="grid">
		<label>Bodyweight (lb)<input type="number" bind:value={state.targets.bodyweight} /></label>
		<label>Goal weight (lb)<input type="number" bind:value={state.targets.goalWeight} /></label>
		<label>Protein (g)<input type="number" bind:value={state.targets.protein} /></label>
		<label>Calories<input type="number" bind:value={state.targets.calories} /></label>
		<label>Carbs (g)<input type="number" bind:value={state.targets.carbs} /></label>
		<label>Fat (g)<input type="number" bind:value={state.targets.fat} /></label>
	</div>
	<button class="primary" onclick={applySuggested}>Recalculate from goal weight</button>
</div>

<div class="card guidance">
	<h3>The plan</h3>
	<ul>
		<li><b>Protein:</b> ~1g per lb of goal weight → <b>{suggestedProtein}g/day</b>. The number that matters most.</li>
		<li><b>Calories:</b> lean-bulk surplus → start ~<b>{suggestedCalories}</b>. Track the scale for 2 weeks.</li>
		<li><b>Target gain:</b> +0.25–0.5 lb/week. Not moving up? +200 cal. Gaining too fast? Ease back.</li>
		<li><b>Progressive overload:</b> each session, try to beat last time's weight or reps. That's what builds muscle.</li>
	</ul>
	<p class="disclaimer">
		General fitness guidance, not medical advice. Check with a doctor before big diet changes if you
		have any conditions.
	</p>
</div>

<style>
	.grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.7rem;
		margin-bottom: 0.9rem;
	}
	.grid label {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		font-size: 0.72rem;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--muted);
	}
	.guidance ul {
		margin: 0 0 0.8rem;
		padding-left: 1.1rem;
		line-height: 1.7;
	}
	.guidance li {
		margin-bottom: 0.3rem;
	}
	.disclaimer {
		font-size: 0.78rem;
		color: var(--muted);
		border-top: 1px solid var(--border);
		padding-top: 0.7rem;
		margin: 0;
	}
</style>
