<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Tween } from 'svelte/motion';
  import { quintOut, cubicOut } from 'svelte/easing';
  import type { MiniGame } from '../types';
  import { play } from '../sound/sfx';

  interface Props {
    pool: MiniGame[];
    onLand: (chosen: MiniGame) => void;
  }

  let { pool, onLand }: Props = $props();

  // Slot-machine geometry: three rows are visible at once, the middle band is
  // the selection window. The strip scrolls up until the winner lands centre.
  const ROW_HEIGHT = 88;
  const VISIBLE_ROWS = 3;
  const SCROLL_COUNT = 30;
  const WINDUP_MS = 380;
  const SPIN_MS = 2900;
  const WINDUP_PX = ROW_HEIGHT * 0.55;

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
  // Centre the winner in the middle band of the 3-row window.
  const targetOffset = (targetIndex - 1) * ROW_HEIGHT;

  // Deterministic burst of sparkles for the lock-in moment.
  const sparkles = Array.from({ length: 14 }, (_, i) => {
    const angle = (i / 14) * Math.PI * 2 + (i % 2 ? 0.4 : 0);
    const dist = 90 + (i % 4) * 34;
    return {
      x: Math.cos(angle) * dist,
      y: Math.sin(angle) * dist * 0.7,
      delay: (i % 5) * 26,
      size: 8 + (i % 3) * 5,
    };
  });

  const offset = new Tween(0, { duration: SPIN_MS, easing: quintOut });

  let phase = $state<'spin' | 'landed'>('spin');
  const landed = $derived(phase === 'landed');
  const timers: ReturnType<typeof setTimeout>[] = [];

  // Schedule a tick each time a row crosses the selection window. quintOut
  // means the rows fan out toward the end, so the drumroll naturally slows
  // from a buzz to suspenseful single clicks before locking in.
  function scheduleTicks(): void {
    let lastPlayed = -Infinity;
    for (let i = 2; i <= targetIndex; i++) {
      const p = (i - 1) / (targetIndex - 1);
      const t = 1 - Math.pow(1 - p, 1 / 5); // inverse of quintOut
      const at = t * SPIN_MS;
      // Thin out the opening flurry so it reads as a roll, not a buzz.
      if (at - lastPlayed < 32) continue;
      lastPlayed = at;
      const isLast = i === targetIndex;
      timers.push(
        setTimeout(() => {
          play(isLast ? 'dice-land' : 'dice-tick');
        }, at),
      );
    }
  }

  onMount(() => {
    play('roulette-start');
    // Wind back a touch, then launch — the anticipation beat before the spin.
    void offset.set(-WINDUP_PX, { duration: WINDUP_MS, easing: cubicOut });
    timers.push(
      setTimeout(() => {
        scheduleTicks();
        void offset.set(targetOffset, { duration: SPIN_MS, easing: quintOut });
      }, WINDUP_MS),
    );
    timers.push(
      setTimeout(() => {
        phase = 'landed';
        play('roulette-land');
        onLand(winner);
      }, WINDUP_MS + SPIN_MS + 40),
    );
  });

  onDestroy(() => {
    for (const t of timers) clearTimeout(t);
  });
</script>

