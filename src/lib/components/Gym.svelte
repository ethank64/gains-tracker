<script>
	import { logWorkout, removeWorkout, todaysWorkouts, lastSession, prFor, knownExercises } from '$lib/state.svelte.js';

	let exercise = $state('');
	let sets = $state(3);
	let reps = $state(8);
	let weight = $state('');

	let workouts = $derived(todaysWorkouts());
	let last = $derived(lastSession(exercise));
	let pr = $derived(prFor(exercise));
	let exercises = $derived(knownExercises());

	function add() {
		if (!exercise.trim() || !weight) return;
		logWorkout(exercise, sets, reps, weight);
		// keep the exercise selected so you can log the next one fast
		weight = '';
	}
</script>

<div class="card">
	<h3>Log a lift</h3>
	<div class="form">
		<input
			class="ex"
			list="known-ex"
			placeholder="Exercise (e.g. Bench press)"
			bind:value={exercise}
		/>
		<datalist id="known-ex">
			{#each exercises as e}<option value={e}></option>{/each}
		</datalist>
		<div class="nums">
			<label>Sets<input type="number" min="1" bind:value={sets} /></label>
			<label>Reps<input type="number" min="1" bind:value={reps} /></label>
			<label>Weight (lb)<input type="number" min="0" step="2.5" bind:value={weight} /></label>
		</div>
		<button class="primary" onclick={add}>Log set</button>
	</div>

	{#if exercise.trim()}
		<div class="hint">
			{#if last}
				<span class="last">Last time ({last.date}): <b>{last.sets}×{last.reps} @ {last.weight}lb</b></span>
			{:else}
				<span class="last">No prior day logged yet — set your baseline 💪</span>
			{/if}
			{#if pr > 0}<span class="pr">PR: {pr}lb 🏆</span>{/if}
			{#if weight && pr > 0 && +weight > pr}<span class="new-pr">↑ that's a new PR!</span>{/if}
		</div>
	{/if}
</div>

<div class="card">
	<h3>Today's session <span class="muted">({workouts.length})</span></h3>
	{#if workouts.length === 0}
		<p class="empty">No lifts logged yet. Get after it.</p>
	{:else}
		<ul class="log">
			{#each workouts as w, i}
				<li>
					<span class="name">{w.exercise}</span>
					<span class="detail">{w.sets}×{w.reps} @ {w.weight}lb</span>
					<button class="del" onclick={() => removeWorkout(i)} aria-label="remove">×</button>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.form {
		display: flex;
		flex-direction: column;
		gap: 0.7rem;
	}
	.ex {
		width: 100%;
	}
	.nums {
		display: flex;
		gap: 0.6rem;
	}
	.nums label {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		font-size: 0.72rem;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--muted);
	}
	.hint {
		margin-top: 0.85rem;
		padding-top: 0.7rem;
		border-top: 1px solid var(--border);
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
		font-size: 0.85rem;
		align-items: center;
	}
	.last {
		color: var(--text);
	}
	.pr {
		color: var(--muted);
	}
	.new-pr {
		color: var(--accent);
		font-weight: 700;
	}
	.log {
		list-style: none;
		padding: 0;
		margin: 0;
	}
	.log li {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		padding: 0.55rem 0;
		border-bottom: 1px solid var(--border);
	}
	.log .name {
		flex: 1;
		font-weight: 600;
	}
	.log .detail {
		color: var(--muted);
		font-variant-numeric: tabular-nums;
	}
	.del {
		background: transparent;
		border: none;
		color: var(--muted);
		font-size: 1.2rem;
		line-height: 1;
		cursor: pointer;
		padding: 0 0.3rem;
	}
	.del:hover {
		color: #ff5c5c;
	}
	.empty {
		color: var(--muted);
	}
	.muted {
		color: var(--muted);
		font-weight: 400;
	}
</style>
