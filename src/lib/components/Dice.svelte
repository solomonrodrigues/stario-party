<script lang="ts">
  import { onDestroy, untrack } from 'svelte';
  import { Tween } from 'svelte/motion';
  import { backOut } from 'svelte/easing';
  import { play } from '../sound/sfx';

  type Phase = 'idle' | 'spinning' | 'done';

  interface Props {
    onRoll?: (value: number) => void;
    disabled?: boolean;
    initial?: number | null;
    size?: number;
    hint?: string;
  }

  let {
    onRoll,
    disabled = false,
    initial = null,
    size = 180,
    hint = 'Tap to roll',
  }: Props = $props();

  const CYCLE_MS = 70;

  let displayValue = $state<number | null>(untrack(() => initial));
  let phase = $state<Phase>(
    untrack(() => (initial !== null ? 'done' : 'idle')),
  );
  let cycler: ReturnType<typeof setInterval> | null = null;
  let bounceTimer: ReturnType<typeof setTimeout> | null = null;

  const scale = new Tween(1, { duration: 300, easing: backOut });

  function clearTimers() {
    if (cycler) clearInterval(cycler);
    if (bounceTimer) clearTimeout(bounceTimer);
    cycler = null;
    bounceTimer = null;
  }

  function spinStart() {
    play('roll');
    phase = 'spinning';
    displayValue = Math.floor(Math.random() * 10) + 1;
    play('dice-tick');
    cycler = setInterval(() => {
      displayValue = Math.floor(Math.random() * 10) + 1;
      play('dice-tick');
    }, CYCLE_MS);
  }

  function spinStop() {
    if (cycler) clearInterval(cycler);
    cycler = null;
    play('dice-land');
    phase = 'done';
    scale.set(1.35);
    bounceTimer = setTimeout(() => scale.set(1), 280);
    if (displayValue !== null) onRoll?.(displayValue);
  }

  function handleClick() {
    if (disabled) return;
    if (phase === 'idle') {
      spinStart();
    } else if (phase === 'spinning') {
      spinStop();
    }
  }

  const ariaLabel = $derived(
    phase === 'idle'
      ? 'Tap to start dice'
      : phase === 'spinning'
        ? 'Tap to stop dice'
        : 'Rolled',
  );

  const computedHint = $derived(
    phase === 'idle'
      ? hint
      : phase === 'spinning'
        ? 'Tap to stop!'
        : '',
  );

  onDestroy(clearTimers);
</script>

<button
  class="dice"
  class:spinning={phase === 'spinning'}
  class:done={phase === 'done'}
  disabled={disabled && phase !== 'spinning'}
  aria-label={ariaLabel}
  style:--size="{size}px"
  style:--face-size="{Math.round(size * 0.55)}px"
  style:--hint-size="{Math.max(10, Math.round(size * 0.078))}px"
  onclick={handleClick}
