<script lang="ts">
  import { flip } from 'svelte/animate';
  import { fly } from 'svelte/transition';
  import { game } from '../stores/game.svelte';
  import { settings } from '../stores/settings.svelte';
  import Dice from '../components/Dice.svelte';
  import PlayerCard from '../components/PlayerCard.svelte';
  import EventLog from '../components/EventLog.svelte';

  let showLog = $state(false);

  function handleRoll(value: number) {
    game.recordRoll(value);
  }

  function next() {
    game.goToMiniGame();
  }

  function buyStar(playerId: string) {
    const ok = confirm(
      `Trade ${settings.value.coinsPerStar} coins for a star?`,
    );
    if (!ok) return;
    game.buyStar(playerId);
  }

  // Active player floats to the front of the list so animate:flip slides
  // it into place each turn.
  const orderedPlayers = $derived.by(() => {
    const list = [...game.players];
    const idx = game.currentPlayerIndex;
    if (idx >= 0 && idx < list.length) {
      const [active] = list.splice(idx, 1);
      list.unshift(active);
    }
    return list;
  });
</script>

<section class="board">
  <header class="header">
    <div class="turn-pill">
      Turn <strong>{game.currentTurn}</strong> / {game.totalTurns}
    </div>
    <h2 class="now-playing">
      {game.currentPlayer?.name ?? '—'}<span class="possessive">'s turn</span>
    </h2>
    <button
      class="log-toggle"
      type="button"
      aria-pressed={showLog}
      onclick={() => (showLog = !showLog)}
    >
      {showLog ? 'Hide' : 'Show'} log
    </button>
  </header>

  <div class="players">
    {#each orderedPlayers as player (player.id)}
      {@const active = player.id === game.currentPlayer?.id}
      <div animate:flip={{ duration: 380 }} class="player-wrap">
        <PlayerCard
          {player}
          {active}
          affordableStar={player.coins >= settings.value.coinsPerStar}
          starCost={settings.value.coinsPerStar}
          onBuyStar={() => buyStar(player.id)}
        />
      </div>
    {/each}
  </div>

  <div class="action-area">
    <Dice
      onRoll={handleRoll}
      disabled={game.lastRoll !== null}
      initial={game.lastRoll}
    />
    {#if game.lastRoll !== null}
      <button class="next-btn" type="button" onclick={next}>
        Next → mini-game
      </button>
    {/if}
  </div>

  {#if showLog}
    <aside class="log-panel" transition:fly={{ x: 360, duration: 280 }}>
      <header class="log-panel-header">
        <h3>Event log</h3>
        <button
          class="close"
          type="button"
          aria-label="Close log"
          onclick={() => (showLog = false)}
        >
          ×
        </button>
      </header>
      <div class="log-panel-body">
        <EventLog entries={game.log} players={game.players} />
      </div>
    </aside>
  {/if}
</section>

<style>
  .board {
    max-width: 1200px;
    margin: 0 auto;
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
  }
  .turn-pill {
    font-family: var(--display);
    font-size: 22px;
    background: var(--surface-2);
    padding: 8px 18px;
    border-radius: 999px;
    color: var(--text-dim);
  }
  .turn-pill strong {
    color: var(--gold);
  }
  .now-playing {
    font-family: var(--display);
    font-size: 44px;
    margin: 0;
    color: var(--text);
    flex: 1 1 auto;
    text-align: center;
  }
  .possessive {
    color: var(--text-dim);
    font-weight: normal;
  }
  .log-toggle {
    font-family: var(--display);
    font-size: 16px;
    padding: 8px 14px;
    border-radius: 12px;
    border: 2px solid var(--border);
    background: var(--surface-2);
    color: var(--text-dim);
    cursor: pointer;
    transition: color 0.15s ease, border-color 0.15s ease;
  }
  .log-toggle:hover {
    color: var(--text);
    border-color: var(--text-dim);
  }
  .players {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 16px;
  }
  .player-wrap {
    display: flex;
  }
  .player-wrap > :global(.card) {
    width: 100%;
  }
  .action-area {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }
  .next-btn {
    font-family: var(--display);
    font-size: 28px;
    padding: 18px 32px;
    border-radius: 20px;
    border: none;
    cursor: pointer;
    background: var(--accent-purple);
    color: white;
    box-shadow: 0 6px 0 #5b21b6;
    transition:
      transform 0.1s ease,
      box-shadow 0.1s ease;
  }
  .next-btn:hover {
    transform: translateY(2px);
    box-shadow: 0 4px 0 #5b21b6;
  }
  .next-btn:active {
    transform: translateY(6px);
    box-shadow: 0 0 0 #5b21b6;
  }

  .log-panel {
    position: fixed;
    top: 0;
    right: 0;
    height: 100svh;
    width: min(380px, 92vw);
    background: var(--surface-1);
    border-left: 2px solid var(--border);
    display: flex;
    flex-direction: column;
    box-shadow: -16px 0 32px -12px rgba(0, 0, 0, 0.6);
    z-index: 10;
  }
  .log-panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid var(--border);
  }
  .log-panel-header h3 {
    font-family: var(--display);
    margin: 0;
    font-size: 22px;
  }
  .close {
    background: transparent;
    border: none;
    color: var(--text-dim);
    font-size: 26px;
    line-height: 1;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 8px;
  }
  .close:hover {
    color: var(--text);
    background: var(--surface-2);
  }
  .log-panel-body {
    flex: 1;
    overflow-y: auto;
    padding: 12px 16px;
  }
</style>
