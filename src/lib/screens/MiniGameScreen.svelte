<script lang="ts">
  import { fade, fly } from 'svelte/transition';
  import type { MiniGame } from '../types';
  import { game } from '../stores/game.svelte';
  import { minigames } from '../stores/minigames.svelte';
  import Avatar from '../components/Avatar.svelte';
  import MiniGameRoulette from '../components/MiniGameRoulette.svelte';

  type Phase = 'rolling' | 'instructions' | 'award';

  const pool = $derived(minigames.value.filter((m) => m.active));

  let phase = $state<Phase>('rolling');
  let chosen = $state<MiniGame | null>(game.selectedMiniGame);
  let winnerIds = $state<Set<string>>(new Set());
  let coinsPerWinner = $state(10);

  function handleLand(g: MiniGame) {
    chosen = g;
    game.selectMiniGame(g);
    // brief pause for the flash before flipping to instructions
    setTimeout(() => {
      phase = 'instructions';
    }, 700);
  }

  function toAward() {
    phase = 'award';
  }

  function toggleWinner(playerId: string) {
    const next = new Set(winnerIds);
    if (next.has(playerId)) next.delete(playerId);
    else next.add(playerId);
    winnerIds = next;
  }

  function award() {
    if (!chosen) return;
    game.awardMiniGame(chosen.id, Array.from(winnerIds), coinsPerWinner);
    winnerIds = new Set();
    coinsPerWinner = 10;
    phase = 'rolling';
    chosen = null;
  }

  function awardNobody() {
    if (!chosen) return;
    game.awardMiniGame(chosen.id, [], 0);
    winnerIds = new Set();
    coinsPerWinner = 10;
    phase = 'rolling';
    chosen = null;
  }
</script>

