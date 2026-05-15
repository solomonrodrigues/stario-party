<script lang="ts">
  import type { AvatarRef } from '../types';
  import { findPreset } from '../avatars/presets';

  interface Props {
    avatar: AvatarRef;
    size?: number;
    ring?: string | null;
  }

  let { avatar, size = 96, ring = null }: Props = $props();

  const presetSvg = $derived(
    avatar.kind === 'preset' ? findPreset(avatar.key)?.svg ?? '' : '',
  );
</script>

<div
  class="avatar"
  style:width="{size}px"
  style:height="{size}px"
  style:box-shadow={ring ? `0 0 0 4px ${ring}` : 'none'}
>
  {#if avatar.kind === 'preset'}
    {@html presetSvg}
  {:else}
    <img src={avatar.dataUrl} alt="" />
  {/if}
</div>

<style>
  .avatar {
    border-radius: 50%;
    overflow: hidden;
    background: var(--surface-2, #1f1b3a);
    display: inline-flex;
    flex: none;
    transition: box-shadow 0.2s ease;
  }
  .avatar :global(svg),
  .avatar img {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
  }
</style>
