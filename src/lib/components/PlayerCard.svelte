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
    position: relative;
    background: var(--surface-1);
    border: 1px solid var(--border);
    border-radius: 18px;
    padding: 20px 18px 18px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    transition:
      transform 0.2s ease,
      border-color 0.2s ease,
      background 0.2s ease;
  }
  .card.active {
    transform: translateY(-4px);
    background: var(--surface-2);
    border-color: var(--accent);
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
    margin-top: 6px;
    font-family: var(--display);
    font-weight: 600;
    font-size: 15px;
    padding: 9px 16px;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    color: #43320a;
    background: var(--gold);
    transition:
      background 0.15s ease,
      transform 0.08s ease;
  }
  .buy-star:hover {
    background: #ffd45e;
  }
  .buy-star:active {
    transform: translateY(1px);
  }
</style>
