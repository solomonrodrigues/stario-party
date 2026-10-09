<script lang="ts">
  import { fly } from 'svelte/transition';
  import type { SpaceType } from '../types';
  import { spaceDefs } from '../game/spaces';
  import Icon from './Icon.svelte';

  interface Props {
    name: string;
    onPick: (spaceType: SpaceType) => void;
  }

  let { name, onPick }: Props = $props();
</script>

<div class="picker" transition:fly={{ y: 12, duration: 220 }}>
  <p class="prompt">Which space did <strong>{name}</strong> land on?</p>
  <div class="grid">
    {#each spaceDefs as def (def.id)}
      <button
        class="space"
        type="button"
        style:--accent={def.accent}
        onclick={() => onPick(def.id)}
      >
        <span class="icon"><Icon name={def.icon} /></span>
        <span class="label">{def.label}</span>
      </button>
    {/each}
  </div>
</div>

<style>
  .picker {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
    width: 100%;
  }
  .prompt {
    margin: 0;
    font-family: var(--display);
    font-size: clamp(18px, 2.4vw, 24px);
    color: var(--text-dim);
  }
  .prompt strong {
    color: var(--text);
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(96px, 1fr));
    gap: 12px;
    width: 100%;
    max-width: 640px;
  }
  .space {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 14px 10px;
    border-radius: 14px;
    border: 2px solid var(--accent);
    background: color-mix(in srgb, var(--accent) 14%, var(--surface-1));
    color: var(--text);
    cursor: pointer;
    transition:
      background 0.12s ease,
      transform 0.08s ease;
  }
  .space:hover {
    background: color-mix(in srgb, var(--accent) 30%, var(--surface-1));
  }
  .space:active {
    transform: translateY(1px);
  }
  .icon {
    font-size: 30px;
    line-height: 1;
    color: var(--accent);
  }
  .label {
    font-family: var(--display);
    font-weight: 500;
    font-size: 16px;
  }
  @media (max-width: 560px) {
    .grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
</style>
