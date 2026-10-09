<script lang="ts">
  import { scale } from 'svelte/transition';
  import { backOut } from 'svelte/easing';
  import type { SpaceOutcome } from '../types';
  import Icon from './Icon.svelte';

  interface Props {
    outcome: SpaceOutcome;
  }

  let { outcome }: Props = $props();
</script>

<div
  class="reveal"
  style:--accent={outcome.accent}
  transition:scale={{ duration: 280, easing: backOut, start: 0.85 }}
>
  <span class="icon"><Icon name={outcome.icon} /></span>
  <div class="text">
    <span class="label">{outcome.label} space</span>
    <span class="desc">{outcome.description}</span>
  </div>
</div>

<style>
  .reveal {
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: center;
    gap: 16px;
    width: 100%;
    max-width: 560px;
    padding: 16px 20px;
    border-radius: 16px;
    border: 2px solid var(--accent);
    background: color-mix(in srgb, var(--accent) 12%, var(--surface-1));
    text-align: left;
  }
  .icon {
    font-size: 42px;
    line-height: 1;
    color: var(--accent);
  }
  .text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  .label {
    font-family: var(--display);
    font-size: 14px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--accent);
  }
  .desc {
    font-size: 18px;
    line-height: 1.3;
    color: var(--text);
  }
</style>