>
  <span class="aura" aria-hidden="true"></span>
  <span class="face" style:transform="scale({scale.current})">
    {displayValue ?? '?'}
  </span>
  {#if computedHint}
    <span class="hint" class:active={phase === 'spinning'}>
      {computedHint}
    </span>
  {/if}
</button>

<style>
  .dice {
    --size: 180px;
    --face-size: 100px;
    --hint-size: 13px;
    position: relative;
    width: var(--size);
    height: var(--size);
    border-radius: calc(var(--size) * 0.18);
    border: calc(var(--size) * 0.022) solid rgba(255, 255, 255, 0.85);
    background:
      linear-gradient(
        160deg,
        rgba(199, 230, 255, 0.95) 0%,
        rgba(96, 165, 250, 0.95) 35%,
        rgba(37, 99, 235, 0.95) 65%,
        rgba(29, 78, 216, 0.95) 100%
      );
    box-shadow:
      /* inner top-left highlight */
      inset calc(var(--size) * 0.05) calc(var(--size) * 0.05)
        calc(var(--size) * 0.08) rgba(255, 255, 255, 0.45),
      /* inner bottom-right shadow */
      inset calc(var(--size) * -0.04) calc(var(--size) * -0.06)
        calc(var(--size) * 0.08) rgba(15, 23, 60, 0.5),
      /* outer glow halo */
      0 0 calc(var(--size) * 0.22) rgba(96, 165, 250, 0.55),
      0 0 calc(var(--size) * 0.5) rgba(59, 130, 246, 0.35),
      /* drop shadow */
      0 calc(var(--size) * 0.06) calc(var(--size) * 0.18) rgba(0, 0, 0, 0.4);
    color: #fff;
    font-family: var(--display);
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    transition:
      transform 0.12s ease,
      box-shadow 0.12s ease,
      filter 0.12s ease;
    will-change: transform;
  }
  .dice::after {
    /* second highlight strip near the top — adds the glassy sheen */
    content: '';
    position: absolute;
    inset: 6% 12% auto 12%;
    height: 18%;
    border-radius: 50%;
    background: linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.6),
      rgba(255, 255, 255, 0) 90%
    );
    filter: blur(6px);
    pointer-events: none;
  }
  .dice:not(:disabled):hover {
    transform: translateY(-3px);
    filter: brightness(1.06);
  }
  .dice:not(:disabled):active {
    transform: translateY(3px);
    filter: brightness(0.94);
  }
  .dice:disabled {
    cursor: default;
    opacity: 0.9;
  }
  .dice.done:disabled {
    /* keep the result visible but mute the glow */
    box-shadow:
      inset calc(var(--size) * 0.05) calc(var(--size) * 0.05)
        calc(var(--size) * 0.08) rgba(255, 255, 255, 0.35),
      inset calc(var(--size) * -0.04) calc(var(--size) * -0.06)
        calc(var(--size) * 0.08) rgba(15, 23, 60, 0.5),
      0 0 calc(var(--size) * 0.14) rgba(96, 165, 250, 0.3),
      0 calc(var(--size) * 0.06) calc(var(--size) * 0.18) rgba(0, 0, 0, 0.4);
  }

  .aura {
    position: absolute;
    inset: -10%;
    border-radius: inherit;
    pointer-events: none;
    background: radial-gradient(
      circle at center,
      rgba(125, 211, 252, 0.25) 0%,
      rgba(125, 211, 252, 0) 65%
    );
    opacity: 0;
    transition: opacity 0.2s ease;
  }
  .spinning .aura {
    opacity: 1;
    animation: aura-pulse 0.7s ease-in-out infinite;
  }
  @keyframes aura-pulse {
    0%, 100% {
      transform: scale(1);
      opacity: 0.6;
    }
    50% {
      transform: scale(1.18);
      opacity: 1;
    }
  }

  .face {
    position: relative;
    z-index: 1;
    font-size: var(--face-size);
    line-height: 1;
    font-weight: 700;
    display: inline-block;
    transform-origin: center;
    will-change: transform;
    color: #fff;
    /* chunky outlined number, Mario Party style */
    -webkit-text-stroke: calc(var(--size) * 0.017) #1e3a8a;
    text-shadow:
      0 calc(var(--size) * 0.018) 0 #1e40af,
      0 calc(var(--size) * 0.03) calc(var(--size) * 0.04) rgba(0, 0, 0, 0.4);
    letter-spacing: -0.02em;
  }

  .hint {
    position: absolute;
    bottom: calc(var(--size) * 0.07);
    z-index: 1;
    font-size: var(--hint-size);
    text-transform: uppercase;
    letter-spacing: 0.14em;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.85);
    text-shadow: 0 1px 0 #1e3a8a;
    opacity: 0.85;
  }
  .hint.active {
    animation: hint-blink 0.55s ease-in-out infinite;
  }
  @keyframes hint-blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.35; }
  }

  .spinning {
    animation: dice-active 0.55s ease-in-out infinite;
  }
  @keyframes dice-active {
    0%, 100% {
      transform: rotate(-5deg) translateY(0);
    }
    50% {
      transform: rotate(5deg) translateY(-6px);
    }
  }
</style>
