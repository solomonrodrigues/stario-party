<script lang="ts">
  import type { AvatarRef } from '../types';
  import { avatarPresets } from '../avatars/presets';
  import { resizeImage } from '../avatars/resizeImage';
  import Avatar from './Avatar.svelte';

  interface Props {
    value: AvatarRef;
    onChange: (next: AvatarRef) => void;
  }

  let { value, onChange }: Props = $props();

  let busy = $state(false);
  let error = $state<string | null>(null);
  let fileInput: HTMLInputElement | null = $state(null);

  async function handleFile(file: File) {
    error = null;
    busy = true;
    try {
      const dataUrl = await resizeImage(file);
      onChange({ kind: 'upload', dataUrl });
    } catch (err) {
      error = err instanceof Error ? err.message : 'Could not load that image.';
    } finally {
      busy = false;
      if (fileInput) fileInput.value = '';
    }
  }

  function pickFile() {
    fileInput?.click();
  }
</script>

<div class="picker-wrap">
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

    <button
      type="button"
      class="tile upload"
      class:selected={value.kind === 'upload'}
      aria-pressed={value.kind === 'upload'}
      disabled={busy}
      onclick={pickFile}
      title="Upload your own image"
    >
      {#if value.kind === 'upload'}
        <Avatar avatar={value} size={64} />
      {:else}
        <span class="upload-glyph">📷</span>
      {/if}
    </button>
    <input
      bind:this={fileInput}
      type="file"
      accept="image/jpeg,image/png,image/webp,image/gif"
      hidden
      onchange={(e) => {
        const file = e.currentTarget.files?.[0];
        if (file) void handleFile(file);
      }}
    />
  </div>

  <p class="helper">
    Use any image you like — your face, your pet, a character.
  </p>
  {#if busy}
    <p class="status">Resizing image…</p>
  {/if}
  {#if error}
    <p class="error">{error}</p>
  {/if}
</div>

<style>
  .picker-wrap {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .picker {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 10px;
  }
  @media (max-width: 600px) {
    .picker {
      grid-template-columns: repeat(3, 1fr);
    }
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
  .tile:hover:not(:disabled) {
    transform: translateY(-2px);
    background: var(--surface-3);
  }
  .tile.selected {
    border-color: var(--gold);
    background: var(--surface-3);
  }
  .tile:disabled {
    opacity: 0.5;
    cursor: wait;
  }
  .upload {
    position: relative;
  }
  .upload-glyph {
    width: 64px;
    height: 64px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 28px;
    color: var(--text-dim);
    border-radius: 50%;
    border: 2px dashed var(--border);
  }
  .helper {
    margin: 4px 2px 0;
    font-size: 14px;
    color: var(--text-dim);
  }
  .status {
    margin: 0 2px;
    font-size: 14px;
    color: var(--gold);
  }
  .error {
    margin: 0 2px;
    font-size: 14px;
    color: var(--danger);
  }
</style>
