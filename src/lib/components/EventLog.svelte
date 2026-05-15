<script lang="ts">
  import type { LogEntry, Player } from '../types';
  import { minigames } from '../stores/minigames.svelte';
  import Avatar from './Avatar.svelte';

  interface Props {
    entries: LogEntry[];
    players: Player[];
    emptyMessage?: string;
  }

  let {
    entries,
    players,
    emptyMessage = 'Nothing yet — start playing!',
  }: Props = $props();

  const playerById = $derived(
    new Map(players.map((p) => [p.id, p] as const)),
  );
  const minigameById = $derived(
    new Map(minigames.value.map((g) => [g.id, g] as const)),
  );

  function playerName(id: string): string {
    return playerById.get(id)?.name ?? 'Someone';
  }

  function minigameName(id: string): string {
    return minigameById.get(id)?.name ?? 'a mini-game';
  }

  const reversed = $derived([...entries].reverse());
</script>

<div class="log">
  {#if reversed.length === 0}
    <p class="empty">{emptyMessage}</p>
  {:else}
    <ul>
      {#each reversed as entry, idx (entries.length - 1 - idx)}
        <li class="entry">
          <span class="turn">T{entry.turn}</span>
          {#if entry.kind === 'roll'}
            {@const p = playerById.get(entry.playerId)}
            <span class="line">
              {#if p}
                <Avatar avatar={p.avatar} size={28} />
              {/if}
              <span class="text">
                <strong>{playerName(entry.playerId)}</strong>
                rolled
                <span class="hl">{entry.value}</span>
              </span>
            </span>
          {:else if entry.kind === 'minigame'}
            <span class="line">
              <span class="icon" aria-hidden="true">🎲</span>
              <span class="text">
                <strong>{minigameName(entry.miniGameId)}</strong>
                —
                {#if entry.winnerIds.length === 0}
                  no winner
                {:else}
                  <span class="hl">
                    {entry.winnerIds.map((id) => playerName(id)).join(', ')}
                  </span>
                  +{entry.coinsAwarded}🪙
                {/if}
              </span>
            </span>
          {:else if entry.kind === 'star-purchase'}
            {@const p = playerById.get(entry.playerId)}
            <span class="line">
              {#if p}
                <Avatar avatar={p.avatar} size={28} />
              {/if}
              <span class="text">
                <strong>{playerName(entry.playerId)}</strong>
                bought a <span class="hl star">★</span>
              </span>
            </span>
          {:else if entry.kind === 'chaos'}
            <span class="line">
              <span class="icon" aria-hidden="true">⚡</span>
              <span class="text">{entry.description}</span>
            </span>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .log {
    width: 100%;
  }
  .empty {
    color: var(--text-dim);
    text-align: center;
    padding: 24px;
    margin: 0;
  }
  ul {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .entry {
    display: flex;
    align-items: center;
    gap: 10px;
    background: var(--surface-2);
    padding: 8px 12px;
    border-radius: 12px;
    font-size: 16px;
  }
  .turn {
    flex: none;
    font-family: var(--display);
    font-size: 12px;
    color: var(--text-dim);
    background: var(--surface-3);
    padding: 3px 8px;
    border-radius: 999px;
    min-width: 36px;
    text-align: center;
  }
  .line {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }
  .text {
    color: var(--text);
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .icon {
    font-size: 18px;
  }
  strong {
    font-family: var(--display);
    font-weight: 600;
  }
  .hl {
    color: var(--gold);
    font-family: var(--display);
  }
  .hl.star {
    color: var(--star);
  }
</style>
