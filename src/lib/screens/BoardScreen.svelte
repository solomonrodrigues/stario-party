<script lang="ts">
  import { game } from '../stores/game.svelte';
  import { settings } from '../stores/settings.svelte';
  import Avatar from '../components/Avatar.svelte';

  function roll() {
    const value = Math.floor(Math.random() * 10) + 1;
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
</script>

<section class="board">
  <header class="header">
    <div class="turn-pill">
      Turn <strong>{game.currentTurn}</strong> / {game.totalTurns}
    </div>
    <h2 class="now-playing">
      {game.currentPlayer?.name ?? '—'}<span class="possessive">'s turn</span>
    </h2>
  </header>

  <div class="players">
    {#each game.players as player, i (player.id)}
      {@const active = i === game.currentPlayerIndex}
      {@const canBuy = player.coins >= settings.value.coinsPerStar}
      <div class="card" class:active style:--accent={player.color}>
        <Avatar avatar={player.avatar} size={96} ring={active ? player.color : null} />
        <div class="card-name">{player.name}</div>
        <div class="stats">
          <div class="stat coin">
            <span class="icon" aria-hidden="true">●</span>
            <span class="value">{player.coins}</span>
          </div>
          <div class="stat star">
            <span class="icon" aria-hidden="true">★</span>
            <span class="value">{player.stars}</span>
          </div>
        </div>
        {#if active && canBuy}
          <button class="buy-star" type="button" onclick={() => buyStar(player.id)}>
            Buy star ({settings.value.coinsPerStar}🪙)
          </button>
        {/if}
      </div>
    {/each}
  </div>

  <div class="action-area">
    {#if game.lastRoll === null}
      <button class="big-btn roll" type="button" onclick={roll}>
        Roll the dice
      </button>
    {:else}
      <div class="roll-result">
        Rolled <strong>{game.lastRoll}</strong>
      </div>
      <button class="big-btn next" type="button" onclick={next}>
        Next → mini-game
      </button>
    {/if}
  </div>
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
    font-size: 48px;
    margin: 0;
    color: var(--text);
  }
  .possessive {
    color: var(--text-dim);
    font-weight: normal;
  }
  .players {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 16px;
  }
  .card {
    background: var(--surface-1);
    border: 3px solid var(--border);
    border-radius: 24px;
    padding: 18px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    transition:
      transform 0.2s ease,
      border-color 0.2s ease,
      box-shadow 0.2s ease;
  }
  .card.active {
    border-color: var(--accent);
    transform: translateY(-4px);
    box-shadow: 0 12px 24px -8px rgba(0, 0, 0, 0.4);
  }
  .card-name {
    font-family: var(--display);
    font-size: 24px;
    color: var(--text);
  }
  .stats {
    display: flex;
    gap: 16px;
    font-family: var(--display);
    font-size: 28px;
  }
  .stat {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .stat.coin .icon {
    color: var(--gold);
  }
  .stat.star .icon {
    color: var(--star);
  }
  .buy-star {
    margin-top: 4px;
    font-family: var(--display);
    font-size: 16px;
    padding: 8px 14px;
    border: 2px solid var(--gold);
    background: transparent;
    color: var(--gold);
    border-radius: 12px;
    cursor: pointer;
  }
  .buy-star:hover {
    background: var(--gold);
    color: #1a132e;
  }
  .action-area {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }
  .big-btn {
    font-family: var(--display);
    font-size: 36px;
    padding: 22px 36px;
    border-radius: 24px;
    border: none;
    cursor: pointer;
    transition:
      transform 0.1s ease,
      box-shadow 0.1s ease;
  }
  .roll {
    background: var(--gold);
    color: #1a132e;
    box-shadow: 0 6px 0 #b78a17;
  }
  .roll:hover {
    transform: translateY(2px);
    box-shadow: 0 4px 0 #b78a17;
  }
  .roll:active {
    transform: translateY(6px);
    box-shadow: 0 0 0 #b78a17;
  }
  .next {
    background: var(--accent-purple);
    color: white;
    box-shadow: 0 6px 0 #5b21b6;
  }
  .next:hover {
    transform: translateY(2px);
    box-shadow: 0 4px 0 #5b21b6;
  }
  .next:active {
    transform: translateY(6px);
    box-shadow: 0 0 0 #5b21b6;
  }
  .roll-result {
    font-family: var(--display);
    font-size: 32px;
    color: var(--text);
  }
  .roll-result strong {
    color: var(--gold);
    font-size: 56px;
    margin-left: 8px;
  }
</style>
