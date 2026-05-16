<script lang="ts">
  import { flip } from 'svelte/animate';
  import { fly, scale } from 'svelte/transition';
  import { backOut } from 'svelte/easing';
  import { game } from '../stores/game.svelte';
  import { settings } from '../stores/settings.svelte';
  import { triggerRandomChaos, type ChaosEvent } from '../game/chaos';
  import Dice from '../components/Dice.svelte';
  import PlayerCard from '../components/PlayerCard.svelte';
  import EventLog from '../components/EventLog.svelte';

  let showLog = $state(false);
  let chaosToast = $state<{ event: ChaosEvent; description: string } | null>(
    null,
  );
  let chaosTimer: ReturnType<typeof setTimeout> | null = null;

  function handleRoll(value: number) {
    game.recordRoll(value);
  }

  function next() {
    game.endPlayerTurn();
  }

  const isLastPlayerInRound = $derived(
    game.currentPlayerIndex === game.players.length - 1,
  );

  function buyStar(playerId: string) {
    const ok = confirm(
      `Trade ${settings.value.coinsPerStar} coins for a star?`,
    );
    if (!ok) return;
    game.buyStar(playerId);
  }

  function fireChaos() {
    if (!confirm('Trigger a random chaos event? Anything can happen.')) return;
    const result = triggerRandomChaos();
    chaosToast = result;
    if (chaosTimer) clearTimeout(chaosTimer);
    chaosTimer = setTimeout(() => (chaosToast = null), 4500);
  }

  function dismissChaos() {
    if (chaosTimer) clearTimeout(chaosTimer);
    chaosToast = null;
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
    <div class="round-progress" aria-label="Player progress this round">
      {#each game.players as player, i (player.id)}
        {@const done = i < game.currentPlayerIndex}
        {@const active = i === game.currentPlayerIndex}
        <span
          class="dot"
          class:done
          class:active
          style:--accent={player.color}
          title={player.name}
        ></span>
      {/each}
    </div>
    <div class="header-actions">
      <button class="chaos-btn" type="button" onclick={fireChaos}>
        ⚡ Chaos
      </button>
      <button
        class="log-toggle"
        type="button"
        aria-pressed={showLog}
        onclick={() => (showLog = !showLog)}
      >
        {showLog ? 'Hide' : 'Show'} log
      </button>
    </div>
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
        {isLastPlayerInRound ? 'Next → mini-game' : 'Next player'}
      </button>
    {/if}
  </div>

  {#if chaosToast}
    {@const toast = chaosToast}
    <button
      class="chaos-toast"
      type="button"
      onclick={dismissChaos}
      transition:scale={{ duration: 320, easing: backOut, start: 0.6 }}
    >
      <span class="chaos-emoji">{toast.event.emoji}</span>
      <span class="chaos-name">{toast.event.name}</span>
      <span class="chaos-desc">{toast.description}</span>
      <span class="chaos-dismiss">Tap to dismiss</span>
    </button>
  {/if}

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
  .round-progress {
    display: inline-flex;
    gap: 8px;
    align-items: center;
    padding: 6px 12px;
    background: var(--surface-2);
    border-radius: 999px;
  }
  .round-progress .dot {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--surface-3);
    border: 2px solid var(--surface-3);
    transition:
      background 0.2s ease,
      transform 0.2s ease,
      border-color 0.2s ease,
      box-shadow 0.2s ease;
  }
  .round-progress .dot.done {
    background: var(--accent);
    border-color: var(--accent);
    opacity: 0.5;
  }
  .round-progress .dot.active {
    background: var(--accent);
    border-color: var(--accent);
    transform: scale(1.25);
    box-shadow: 0 0 0 3px rgba(247, 201, 72, 0.18);
  }

  .header-actions {
    display: flex;
    gap: 8px;
    flex: none;
  }
  .log-toggle,
  .chaos-btn {
    font-family: var(--display);
    font-size: 16px;
    padding: 8px 14px;
    border-radius: 12px;
    border: 2px solid var(--border);
    background: var(--surface-2);
    color: var(--text-dim);
    cursor: pointer;
    transition: color 0.15s ease, border-color 0.15s ease, background 0.15s ease;
  }
  .log-toggle:hover {
    color: var(--text);
    border-color: var(--text-dim);
  }
  .chaos-btn {
    color: var(--accent-pink);
    border-color: rgba(255, 93, 143, 0.4);
  }
  .chaos-btn:hover {
    color: white;
    background: var(--accent-pink);
    border-color: var(--accent-pink);
  }

  .chaos-toast {
    position: fixed;
    top: 24px;
    left: 50%;
    transform: translateX(-50%);
    display: grid;
    grid-template-columns: auto 1fr;
    grid-template-areas:
      'emoji name'
      'emoji desc'
      'emoji dismiss';
    column-gap: 16px;
    row-gap: 2px;
    align-items: center;
    background: linear-gradient(140deg, #2a103f, #4a1463);
    border: 3px solid var(--accent-pink);
    border-radius: 20px;
    padding: 16px 22px;
    color: white;
    cursor: pointer;
    box-shadow:
      0 18px 36px -10px rgba(0, 0, 0, 0.6),
      0 0 32px rgba(255, 93, 143, 0.4);
    z-index: 20;
    max-width: min(560px, 92vw);
    text-align: left;
    font: inherit;
  }
  .chaos-emoji {
    grid-area: emoji;
    font-size: 48px;
    line-height: 1;
  }
  .chaos-name {
    grid-area: name;
    font-family: var(--display);
    font-size: 22px;
    color: var(--accent-pink);
  }
  .chaos-desc {
    grid-area: desc;
    font-size: 17px;
    line-height: 1.3;
  }
  .chaos-dismiss {
    grid-area: dismiss;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: var(--text-dim);
    margin-top: 2px;
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
