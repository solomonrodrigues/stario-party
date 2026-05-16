<script lang="ts">
  import { onMount } from 'svelte';
  import { fly, fade } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import { game } from '../stores/game.svelte';
  import { rankPlayers } from '../game/logic';
  import { play } from '../sound/sfx';
  import Avatar from '../components/Avatar.svelte';
  import EventLog from '../components/EventLog.svelte';

  const ranked = $derived(rankPlayers(game.players));

  onMount(() => {
    const fanfareDelay = 250 + ranked.length * 350;
    const t = setTimeout(() => play('fanfare'), fanfareDelay);
    return () => clearTimeout(t);
  });
</script>

<section class="results">
  <header in:fade={{ duration: 400 }}>
    <span class="kicker">Game over</span>
    <h1 class="title">Final Standings</h1>
  </header>

  <ol class="ranks">
    {#each ranked as player, i (player.id)}
      <li
        class="rank"
        class:winner={i === 0}
        in:fly={{
          y: 32,
          duration: 520,
          delay: 250 + (ranked.length - 1 - i) * 350,
          easing: quintOut,
        }}
        style:--accent={player.color}
      >
        <div class="position">#{i + 1}</div>
        <Avatar avatar={player.avatar} size={88} ring={player.color} />
        <div class="info">
          <div class="name">{player.name}</div>
          <div class="stats">
            <span class="stat">
              <strong>{player.stars}</strong>
              <span class="ico star">★</span>
            </span>
            <span class="stat">
              <strong>{player.coins}</strong>
              <span class="ico coin">●</span>
            </span>
          </div>
        </div>
        {#if i === 0}
          <div class="crown" aria-hidden="true">👑</div>
        {/if}
      </li>
    {/each}
  </ol>

  <section
    class="recap"
    in:fade={{ duration: 400, delay: 250 + ranked.length * 350 }}
  >
    <h2 class="recap-title">Recap</h2>
    <div class="recap-body">
      <EventLog entries={game.log} players={game.players} />
    </div>
  </section>

  <button
    class="play-again"
    type="button"
    onclick={() => game.reset()}
    in:fade={{ duration: 300, delay: 350 + ranked.length * 350 }}
  >
    Play again
  </button>
</section>

<style>
  .results {
    max-width: 920px;
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
    padding: 14px 18px;
    position: relative;
    border-left: 6px solid var(--accent);
  }
  .rank.winner {
    border-color: var(--gold);
    border-left-color: var(--gold);
    box-shadow: 0 0 40px rgba(247, 201, 72, 0.35);
    animation: winner-pulse 2.5s ease-in-out 800ms infinite;
  }
  @keyframes winner-pulse {
    0%,
    100% {
      box-shadow: 0 0 40px rgba(247, 201, 72, 0.35);
    }
    50% {
      box-shadow: 0 0 56px rgba(247, 201, 72, 0.6);
    }
  }
  .position {
    font-family: var(--display);
    font-size: 36px;
    width: 60px;
    color: var(--text-dim);
  }
  .rank.winner .position {
    color: var(--gold);
    font-size: 44px;
  }
  .info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }
  .name {
    font-family: var(--display);
    font-size: 28px;
  }
  .stats {
    display: flex;
    gap: 18px;
    align-items: center;
  }
  .stat {
    display: inline-flex;
    align-items: baseline;
    gap: 6px;
    font-family: var(--display);
  }
  .stat strong {
    font-size: 26px;
    color: var(--text);
  }
  .ico.coin {
    color: var(--gold);
  }
  .ico.star {
    color: var(--star);
  }
  .crown {
    font-size: 44px;
    animation: crown-bounce 1.8s ease-in-out infinite;
  }
  @keyframes crown-bounce {
    0%,
    100% {
      transform: translateY(0) rotate(-4deg);
    }
    50% {
      transform: translateY(-6px) rotate(4deg);
    }
  }
  .recap {
    background: var(--surface-1);
    border: 2px solid var(--border);
    border-radius: 20px;
    padding: 20px;
  }
  .recap-title {
    font-family: var(--display);
    font-size: 26px;
    margin: 0 0 12px;
  }
  .recap-body {
    max-height: 340px;
    overflow-y: auto;
    padding-right: 4px;
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
    transition:
      transform 0.1s ease,
      box-shadow 0.1s ease;
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
