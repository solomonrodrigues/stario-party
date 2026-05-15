<script lang="ts">
  import type { PlayerPreset } from '../types';
  import { playerColorPalette } from '../avatars/presets';
  import AvatarPicker from './AvatarPicker.svelte';
  import Avatar from './Avatar.svelte';

  interface Props {
    player: PlayerPreset;
    onChange: (next: PlayerPreset) => void;
    onRemove?: () => void;
  }

  let { player, onChange, onRemove }: Props = $props();
</script>

<div class="editor">
  <div class="row top">
    <Avatar avatar={player.avatar} size={88} ring={player.color} />
    <div class="fields">
      <label class="name-label">
        <span class="label-text">Name</span>
        <input
          type="text"
          maxlength="16"
          value={player.name}
          placeholder="Player name"
          oninput={(e) =>
            onChange({ ...player, name: e.currentTarget.value })}
        />
      </label>
      <div class="color-row" role="radiogroup" aria-label="Player color">
        {#each playerColorPalette as swatch (swatch)}
          <button
            type="button"
            class="swatch"
            class:selected={player.color === swatch}
            style:background={swatch}
            aria-pressed={player.color === swatch}
            aria-label="Pick {swatch}"
            onclick={() => onChange({ ...player, color: swatch })}
          ></button>
        {/each}
      </div>
    </div>
    {#if onRemove}
      <button class="remove" type="button" onclick={onRemove} title="Remove player">
        ×
      </button>
    {/if}
  </div>

  <AvatarPicker
    value={player.avatar}
    onChange={(avatar) => onChange({ ...player, avatar })}
  />
</div>

<style>
  .editor {
    background: var(--surface-1);
    border: 2px solid var(--border);
    border-radius: 24px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .row.top {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .fields {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
  }
  .name-label {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .label-text {
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-dim);
  }
  input[type='text'] {
    font: inherit;
    font-family: var(--display);
    font-size: 24px;
    padding: 8px 12px;
    border-radius: 12px;
    border: 2px solid var(--border);
    background: var(--surface-2);
    color: var(--text);
    width: 100%;
    box-sizing: border-box;
  }
  input[type='text']:focus {
    outline: none;
    border-color: var(--gold);
  }
  .color-row {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }
  .swatch {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    border: 3px solid transparent;
    cursor: pointer;
    padding: 0;
    transition: transform 0.12s ease, border-color 0.12s ease;
  }
  .swatch:hover {
    transform: scale(1.1);
  }
  .swatch.selected {
    border-color: #fff;
    box-shadow: 0 0 0 2px var(--surface-1);
  }
  .remove {
    background: transparent;
    border: 2px solid var(--border);
    color: var(--text-dim);
    width: 36px;
    height: 36px;
    border-radius: 50%;
    font-size: 24px;
    line-height: 1;
    cursor: pointer;
    flex: none;
  }
  .remove:hover {
    border-color: #ef4444;
    color: #ef4444;
  }
</style>
