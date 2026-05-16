<script lang="ts">
  import { fade, fly } from 'svelte/transition';
  import { flip } from 'svelte/animate';
  import { game } from '../stores/game.svelte';
  import Avatar from '../components/Avatar.svelte';
  import Dice from '../components/Dice.svelte';

  // Local roll state, keyed by player id. Independent from the game
  // store so a tie re-roll just resets the tied entries.
  let rolls = $state<Record<string, number | null>>(
    Object.fromEntries(game.players.map((p) => [p.id, null])),
  );

  // Re-initialise local state if the player list changes (e.g. user
  // navigates back and starts over).
  $effect(() => {
    const ids = new Set(game.players.map((p) => p.id));
    const currentIds = new Set(Object.keys(rolls));
    const sameSet =
      ids.size === currentIds.size &&
      [...ids].every((id) => currentIds.has(id));
    if (!sameSet) {
      rolls = Object.fromEntries(game.players.map((p) => [p.id, null]));
    }
  });

  function record(playerId: string, value: number) {
    rolls = { ...rolls, [playerId]: value };
  }

  const allRolled = $derived(
    game.players.every((p) => rolls[p.id] !== null && rolls[p.id] !== undefined),
  );

  // Sorted by roll desc, then by original setup order (stable).
  const ordered = $derived.by(() => {
    if (!allRolled) return [];
    return [...game.players].sort((a, b) => {
      const av = rolls[a.id] ?? 0;
      const bv = rolls[b.id] ?? 0;
      return bv - av;
    });
  });

  // A tie exists if any two adjacent ordered players share a roll.
  const hasTies = $derived.by(() => {
    if (!allRolled) return false;
    for (let i = 0; i < ordered.length - 1; i++) {
      if (rolls[ordered[i].id] === rolls[ordered[i + 1].id]) return true;
    }
    return false;
  });

  // The set of player ids that share a roll value with someone else.
  const tiedIds = $derived.by(() => {
    const out = new Set<string>();
    if (!allRolled) return out;
    const byVal = new Map<number, string[]>();
    for (const [id, v] of Object.entries(rolls)) {
      if (v === null) continue;
      const list = byVal.get(v) ?? [];
      list.push(id);
      byVal.set(v, list);
    }
    for (const [, ids] of byVal) {
      if (ids.length > 1) ids.forEach((id) => out.add(id));
    }
    return out;
  });

  function rerollTies() {
    const cleared: Record<string, number | null> = { ...rolls };
    tiedIds.forEach((id) => (cleared[id] = null));
    rolls = cleared;
  }

  function begin() {
    if (!allRolled) return;
    game.applyTurnOrder(ordered.map((p) => p.id));
  }
</script>

