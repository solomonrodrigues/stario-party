<script lang="ts">
  import type { Player } from '../types';
  import Avatar from './Avatar.svelte';
  import CoinCounter from './CoinCounter.svelte';

  interface Props {
    player: Player;
    active?: boolean;
    affordableStar?: boolean;
    starCost?: number;
    onBuyStar?: () => void;
  }

  let {
    player,
    active = false,
    affordableStar = false,
    starCost,
    onBuyStar,
  }: Props = $props();
</script>

<div class="card" class:active style:--accent={player.color}>
  <Avatar
    avatar={player.avatar}
    size={96}
    ring={active ? player.color : null}
  />
  <div class="name">{player.name}</div>
  <div class="stats">
    <CoinCounter value={player.coins} icon="coin" />
    <CoinCounter value={player.stars} icon="star" />
  </div>
  {#if active && affordableStar && onBuyStar}
    <button class="buy-star" type="button" onclick={onBuyStar}>
      Buy star · {starCost}🪙
    </button>
  {/if}
</div>

<style>
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
      transform 0.25s ease,
      border-color 0.25s ease,
      box-shadow 0.25s ease;
  }
  .card.active {
    border-color: var(--accent);
    transform: translateY(-4px);
    box-shadow: 0 12px 24px -8px rgba(0, 0, 0, 0.45);
  }
  .name {
    font-family: var(--display);
    font-size: 26px;
    color: var(--text);
    text-align: center;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 100%;
  }
  .stats {
    display: flex;
    gap: 18px;
  }
  .buy-star {
    margin-top: 4px;
    font-family: var(--display);
    font-size: 15px;
    padding: 8px 14px;
    border: 2px solid var(--gold);
    background: transparent;
    color: var(--gold);
    border-radius: 12px;
    cursor: pointer;
    transition:
      background 0.15s ease,
      color 0.15s ease,
      transform 0.1s ease;
  }
  .buy-star:hover {
    background: var(--gold);
    color: #1a132e;
    transform: translateY(-1px);
  }
</style>