<section class="minigame">
  {#if pool.length === 0}
    <div class="empty">
      <h2>No mini-games enabled</h2>
      <p>
        Open the mini-game manager and enable at least one game before
        continuing. (Phase 4 will surface that screen directly.)
      </p>
    </div>
  {:else if phase === 'rolling'}
    <div in:fade={{ duration: 200 }}>
      <MiniGameRoulette {pool} onLand={handleLand} />
    </div>
  {:else if phase === 'instructions' && chosen}
    <div class="instructions-pane" in:fly={{ y: 24, duration: 320 }}>
      <span class="kicker">Mini-game</span>
      <h2 class="title">{chosen.name}</h2>
      <div class="meta">
        {#if chosen.category}
          <span class="cat cat-{chosen.category}">{chosen.category}</span>
        {/if}
        {#if chosen.durationMinutes}
          <span class="duration">~{chosen.durationMinutes} min</span>
        {/if}
      </div>
      <p class="body">{chosen.instructions}</p>
      <button class="big-btn primary" type="button" onclick={toAward}>
        Pick winner(s)
      </button>
    </div>
  {:else if phase === 'award' && chosen}
    <div class="award-pane" in:fade={{ duration: 200 }}>
      <span class="kicker">Who won {chosen.name}?</span>
      <div class="winner-grid">
        {#each game.players as player (player.id)}
          {@const selected = winnerIds.has(player.id)}
          <button
            type="button"
            class="winner-tile"
            class:selected
            aria-pressed={selected}
            onclick={() => toggleWinner(player.id)}
          >
            <Avatar
              avatar={player.avatar}
              size={72}
              ring={selected ? player.color : null}
            />
            <span class="winner-name">{player.name}</span>
          </button>
        {/each}
      </div>

      <div class="coin-row">
        <span class="label-text">Coins per winner</span>
        <div class="coin-buttons">
          {#each [5, 10, 15, 20] as amt (amt)}
            <button
              type="button"
              class="coin-btn"
              class:selected={coinsPerWinner === amt}
              onclick={() => (coinsPerWinner = amt)}
            >
              {amt}
            </button>
          {/each}
        </div>
      </div>

      <div class="actions">
        <button class="big-btn secondary" type="button" onclick={awardNobody}>
          No winner
        </button>
        <button
          class="big-btn primary"
          type="button"
          disabled={winnerIds.size === 0}
          onclick={award}
        >
          Award & continue
        </button>
      </div>
    </div>
  {/if}
</section>

<style>
  .minigame {
    max-width: 960px;
    margin: 0 auto;
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 24px;
    min-height: 60vh;
  }
  .empty {
    margin: auto;
    text-align: center;
    color: var(--text-dim);
  }
  .empty h2 {
    font-family: var(--display);
    color: var(--text);
    font-size: 36px;
  }

  .instructions-pane {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 18px;
    text-align: center;
    padding: 16px 0 24px;
  }
  .kicker {
    font-size: 14px;
    text-transform: uppercase;
    letter-spacing: 0.18em;
    color: var(--text-dim);
  }
  .title {
    font-family: var(--display);
    font-size: 64px;
    margin: 4px 0 0;
    color: var(--gold);
    line-height: 1.05;
  }
  .meta {
    display: flex;
    gap: 12px;
    align-items: center;
  }
  .cat {
    font-size: 14px;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    padding: 4px 12px;
    border-radius: 999px;
    background: var(--surface-2);
    font-weight: 600;
  }
  .cat-physical { color: #fb923c; }
  .cat-mental { color: #60a5fa; }
  .cat-silly { color: #ff5d8f; }
  .cat-creative { color: #34d399; }
  .cat-other { color: var(--text-dim); }
  .duration {
    color: var(--text-dim);
    font-size: 16px;
  }
  .body {
    font-size: 26px;
    line-height: 1.45;
    color: var(--text);
    max-width: 780px;
    margin: 12px 0 8px;
  }

  .award-pane {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
  }
  .winner-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 14px;
    width: 100%;
  }
  .winner-tile {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 14px;
    background: var(--surface-1);
    border: 3px solid var(--border);
    border-radius: 20px;
    cursor: pointer;
    transition:
      transform 0.12s ease,
      border-color 0.12s ease;
  }
  .winner-tile:hover {
    transform: translateY(-2px);
  }
  .winner-tile.selected {
    border-color: var(--gold);
    background: var(--surface-2);
  }
  .winner-name {
    font-family: var(--display);
    font-size: 20px;
  }
  .coin-row {
    display: flex;
    flex-direction: column;
    gap: 10px;
    align-items: center;
  }
  .label-text {
    font-size: 14px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--text-dim);
  }
  .coin-buttons {
    display: flex;
    gap: 10px;
  }
  .coin-btn {
    font-family: var(--display);
    font-size: 22px;
    width: 64px;
    height: 56px;
    border-radius: 14px;
    border: 2px solid var(--border);
    background: var(--surface-1);
    color: var(--text);
    cursor: pointer;
  }
  .coin-btn.selected {
    background: var(--gold);
    color: #1a132e;
    border-color: var(--gold);
  }
  .actions {
    display: flex;
    gap: 12px;
    justify-content: center;
    flex-wrap: wrap;
  }
  .big-btn {
    font-family: var(--display);
    font-size: 26px;
    padding: 18px 32px;
    border-radius: 20px;
    border: none;
    cursor: pointer;
    transition:
      transform 0.1s ease,
      box-shadow 0.1s ease;
  }
  .big-btn.primary {
    background: var(--gold);
    color: #1a132e;
    box-shadow: 0 6px 0 #b78a17;
  }
  .big-btn.primary:hover:not(:disabled) {
    transform: translateY(2px);
    box-shadow: 0 4px 0 #b78a17;
  }
  .big-btn.primary:active:not(:disabled) {
    transform: translateY(6px);
    box-shadow: 0 0 0 #b78a17;
  }
  .big-btn.primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    box-shadow: none;
  }
  .big-btn.secondary {
    background: transparent;
    color: var(--text-dim);
    border: 2px solid var(--border);
  }
  .big-btn.secondary:hover {
    color: var(--text);
    border-color: var(--text-dim);
  }
</style>
