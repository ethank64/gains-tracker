<script>
	import { onMount } from 'svelte';
	import { state as store, initStore } from '$lib/state.svelte.js';
	import Macros from '$lib/components/Macros.svelte';
	import Gym from '$lib/components/Gym.svelte';
	import Settings from '$lib/components/Settings.svelte';

	onMount(initStore);

	const tabs = [
		{ id: 'macros', label: '🍗 Macros' },
		{ id: 'gym', label: '🏋️ Gym' },
		{ id: 'settings', label: '⚙️ Targets' }
	];
	let active = $state('macros');
</script>

<main>
	<header>
		<h1>GAINS<span class="dot">.</span></h1>
		<p class="sub">150 → 170 · let's build</p>
	</header>

	<nav>
		{#each tabs as t}
			<button class:active={active === t.id} onclick={() => (active = t.id)}>{t.label}</button>
		{/each}
	</nav>

	<section>
		{#if !store.ready}
			<p class="loading">Loading your data…</p>
		{:else if active === 'macros'}
			<Macros />
		{:else if active === 'gym'}
			<Gym />
		{:else}
			<Settings />
		{/if}
	</section>
</main>

<style>
	:global(:root) {
		--bg: #0d0f12;
		--panel: #16191e;
		--border: #262b33;
		--text: #e8ebef;
		--muted: #8a93a0;
		--accent: #b6ff3a;
	}
	:global(body) {
		margin: 0;
		background: var(--bg);
		color: var(--text);
		font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
		-webkit-font-smoothing: antialiased;
	}
	main {
		max-width: 640px;
		margin: 0 auto;
		padding: 1.5rem 1.25rem 3rem;
	}
	header {
		margin-bottom: 1.25rem;
	}
	h1 {
		margin: 0;
		font-size: 2rem;
		font-weight: 800;
		letter-spacing: 0.02em;
	}
	.dot {
		color: var(--accent);
	}
	.sub {
		margin: 0.1rem 0 0;
		color: var(--muted);
		font-size: 0.85rem;
	}
	nav {
		display: flex;
		gap: 0.4rem;
		margin-bottom: 1.25rem;
		background: var(--panel);
		padding: 0.3rem;
		border-radius: 12px;
		border: 1px solid var(--border);
	}
	nav button {
		flex: 1;
		background: transparent;
		border: none;
		color: var(--muted);
		padding: 0.55rem;
		border-radius: 9px;
		cursor: pointer;
		font-size: 0.9rem;
		font-weight: 600;
		transition: all 0.15s;
	}
	nav button.active {
		background: var(--accent);
		color: #0d0f12;
	}
	.loading {
		text-align: center;
		color: var(--muted);
		padding: 2rem 0;
	}

	/* Shared element styling, available to all tab components via :global */
	:global(.card) {
		background: var(--panel);
		border: 1px solid var(--border);
		border-radius: 14px;
		padding: 1.1rem;
		margin-bottom: 1rem;
	}
	:global(.card h3) {
		margin: 0 0 0.85rem;
		font-size: 0.95rem;
	}
	:global(input),
	:global(select) {
		background: var(--bg);
		border: 1px solid var(--border);
		color: var(--text);
		border-radius: 9px;
		padding: 0.55rem 0.6rem;
		font-size: 0.9rem;
		font-family: inherit;
		box-sizing: border-box;
	}
	:global(input:focus),
	:global(select:focus) {
		outline: none;
		border-color: var(--accent);
	}
	:global(button.primary) {
		background: var(--accent);
		color: #0d0f12;
		border: none;
		border-radius: 9px;
		padding: 0.55rem 1rem;
		font-weight: 700;
		font-size: 0.9rem;
		cursor: pointer;
		white-space: nowrap;
	}
	:global(button.primary:hover) {
		filter: brightness(1.08);
	}
</style>
