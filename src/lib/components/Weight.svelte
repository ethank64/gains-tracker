<script>
	import { state as db, logWeight, removeWeight, weeklyRate } from '$lib/state.svelte.js';

	let input = $state('');

	let log = $derived(db.bodyweightLog);
	let latest = $derived(log.at(-1)?.weight ?? null);
	let rate = $derived(weeklyRate());

	const shortDate = (d) => {
		const [, m, day] = d.split('-');
		return `${+m}/${+day}`;
	};

	async function add() {
		if (!input) return;
		await logWeight(input);
		input = '';
	}

	// Trend status message + tone, based on lb/week.
	let status = $derived.by(() => {
		if (rate === null) return { text: 'Log at least 2 days to see your trend', tone: 'muted' };
		const sign = rate > 0 ? '+' : '';
		const r = `${sign}${rate} lb/wk`;
		if (rate <= 0) return { text: `${r} — not gaining, eat more`, tone: 'warn' };
		if (rate < 0.2) return { text: `${r} — under target, add ~200 cal`, tone: 'warn' };
		if (rate <= 0.6) return { text: `${r} — right on track 🎯`, tone: 'good' };
		return { text: `${r} — fast; some may be fat`, tone: 'warn' };
	});

	// Geometry for the SVG line chart.
	let chart = $derived.by(() => {
		if (!log.length) return null;
		const W = 340,
			H = 180,
			L = 38,
			R = 12,
			T = 14,
			B = 26;
		const pw = W - L - R;
		const ph = H - T - B;
		const goal = db.targets.goalWeight;
		const weights = log.map((e) => e.weight);
		let lo = Math.min(...weights, goal);
		let hi = Math.max(...weights, goal);
		const pad = Math.max(2, (hi - lo) * 0.12);
		lo -= pad;
		hi += pad;
		const t0 = new Date(log[0].date).getTime();
		const t1 = new Date(log[log.length - 1].date).getTime();
		const fx = (d) => {
			const t = new Date(d).getTime();
			return t1 === t0 ? L + pw / 2 : L + ((t - t0) / (t1 - t0)) * pw;
		};
		const fy = (w) => T + (1 - (w - lo) / (hi - lo)) * ph;
		const pts = log.map((e) => ({ x: fx(e.date), y: fy(e.weight), ...e }));
		const path = pts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
		return {
			W, H, L, R, T, B, pw,
			loY: T + ph,
			lo: Math.round(lo),
			hi: Math.round(hi),
			goal,
			goalY: fy(goal),
			pts,
			path,
			first: shortDate(log[0].date),
			last: shortDate(log[log.length - 1].date)
		};
	});
</script>

<div class="card">
	<div class="head">
		<div>
			<div class="muted label">Current</div>
			<div class="big">{latest ?? db.targets.bodyweight}<span class="unit">lb</span></div>
		</div>
		<div class="goal">
			<div class="muted label">Goal</div>
			<div class="big accent">{db.targets.goalWeight}<span class="unit">lb</span></div>
		</div>
	</div>
	<div class="trend {status.tone}">{status.text}</div>
</div>

<div class="card">
	<h3>Log today's weight</h3>
	<div class="add-row">
		<input
			type="number"
			step="0.1"
			placeholder={`${db.targets.bodyweight}`}
			bind:value={input}
			onkeydown={(e) => e.key === 'Enter' && add()}
		/>
		<span class="unit">lb</span>
		<button class="primary" onclick={add}>Log</button>
	</div>
</div>

<div class="card">
	<h3>Trend</h3>
	{#if !chart}
		<p class="empty">No weigh-ins yet. Log your weight above to start the chart.</p>
	{:else}
		<svg class="chart" viewBox="0 0 {chart.W} {chart.H}" role="img" aria-label="Bodyweight over time">
			<!-- y-axis bounds -->
			<text x={chart.L - 6} y={chart.T + 4} class="axis" text-anchor="end">{chart.hi}</text>
			<text x={chart.L - 6} y={chart.loY} class="axis" text-anchor="end">{chart.lo}</text>
			<!-- goal line -->
			<line x1={chart.L} y1={chart.goalY} x2={chart.W - chart.R} y2={chart.goalY} class="goal-line" />
			<text x={chart.W - chart.R} y={chart.goalY - 4} class="axis goal-label" text-anchor="end">
				goal {chart.goal}
			</text>
			<!-- weight line + points -->
			<path d={chart.path} class="line" fill="none" />
			{#each chart.pts as p}
				<circle cx={p.x} cy={p.y} r="3" class="dot" />
			{/each}
			<!-- x-axis ends -->
			<text x={chart.L} y={chart.H - 8} class="axis" text-anchor="start">{chart.first}</text>
			<text x={chart.W - chart.R} y={chart.H - 8} class="axis" text-anchor="end">{chart.last}</text>
		</svg>
	{/if}

	{#if log.length}
		<ul class="log">
			{#each [...log].reverse() as e}
				<li>
					<span class="d">{shortDate(e.date)}</span>
					<span class="w">{e.weight} lb</span>
					<button class="del" onclick={() => removeWeight(e.date)} aria-label="remove">×</button>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.head {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
	}
	.label {
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}
	.big {
		font-size: 2rem;
		font-weight: 800;
		line-height: 1.1;
	}
	.big.accent {
		color: var(--accent);
	}
	.goal {
		text-align: right;
	}
	.unit {
		font-size: 0.9rem;
		font-weight: 400;
		color: var(--muted);
		margin-left: 2px;
	}
	.trend {
		margin-top: 0.75rem;
		padding-top: 0.7rem;
		border-top: 1px solid var(--border);
		font-size: 0.9rem;
		font-weight: 600;
	}
	.trend.good {
		color: var(--accent);
	}
	.trend.warn {
		color: #ffb454;
	}
	.trend.muted {
		color: var(--muted);
		font-weight: 400;
	}
	.add-row {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}
	.add-row input {
		flex: 1;
	}
	.chart {
		width: 100%;
		height: auto;
		display: block;
	}
	.line {
		stroke: var(--accent);
		stroke-width: 2;
		stroke-linejoin: round;
		stroke-linecap: round;
	}
	.dot {
		fill: var(--accent);
	}
	.goal-line {
		stroke: var(--muted);
		stroke-width: 1;
		stroke-dasharray: 4 3;
		opacity: 0.6;
	}
	.axis {
		fill: var(--muted);
		font-size: 9px;
	}
	.goal-label {
		opacity: 0.8;
	}
	.empty {
		color: var(--muted);
	}
	.log {
		list-style: none;
		padding: 0;
		margin: 0.9rem 0 0;
	}
	.log li {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		padding: 0.5rem 0;
		border-bottom: 1px solid var(--border);
	}
	.log .d {
		color: var(--muted);
		width: 56px;
	}
	.log .w {
		flex: 1;
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
	.muted {
		color: var(--muted);
	}
</style>
