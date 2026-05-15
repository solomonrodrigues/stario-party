<script lang="ts">
  import type { Player } from '../types';
  import { game } from '../stores/game.svelte';
  import Avatar from '../components/Avatar.svelte';

  function rank(players: Player[]): Player[] {
    return [...players].sort((a, b) => {
      if (b.stars !== a.stars) return b.stars - a.stars;
      return b.coins - a.coins;
    });
  }

  const ranked = $derived(rank(game.players));
</script>

<section class="results">
  <header>
    <span class="kicker">Game over</span>
    <h1 class="title">Final Standings</h1>
  </header>

  <ol class="ranks">
    {#each ranked as player, i (player.id)}
      <li class="rank" class:winner={i === 0}>
        <div class="position">#{i + 1}</div>
        <Avatar avatar={player.avatar} size={88} ring={player.color} />
        <div class="info">
          <div class="name">{player.name}</div>
          <div class="stats">
            <span class="stat"><strong>{player.stars}</strong> ★</span>
            <span class="stat"><strong>{player.coins}</strong> 🪙</span>
          </div>
        </div>
        {#if i === 0}
          <div class="crown" aria-hidden="true">👑</div>
        {/if}
      </li>
    {/each}
  </ol>

  <button class="play-again" type="button" onclick={() => game.reset()}>
    Play again
  </button>
</section>

<style>
  .results {
    max-width: 880px;
    margin: 0 auto;
    padding: 32px 24px 64px;
    display: flex;
    flex-direction: column;
    gap: 24px;
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
    font-size: 64px;
    margin: 4px 0 0;
    color: var(--gold);
  }
  .ranks {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .rank {
    display: flex;
    align-items: center;
    gap: 16px;
    background: var(--surface-1);
    border: 3px solid var(--border);
    border-radius: 20px;
    padding: 16px 20px;
    position: relative;
  }
  .rank.winner {
    border-color: var(--gold);
    box-shadow: 0 0 32px rgba(247, 201, 72, 0.3);
  }
  .position {
    font-family: var(--display);
    font-size: 36px;
    width: 60px;
    color: var(--text-dim);
  }
  .rank.winner .position {
    color: var(--gold);
  }
  .info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .name {
    font-family: var(--display);
    font-size: 28px;
  }
  .stats {
    display: flex;
    gap: 16px;
    color: var(--text-dim);
    font-size: 18px;
  }
  .stats strong {
    color: var(--text);
    font-family: var(--display);
    font-size: 22px;
    margin-right: 2px;
  }
  .crown {
    font-size: 40px;
  }
  .play-again {
    align-self: center;
    font-family: var(--display);
    font-size: 28px;
    padding: 18px 36px;
    border-radius: 20px;
    border: none;
    background: var(--accent-purple);
    color: white;
    cursor: pointer;
    box-shadow: 0 6px 0 #5b21b6;
  }
  .play-again:hover {
    transform: translateY(2px);
    box-shadow: 0 4px 0 #5b21b6;
  }
  .play-again:active {
    transform: translateY(6px);
    box-shadow: 0 0 0 #5b21b6;
  }
</style>
