<script lang="ts">
  import { untrack } from 'svelte';
  import { Tween } from 'svelte/motion';
  import { cubicOut } from 'svelte/easing';

  type IconKind = 'coin' | 'star';

  interface Props {
    value: number;
    icon: IconKind;
    size?: 'sm' | 'md' | 'lg';
  }

  let { value, icon, size = 'md' }: Props = $props();

  const tween = new Tween(untrack(() => value), {
    duration: 550,
    easing: cubicOut,
  });

  let pulseToken = $state(0);
  let pulseKind = $state<'up' | 'down'>('up');
  let lastValue = untrack(() => value);

  $effect(() => {
    if (value !== lastValue) {
      pulseKind = value > lastValue ? 'up' : 'down';
      pulseToken += 1;
      lastValue = value;
      tween.target = value;
    }
  });

  const display = $derived(Math.round(tween.current));
  const glyph = $derived(icon === 'coin' ? '●' : '★');
</script>

<span class="counter size-{size}">
  {#key pulseToken}
    <span class="icon icon-{icon} pulse-{pulseKind}" aria-hidden="true">
      {glyph}
    </span>
  {/key}
  <span class="value">{display}</span>
</span>

<style>
  .counter {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-family: var(--display);
    line-height: 1;
  }
  .size-sm {
    font-size: 18px;
  }
  .size-md {
    font-size: 28px;
  }
  .size-lg {
    font-size: 40px;
  }
  .icon {
    display: inline-block;
    transform-origin: center;
    will-change: transform, color;
  }
  .icon-coin {
    color: var(--gold);
  }
  .icon-star {
    color: var(--star);
  }
  .icon.pulse-up {
    animation: pop 0.5s ease-out;
  }
  .icon-coin.pulse-down {
    animation: drop-coin 0.5s ease-out;
  }
  .icon-star.pulse-down {
    animation: drop-star 0.5s ease-out;
  }
  @keyframes pop {
    0%,
    100% {
      transform: scale(1) rotate(0);
    }
    35% {
      transform: scale(1.55) rotate(-10deg);
    }
    65% {
      transform: scale(1.15) rotate(6deg);
    }
  }
  @keyframes drop-coin {
    0%,
    100% {
      transform: translateX(0);
      color: var(--gold);
    }
    25% {
      transform: translateX(-4px);
      color: var(--danger);
    }
    75% {
      transform: translateX(4px);
      color: var(--danger);
    }
  }
  @keyframes drop-star {
    0%,
    100% {
      transform: translateX(0);
      color: var(--star);
    }
    25% {
      transform: translateX(-4px);
      color: var(--danger);
    }
    75% {
      transform: translateX(4px);
      color: var(--danger);
    }
  }
</style>
