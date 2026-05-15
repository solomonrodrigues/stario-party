<script lang="ts">
  import { onDestroy, untrack } from 'svelte';
  import { Tween } from 'svelte/motion';
  import { backOut } from 'svelte/easing';

  interface Props {
    onRoll?: (value: number) => void;
    disabled?: boolean;
    initial?: number | null;
  }

  let { onRoll, disabled = false, initial = null }: Props = $props();

  const SPIN_MS = 1100;
  const CYCLE_MS = 70;

  let displayValue = $state<number | null>(untrack(() => initial));
  let isRolling = $state(false);
  let cycler: ReturnType<typeof setInterval> | null = null;
  let landTimer: ReturnType<typeof setTimeout> | null = null;
  let bounceTimer: ReturnType<typeof setTimeout> | null = null;

  const scale = new Tween(1, { duration: 300, easing: backOut });

  function clearAllTimers() {
    if (cycler) clearInterval(cycler);
    if (landTimer) clearTimeout(landTimer);
    if (bounceTimer) clearTimeout(bounceTimer);
    cycler = null;
    landTimer = null;
    bounceTimer = null;
  }

  function start() {
    if (isRolling || disabled) return;
    clearAllTimers();

    const finalValue = Math.floor(Math.random() * 10) + 1;
    isRolling = true;
    displayValue = Math.floor(Math.random() * 10) + 1;

    cycler = setInterval(() => {
      displayValue = Math.floor(Math.random() * 10) + 1;
    }, CYCLE_MS);

    landTimer = setTimeout(() => {
      if (cycler) clearInterval(cycler);
      cycler = null;
      displayValue = finalValue;
      isRolling = false;
      scale.set(1.3);
      bounceTimer = setTimeout(() => {
        scale.set(1);
      }, 280);
      onRoll?.(finalValue);
    }, SPIN_MS);
  }

  onDestroy(clearAllTimers);
</script>

<button
  class="dice"
  class:rolling={isRolling}
  class:idle={!isRolling}
  disabled={disabled || isRolling}
  aria-label="Roll the dice"
  onclick={start}
>
  <span class="face" style:transform="scale({scale.current})">
    {displayValue ?? '?'}
  </span>
  <span class="hint">{isRolling ? '' : 'Tap to roll'}</span>
</button>

<style>
  .dice {
    --size: 180px;
    width: var(--size);
    height: var(--size);
    border: none;
    border-radius: 28px;
    background: linear-gradient(145deg, #ffe16a, #f7c948 60%, #d49d18);
    box-shadow:
      0 8px 0 #8a6510,
      0 12px 24px -8px rgba(0, 0, 0, 0.4),
      inset 0 -8px 16px rgba(0, 0, 0, 0.15);
    color: #1a132e;
    font-family: var(--display);
    cursor: pointer;
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    transition:
      transform 0.1s ease,
      box-shadow 0.1s ease;
    will-change: transform;
  }
  .dice:not(:disabled):hover {
    transform: translateY(2px);
    box-shadow:
      0 6px 0 #8a6510,
      0 10px 18px -8px rgba(0, 0, 0, 0.4),
      inset 0 -8px 16px rgba(0, 0, 0, 0.15);
  }
  .dice:not(:disabled):active {
    transform: translateY(6px);
    box-shadow:
      0 2px 0 #8a6510,
      inset 0 -8px 16px rgba(0, 0, 0, 0.15);
  }
  .dice:disabled {
    cursor: default;
  }

  .face {
    font-size: 92px;
    line-height: 1;
    font-weight: 700;
    display: inline-block;
    transform-origin: center;
    will-change: transform;
  }

  .hint {
    position: absolute;
    bottom: 14px;
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    font-weight: 600;
    opacity: 0.6;
  }

  .rolling {
    animation: dice-spin 1.1s cubic-bezier(0.22, 1.4, 0.36, 1) 1;
  }
  @keyframes dice-spin {
    0% {
      transform: rotate(0) scale(1);
    }
    60% {
      transform: rotate(900deg) scale(1.08);
    }
    100% {
      transform: rotate(1440deg) scale(1);
    }
  }
</style>
