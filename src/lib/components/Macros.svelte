<script>
	import { state as db, logFood, removeFood, todaysFood, todaysTotals, addCustomFood } from '$lib/state.svelte.js';

	let selectedIdx = $state(0);
	let qty = $state(1);
	let showAdd = $state(false);
	let custom = $state({ name: '', calories: '', protein: '', carbs: '', fat: '' });

	let totals = $derived(todaysTotals());
	let log = $derived(todaysFood());

	const bars = $derived([
		{ key: 'protein', label: 'Protein', unit: 'g', value: totals.protein, target: db.targets.protein },
		{ key: 'calories', label: 'Calories', unit: '', value: totals.calories, target: db.targets.calories },
		{ key: 'carbs', label: 'Carbs', unit: 'g', value: totals.carbs, target: db.targets.carbs },
		{ key: 'fat', label: 'Fat', unit: 'g', value: totals.fat, target: db.targets.fat }
	]);

	function add() {
		logFood(db.foods[selectedIdx], +qty || 1);
	}

	function saveCustom() {
		if (!custom.name.trim()) return;
		addCustomFood(custom);
		custom = { name: '', calories: '', protein: '', carbs: '', fat: '' };
		showAdd = false;
		selectedIdx = db.foods.length - 1;
	}

	const pct = (v, t) => (t > 0 ? Math.min(100, (v / t) * 100) : 0);
</script>

<div class="rings">
	{#each bars as b}
		<div class="ring" class:hit={b.value >= b.target}>
			<div class="ring-label">{b.label}</div>
			<div class="ring-val">{b.value}<span class="ring-target">/{b.target}{b.unit}</span></div>
			<div class="meter"><div class="fill" style="width:{pct(b.value, b.target)}%"></div></div>
			<div class="ring-left">
				{#if b.value >= b.target}done ✓{:else}{Math.round(b.target - b.value)}{b.unit} to go{/if}
			</div>
		</div>
	{/each}
</div>

<div class="card">
	<h3>Log food</h3>
	<div class="add-row">
		<select bind:value={selectedIdx}>
			{#each db.foods as food, i}
				<option value={i}>{food.name} — {food.protein}P / {food.calories}cal</option>
			{/each}
		</select>
		<input class="qty" type="number" min="0.5" step="0.5" bind:value={qty} />
		<span class="x">×</span>
		<button class="primary" onclick={add}>Add</button>
	</div>
	<button class="link" onclick={() => (showAdd = !showAdd)}>
		{showAdd ? '− cancel' : '+ new food to database'}
	</button>

	{#if showAdd}
		<div class="custom">
			<input placeholder="Name" bind:value={custom.name} />
			<input placeholder="Cal" type="number" bind:value={custom.calories} />
			<input placeholder="Protein" type="number" bind:value={custom.protein} />
			<input placeholder="Carbs" type="number" bind:value={custom.carbs} />
			<input placeholder="Fat" type="number" bind:value={custom.fat} />
			<button class="primary" onclick={saveCustom}>Save</button>
		</div>
	{/if}
</div>

<div class="card">
	<h3>Today's food <span class="muted">({log.length})</span></h3>
	{#if log.length === 0}
		<p class="empty">Nothing logged yet. Add your first meal above.</p>
	{:else}
		<ul class="log">
			{#each log as f, i}
				<li>
					<span class="name">{f.qty !== 1 ? `${f.qty}× ` : ''}{f.name}</span>
					<span class="macros">{f.protein}P · {f.calories}cal</span>
					<button class="del" onclick={() => removeFood(i)} aria-label="remove">×</button>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.rings {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 0.75rem;
		margin-bottom: 1rem;
	}
	.ring {
		background: var(--panel);
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 0.85rem;
	}
	.ring.hit {
		border-color: var(--accent);
		box-shadow: 0 0 0 1px var(--accent) inset;
	}
	.ring-label {
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--muted);
	}
	.ring-val {
		font-size: 1.5rem;
		font-weight: 700;
		margin: 0.15rem 0;
	}
	.ring-target {
		font-size: 0.8rem;
		font-weight: 400;
		color: var(--muted);
	}
	.meter {
		height: 6px;
		background: var(--border);
		border-radius: 99px;
		overflow: hidden;
	}
	.fill {
		height: 100%;
		background: var(--accent);
		transition: width 0.3s ease;
	}
	.ring-left {
		font-size: 0.7rem;
		color: var(--muted);
		margin-top: 0.35rem;
	}
	.add-row {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}
	.add-row select {
		flex: 1;
	}
	.qty {
		width: 64px;
	}
	.x {
		color: var(--muted);
	}
	.custom {
		display: flex;
		gap: 0.4rem;
		margin-top: 0.6rem;
		flex-wrap: wrap;
	}
	.custom input {
		flex: 1;
		min-width: 70px;
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
	}
	.log .macros {
		color: var(--muted);
		font-size: 0.85rem;
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
	.link {
		background: none;
		border: none;
		color: var(--accent);
		cursor: pointer;
		padding: 0.5rem 0 0;
		font-size: 0.85rem;
	}
</style>