<div class="roulette">
  <p class="kicker" class:landed>
    {#if landed}
      ★ Mini-Game! ★
    {:else}
      Choosing mini-game<span class="dots"></span>
    {/if}
  </p>

  <div class="frame" class:landed class:spinning={!landed}>
    <div
      class="viewport"
      style:height="{ROW_HEIGHT * VISIBLE_ROWS}px"
    >
      <div
        class="strip"
        class:spinning={!landed}
        style:transform="translateY({-offset.current}px)"
      >
        {#each strip as game, i (i)}
          <div
            class="row cat-{game.category ?? 'other'}"
            class:is-winner={landed && i === targetIndex}
            style:height="{ROW_HEIGHT}px"
          >
            <span class="name">{game.name}</span>
            {#if game.category}
              <span class="cat">{game.category}</span>
            {/if}
          </div>
        {/each}
      </div>

      <!-- The fixed selection window framing the centre band. -->
      <div class="selection" class:landed aria-hidden="true">
        <span class="bracket tl"></span>
        <span class="bracket tr"></span>
        <span class="bracket bl"></span>
        <span class="bracket br"></span>
      </div>
    </div>

    <div class="pointer-left" aria-hidden="true">▶</div>
    <div class="pointer-right" aria-hidden="true">◀</div>

    {#if landed}
      <div class="burst" aria-hidden="true">
        {#each sparkles as s, i (i)}
          <span
            class="sparkle"
            style:--x="{s.x}px"
            style:--y="{s.y}px"
            style:--d="{s.delay}ms"
            style:width="{s.size}px"
            style:height="{s.size}px"
          ></span>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .roulette {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 18px;
    padding: 24px 0;
  }
  .kicker {
    font-family: var(--display);
    font-size: 24px;
    color: var(--text-dim);
    margin: 0;
    letter-spacing: 0.05em;
    transition: color 0.2s ease;
  }
  .kicker.landed {
    color: var(--gold);
    font-size: 30px;
    text-shadow: 0 0 18px rgba(247, 201, 72, 0.6);
    animation: pop-in 0.4s cubic-bezier(0.2, 1.5, 0.4, 1);
  }
  .dots::after {
    content: '';
    animation: dots 1.1s steps(4, end) infinite;
  }
  @keyframes dots {
    0% { content: ''; }
    25% { content: '.'; }
    50% { content: '..'; }
    75% { content: '...'; }
  }
  @keyframes pop-in {
    0% { transform: scale(0.5); opacity: 0; }
    100% { transform: scale(1); opacity: 1; }
  }

  .frame {
    position: relative;
    width: min(720px, 92vw);
    border-radius: 28px;
    padding: 6px;
    background: linear-gradient(180deg, var(--velvet), var(--velvet-deep));
    border: 3px solid var(--border-strong);
    box-shadow:
      0 18px 40px -14px rgba(0, 0, 0, 0.6),
      inset 0 0 0 1px rgba(255, 255, 255, 0.05);
    overflow: hidden;
    transition:
      box-shadow 0.3s ease,
      border-color 0.3s ease,
      transform 0.3s ease;
  }
  .frame.spinning {
    animation: jitter 0.12s linear infinite;
  }
  @keyframes jitter {
    0%, 100% { transform: translate(0, 0); }
    25% { transform: translate(-0.6px, 0.4px); }
    75% { transform: translate(0.6px, -0.4px); }
  }
  .frame.landed {
    border-color: var(--gold);
    box-shadow:
      0 0 0 4px rgba(247, 201, 72, 0.25),
      0 18px 56px -8px rgba(247, 201, 72, 0.55),
      inset 0 0 0 1px rgba(255, 255, 255, 0.08);
    animation: flash 0.55s ease;
  }
  @keyframes flash {
    0% { filter: brightness(1); }
    35% { filter: brightness(1.8) saturate(1.4); }
    100% { filter: brightness(1); }
  }

  .viewport {
    position: relative;
    overflow: hidden;
    border-radius: 22px;
    background: radial-gradient(
      120% 80% at 50% 50%,
      var(--surface-2),
      var(--surface-1)
    );
  }
  .viewport::before,
  .viewport::after {
    content: '';
    position: absolute;
    inset-inline: 0;
    height: 38%;
    z-index: 3;
    pointer-events: none;
  }
  .viewport::before {
    top: 0;
    background: linear-gradient(180deg, rgba(8, 8, 11, 0.92), transparent);
  }
  .viewport::after {
    bottom: 0;
    background: linear-gradient(0deg, rgba(8, 8, 11, 0.92), transparent);
  }

  .strip {
    will-change: transform;
  }
  .strip.spinning {
    filter: blur(0.6px);
  }

  .row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    padding: 0 40px;
    font-family: var(--display);
    font-size: 34px;
    color: var(--text);
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    --accent: var(--text-dim);
    box-shadow: inset 4px 0 0 color-mix(in srgb, var(--accent) 60%, transparent);
    transition:
      transform 0.3s cubic-bezier(0.2, 1.4, 0.4, 1),
      color 0.3s ease;
  }
  .row.is-winner {
    color: var(--gold);
    transform: scale(1.06);
    text-shadow: 0 0 16px rgba(247, 201, 72, 0.55);
  }
  .name {
    text-align: center;
  }
  .cat {
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    padding: 4px 10px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--accent) 22%, transparent);
    color: var(--accent);
    font-family: var(--sans);
    font-weight: 700;
    flex: none;
  }
  .cat-physical { --accent: #fb923c; }
  .cat-mental { --accent: #60a5fa; }
  .cat-silly { --accent: #ff5d8f; }
  .cat-creative { --accent: #34d399; }
  .cat-other { --accent: var(--text-dim); }

  /* The fixed selection window over the centre band. */
  .selection {
    position: absolute;
    inset-inline: 8px;
    top: 33.333%;
    height: 33.333%;
    z-index: 4;
    pointer-events: none;
    border-radius: 16px;
    box-shadow:
      inset 0 0 0 2px rgba(247, 201, 72, 0.35),
      0 0 22px rgba(247, 201, 72, 0.15);
    transition: box-shadow 0.3s ease;
  }
  .selection.landed {
    box-shadow:
      inset 0 0 0 3px var(--gold),
      0 0 36px rgba(247, 201, 72, 0.5);
  }
  .bracket {
    position: absolute;
    width: 16px;
    height: 16px;
    border: 3px solid var(--gold);
  }
  .tl { top: -2px; left: -2px; border-right: none; border-bottom: none; border-top-left-radius: 8px; }
  .tr { top: -2px; right: -2px; border-left: none; border-bottom: none; border-top-right-radius: 8px; }
  .bl { bottom: -2px; left: -2px; border-right: none; border-top: none; border-bottom-left-radius: 8px; }
  .br { bottom: -2px; right: -2px; border-left: none; border-top: none; border-bottom-right-radius: 8px; }

  .pointer-left,
  .pointer-right {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    font-size: 26px;
    color: var(--gold);
    z-index: 5;
    pointer-events: none;
    filter: drop-shadow(0 0 6px rgba(247, 201, 72, 0.6));
  }
  .frame.landed .pointer-left { animation: nudge-r 0.4s ease; }
  .frame.landed .pointer-right { animation: nudge-l 0.4s ease; }
  @keyframes nudge-r {
    50% { transform: translate(6px, -50%); }
  }
  @keyframes nudge-l {
    50% { transform: translate(-6px, -50%); }
  }
  .pointer-left { left: 10px; }
  .pointer-right { right: 10px; }

  .burst {
    position: absolute;
    inset: 0;
    z-index: 6;
    pointer-events: none;
  }
  .sparkle {
    position: absolute;
    top: 50%;
    left: 50%;
    border-radius: 50%;
    background: radial-gradient(circle, #fff, var(--gold) 60%, transparent 72%);
    transform: translate(-50%, -50%) scale(0);
    animation: sparkle 0.7s ease-out var(--d) forwards;
  }
  @keyframes sparkle {
    0% {
      transform: translate(-50%, -50%) scale(0);
      opacity: 1;
    }
    60% {
      opacity: 1;
    }
    100% {
      transform: translate(calc(-50% + var(--x)), calc(-50% + var(--y))) scale(1);
      opacity: 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .frame.spinning,
    .strip.spinning {
      animation: none;
      filter: none;
    }
  }
</style>
