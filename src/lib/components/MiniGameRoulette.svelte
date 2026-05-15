<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Tween } from 'svelte/motion';
  import { cubicOut } from 'svelte/easing';
  import type { MiniGame } from '../types';

  interface Props {
    pool: MiniGame[];
    onLand: (chosen: MiniGame) => void;
  }

  let { pool, onLand }: Props = $props();

  const ROW_HEIGHT = 96;
  const SCROLL_COUNT = 24;
  const DURATION_MS = 2500;

  function pickRandom(): MiniGame {
    return pool[Math.floor(Math.random() * pool.length)];
  }

  // Pick the winner up-front, then build a strip that ends on it.
  const winner = pickRandom();

  function buildStrip(): MiniGame[] {
    const strip: MiniGame[] = [];
    for (let i = 0; i < SCROLL_COUNT; i++) {
      strip.push(pickRandom());
    }
    strip.push(winner);
    return strip;
  }

  const strip = buildStrip();
  const targetIndex = strip.length - 1;

  const offset = new Tween(0, {
    duration: DURATION_MS,
    easing: cubicOut,
  });

  let landed = $state(false);
  let landTimer: ReturnType<typeof setTimeout> | null = null;

  onMount(() => {
    offset.target = targetIndex * ROW_HEIGHT;
    landTimer = setTimeout(() => {
      landed = true;
      onLand(winner);
    }, DURATION_MS + 60);
  });

  onDestroy(() => {
    if (landTimer) clearTimeout(landTimer);
  });
</script>

<div class="roulette">
  <p class="kicker">Picking mini-game…</p>
  <div class="frame" class:landed>
    <div class="viewport" style:height="{ROW_HEIGHT}px">
      <div class="strip" style:transform="translateY({-offset.current}px)">
        {#each strip as game, i (i)}
          <div class="row" style:height="{ROW_HEIGHT}px">
            <span class="name">{game.name}</span>
            {#if game.category}
              <span class="cat cat-{game.category}">{game.category}</span>
            {/if}
          </div>
        {/each}
      </div>
    </div>
    <div class="pointer-left" aria-hidden="true">▶</div>
    <div class="pointer-right" aria-hidden="true">◀</div>
  </div>
</div>

<style>
  .roulette {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    padding: 24px 0;
  }
  .kicker {
    font-family: var(--display);
    font-size: 22px;
    color: var(--text-dim);
    margin: 0;
    letter-spacing: 0.04em;
  }
  .frame {
    position: relative;
    width: min(720px, 92vw);
    border-radius: 24px;
    background: linear-gradient(180deg, var(--surface-2), var(--surface-1));
    border: 3px solid var(--border);
    box-shadow:
      0 16px 32px -12px rgba(0, 0, 0, 0.5),
      inset 0 0 0 1px rgba(255, 255, 255, 0.04);
    overflow: hidden;
    transition: box-shadow 0.3s ease, border-color 0.3s ease;
  }
  .frame.landed {
    border-color: var(--gold);
    box-shadow:
      0 16px 48px -8px rgba(247, 201, 72, 0.5),
      inset 0 0 0 1px rgba(255, 255, 255, 0.06);
    animation: flash 0.5s ease;
  }
  @keyframes flash {
    0% {
      filter: brightness(1);
    }
    40% {
      filter: brightness(1.6) saturate(1.3);
    }
    100% {
      filter: brightness(1);
    }
  }
  .viewport {
    overflow: hidden;
    position: relative;
  }
  .viewport::before,
  .viewport::after {
    content: '';
    position: absolute;
    inset-inline: 0;
    height: 18px;
    z-index: 2;
    pointer-events: none;
  }
  .viewport::before {
    top: 0;
    background: linear-gradient(180deg, var(--surface-2), transparent);
  }
  .viewport::after {
    bottom: 0;
    background: linear-gradient(0deg, var(--surface-1), transparent);
  }
  .strip {
    will-change: transform;
  }
  .row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    padding: 0 32px;
    font-family: var(--display);
    font-size: 36px;
    color: var(--text);
    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  }
  .name {
    text-align: center;
  }
  .cat {
    font-size: 14px;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    padding: 4px 10px;
    border-radius: 999px;
    background: var(--surface-3);
    color: var(--text-dim);
    font-family: var(--sans);
    font-weight: 600;
    flex: none;
  }
  .cat-physical { color: #fb923c; }
  .cat-mental { color: #60a5fa; }
  .cat-silly { color: #ff5d8f; }
  .cat-creative { color: #34d399; }
  .pointer-left,
  .pointer-right {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    font-size: 24px;
    color: var(--gold);
    pointer-events: none;
  }
  .pointer-left { left: 8px; }
  .pointer-right { right: 8px; }
</style>