<section class="order">
  <header in:fade={{ duration: 300 }}>
    <span class="kicker">Round 0</span>
    <h1 class="title">Roll for turn order</h1>
    <p class="subtitle">Highest roll goes first.</p>
  </header>

  <div class="grid cols-{game.players.length}">
    {#each game.players as player (player.id)}
      {@const value = rolls[player.id]}
      {@const tied = tiedIds.has(player.id)}
      <div
        class="card"
        class:rolled={value !== null}
        class:tied
        style:--accent={player.color}
        in:fly={{ y: 24, duration: 400 }}
      >
        <Avatar avatar={player.avatar} size={88} ring={player.color} />
        <div class="name">{player.name}</div>
        <Dice
          size={140}
          initial={value}
          disabled={value !== null}
          hint={value === null ? 'Tap' : ''}
          onRoll={(v) => record(player.id, v)}
        />
        {#if value !== null}
          <div class="status" class:tied-status={tied}>
            {tied ? 'Tied — re-roll!' : 'Locked in'}
          </div>
        {:else}
          <div class="status waiting">Waiting…</div>
        {/if}
      </div>
    {/each}
  </div>

  {#if allRolled}
    <div class="result" in:fly={{ y: 16, duration: 320 }}>
      <h2>Turn order</h2>
      <ol class="ranking">
        {#each ordered as player, i (player.id)}
          <li
            animate:flip={{ duration: 320 }}
            class:tied={tiedIds.has(player.id)}
          >
            <span class="position">#{i + 1}</span>
            <Avatar avatar={player.avatar} size={40} ring={player.color} />
            <span class="rank-name">{player.name}</span>
            <span class="rank-roll">rolled <strong>{rolls[player.id]}</strong></span>
          </li>
        {/each}
      </ol>

      <div class="actions">
        {#if hasTies}
          <button class="ghost" type="button" onclick={rerollTies}>
            Re-roll tied players
          </button>
          <button class="primary muted" type="button" onclick={begin}>
            Begin anyway →
          </button>
        {:else}
          <button class="primary" type="button" onclick={begin}>
            Begin game →
          </button>
        {/if}
      </div>
    </div>
  {/if}
</section>

<style>
  .order {
    max-width: 1100px;
    margin: 0 auto;
    padding: 32px 24px 64px;
    display: flex;
    flex-direction: column;
    gap: 28px;
  }
  header {
    text-align: center;
  }
  .kicker {
    font-size: 14px;
    text-transform: uppercase;
    letter-spacing: 0.18em;
    color: var(--text-dim);
  }
  .title {
    font-family: var(--display);
    font-size: 56px;
    margin: 4px 0 4px;
    color: var(--gold);
  }
  .subtitle {
    margin: 0;
    color: var(--text-dim);
    font-size: 20px;
  }

  .grid {
    display: grid;
    gap: 18px;
  }
  .cols-2 { grid-template-columns: repeat(2, 1fr); }
  .cols-3 { grid-template-columns: repeat(3, 1fr); }
  .cols-4 { grid-template-columns: repeat(4, 1fr); }
  @media (max-width: 800px) {
    .cols-3,
    .cols-4 {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  .card {
    background: var(--surface-1);
    border: 3px solid var(--border);
    border-radius: 24px;
    padding: 18px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    transition:
      border-color 0.25s ease,
      transform 0.25s ease,
      box-shadow 0.25s ease;
  }
  .card.rolled {
    border-color: var(--accent);
    box-shadow: 0 10px 24px -10px rgba(0, 0, 0, 0.5);
  }
  .card.tied {
    border-color: var(--danger);
    animation: tied-shake 0.6s ease-in-out;
  }
  @keyframes tied-shake {
    0%, 100% { transform: translateX(0); }
    20% { transform: translateX(-3px); }
    40% { transform: translateX(3px); }
    60% { transform: translateX(-2px); }
    80% { transform: translateX(2px); }
  }
  .name {
    font-family: var(--display);
    font-size: 22px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 100%;
  }
  .status {
    font-family: var(--display);
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--text-dim);
  }
  .status.tied-status {
    color: var(--danger);
  }
  .status.waiting {
    opacity: 0.7;
  }

  .result {
    background: var(--surface-1);
    border: 2px solid var(--border);
    border-radius: 20px;
    padding: 20px 22px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .result h2 {
    font-family: var(--display);
    margin: 0;
    font-size: 24px;
    color: var(--text);
  }
  .ranking {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .ranking li {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 12px;
    border-radius: 12px;
    background: var(--surface-2);
  }
  .ranking li.tied {
    background: rgba(239, 68, 68, 0.12);
  }
  .position {
    font-family: var(--display);
    font-size: 22px;
    color: var(--gold);
    width: 40px;
  }
  .rank-name {
    font-family: var(--display);
    font-size: 20px;
    flex: 1;
  }
  .rank-roll {
    color: var(--text-dim);
    font-size: 15px;
  }
  .rank-roll strong {
    color: var(--text);
    font-family: var(--display);
    font-size: 22px;
    margin-left: 4px;
  }

  .actions {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
    flex-wrap: wrap;
    margin-top: 4px;
  }
  .primary,
  .ghost {
    font-family: var(--display);
    font-size: 20px;
    padding: 14px 24px;
    border-radius: 16px;
    cursor: pointer;
    border: none;
    transition:
      transform 0.1s ease,
      box-shadow 0.1s ease;
  }
  .primary {
    background: var(--gold);
    color: #1a132e;
    box-shadow: 0 6px 0 #b78a17;
  }
  .primary:hover {
    transform: translateY(2px);
    box-shadow: 0 4px 0 #b78a17;
  }
  .primary:active {
    transform: translateY(6px);
    box-shadow: 0 0 0 #b78a17;
  }
  .primary.muted {
    background: var(--surface-3);
    color: var(--text);
    box-shadow: 0 6px 0 var(--border);
  }
  .primary.muted:hover {
    box-shadow: 0 4px 0 var(--border);
  }
  .primary.muted:active {
    box-shadow: 0 0 0 var(--border);
  }
  .ghost {
    background: transparent;
    color: var(--text);
    border: 2px solid var(--danger);
  }
  .ghost:hover {
    background: rgba(239, 68, 68, 0.12);
  }
</style>
