<script lang="ts">
  import { game } from '../stores/game.svelte';
  import Avatar from '../components/Avatar.svelte';

  // Phase 1: stubbed mini-game flow. Phase 2 replaces this with the roulette
  // reveal and real mini-game instructions.
  let winnerIds = $state<Set<string>>(new Set());
  let coinsPerWinner = $state(10);

  function toggleWinner(playerId: string) {
    const next = new Set(winnerIds);
    if (next.has(playerId)) {
      next.delete(playerId);
    } else {
      next.add(playerId);
    }
    winnerIds = next;
  }

  function award() {
    game.awardMiniGame(
      'phase-1-stub',
      Array.from(winnerIds),
      coinsPerWinner,
    );
    winnerIds = new Set();
    coinsPerWinner = 10;
  }

  function awardNobody() {
    game.awardMiniGame('phase-1-stub', [], 0);
    winnerIds = new Set();
    coinsPerWinner = 10;
  }
</script>

<section class="minigame">
  <header class="header">
    <span class="kicker">Mini-game</span>
    <h2 class="title">Placeholder Mini-Game</h2>
    <p class="instructions">
      Phase 2 will land a roulette pick and real instructions here. For now,
      pretend the players just played a round of something and award coins.
    </p>
  </header>

  <div class="winner-section">
    <span class="label-text">Tap winner(s)</span>
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
          <Avatar avatar={player.avatar} size={72} ring={selected ? player.color : null} />
          <span class="winner-name">{player.name}</span>
        </button>
      {/each}
    </div>
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
</section>

<style>
  .minigame {
    max-width: 960px;
    margin: 0 auto;
    padding: 32px 24px;
    display: flex;
    flex-direction: column;
    gap: 28px;
  }
  .header {
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
    margin: 4px 0 16px;
    color: var(--gold);
  }
  .instructions {
    font-size: 22px;
    line-height: 1.5;
    color: var(--text);
    max-width: 720px;
    margin: 0 auto;
  }
  .winner-section,
  .coin-row {
    display: flex;
    flex-direction: column;
    gap: 12px;
    align-items: center;
  }
  .label-text {
    font-size: 14px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--text-dim);
  }
  .winner-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
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
    font-size: 24px;
    padding: 18px 28px;
    border-radius: 18px;
    border: none;
    cursor: pointer;
  }
  .big-btn.primary {
    background: var(--gold);
    color: #1a132e;
    box-shadow: 0 6px 0 #b78a17;
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
