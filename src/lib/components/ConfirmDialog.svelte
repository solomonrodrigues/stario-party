<script lang="ts">
  import { fade, scale } from 'svelte/transition';
  import { backOut } from 'svelte/easing';
  import { confirmDialog } from '../stores/confirm.svelte';

  const active = $derived(confirmDialog.active);

  let confirmButton = $state<HTMLButtonElement | null>(null);

  // Focus the confirm button whenever a prompt opens, so keyboard hosts can
  // just hit Enter.
  $effect(() => {
    if (active) confirmButton?.focus();
  });

  function onKeydown(event: KeyboardEvent) {
    if (!active) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      confirmDialog.cancel();
    }
  }
</script>

<svelte:window onkeydown={onKeydown} />

{#if active}
  <div
    class="confirm-overlay"
    role="presentation"
    onclick={() => confirmDialog.cancel()}
    transition:fade={{ duration: 160 }}
  >
    <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
    <div
      class="confirm-card"
      role="dialog"
      aria-modal="true"
      tabindex="-1"
      aria-label={active.title ?? 'Are you sure?'}
      onclick={(e) => e.stopPropagation()}
      in:scale={{ duration: 240, start: 0.88, easing: backOut }}
    >
      <h2 class="confirm-title">{active.title ?? 'Are you sure?'}</h2>
      <p class="confirm-message">{active.message}</p>
      <div class="confirm-actions">
        <button
          class="confirm-btn ghost"
          type="button"
          onclick={() => confirmDialog.cancel()}
        >
          {active.cancelLabel ?? 'Cancel'}
        </button>
        <button
          bind:this={confirmButton}
          class="confirm-btn primary"
          class:danger={active.tone === 'danger'}
          type="button"
          onclick={() => confirmDialog.confirm()}
        >
          {active.confirmLabel ?? 'Confirm'}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .confirm-overlay {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background: rgba(10, 6, 20, 0.72);
    backdrop-filter: blur(4px);
    z-index: 200;
  }
  .confirm-card {
    background: var(--surface-1);
    border: 3px solid var(--border);
    border-radius: 24px;
    padding: 28px 32px;
    max-width: min(440px, 92vw);
    text-align: center;
    box-shadow: 0 24px 48px -16px rgba(0, 0, 0, 0.7);
  }
  .confirm-title {
    font-family: var(--display);
    font-size: 28px;
    margin: 0 0 8px;
    color: var(--text);
  }
  .confirm-message {
    color: var(--text-dim);
    font-size: 17px;
    line-height: 1.4;
    margin: 0 0 24px;
  }
  .confirm-actions {
    display: flex;
    gap: 12px;
    justify-content: center;
  }
  .confirm-btn {
    font-family: var(--display);
    font-size: 20px;
    padding: 12px 22px;
    border-radius: 14px;
    cursor: pointer;
    border: 2px solid transparent;
    transition:
      transform 0.1s ease,
      box-shadow 0.1s ease,
      background 0.15s ease,
      color 0.15s ease,
      border-color 0.15s ease;
  }
  .confirm-btn.ghost {
    background: transparent;
    color: var(--text-dim);
    border-color: var(--border);
  }
  .confirm-btn.ghost:hover {
    color: var(--text);
    border-color: var(--text-dim);
  }
  .confirm-btn.primary {
    background: var(--accent-purple);
    color: white;
    box-shadow: 0 5px 0 #5b21b6;
  }
  .confirm-btn.primary:hover {
    transform: translateY(2px);
    box-shadow: 0 3px 0 #5b21b6;
  }
  .confirm-btn.primary:active {
    transform: translateY(5px);
    box-shadow: 0 0 0 #5b21b6;
  }
  .confirm-btn.primary.danger {
    background: #c0392b;
    box-shadow: 0 5px 0 #7d2018;
  }
  .confirm-btn.primary.danger:hover {
    box-shadow: 0 3px 0 #7d2018;
  }
  .confirm-btn.primary.danger:active {
    box-shadow: 0 0 0 #7d2018;
  }
</style>
