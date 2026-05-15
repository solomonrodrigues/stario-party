<script lang="ts">
  import type { AvatarRef } from '../types';
  import { avatarPresets } from '../avatars/presets';
  import Avatar from './Avatar.svelte';

  interface Props {
    value: AvatarRef;
    onChange: (next: AvatarRef) => void;
  }

  let { value, onChange }: Props = $props();
</script>

<div class="picker" role="radiogroup" aria-label="Choose an avatar">
  {#each avatarPresets as preset (preset.key)}
    {@const selected = value.kind === 'preset' && value.key === preset.key}
    <button
      type="button"
      class="tile"
      class:selected
      aria-pressed={selected}
      title={preset.label}
      onclick={() => onChange({ kind: 'preset', key: preset.key })}
    >
      <Avatar avatar={{ kind: 'preset', key: preset.key }} size={64} />
    </button>
  {/each}
</div>

<style>
  .picker {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
  }
  .tile {
    padding: 6px;
    background: var(--surface-2);
    border: 3px solid transparent;
    border-radius: 16px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition:
      transform 0.12s ease,
      border-color 0.12s ease,
      background 0.12s ease;
  }
  .tile:hover {
    transform: translateY(-2px);
    background: var(--surface-3);
  }
  .tile.selected {
    border-color: var(--gold);
    background: var(--surface-3);
  }
</style>
