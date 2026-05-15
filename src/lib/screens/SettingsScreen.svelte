<script lang="ts">
  import { game } from '../stores/game.svelte';
  import { settings } from '../stores/settings.svelte';
  import { minigames } from '../stores/minigames.svelte';
  import { playerPresets } from '../stores/playerPresets.svelte';
  import { starterMiniGames } from '../minigames/starter';

  const TURN_OPTIONS = [10, 15, 20] as const;
  const COIN_OPTIONS = [10, 15, 20, 25, 30, 40] as const;

  function setCoinsPerStar(n: number) {
    settings.value = { ...settings.value, coinsPerStar: n };
  }

  function setDefaultTurns(n: number) {
    settings.value = { ...settings.value, defaultTurns: n };
  }

  function toggleSound() {
    settings.value = {
      ...settings.value,
      soundEnabled: !settings.value.soundEnabled,
    };
  }

  function clearAll() {
    if (
      !confirm(
        'Erase all saved players, mini-games, and settings? This cannot be undone.',
      )
    ) {
      return;
    }
    playerPresets.value = [];
    minigames.value = [...starterMiniGames];
    settings.value = {
      coinsPerStar: 20,
      soundEnabled: false,
      defaultTurns: 10,
    };
  }
</script>

<section class="settings">
  <header class="header">
    <button class="back" type="button" onclick={() => game.goTo('setup')}>
      ← Back
    </button>
    <h1>Settings</h1>
  </header>

  <div class="group">
    <h2>Coins per star</h2>
    <p class="hint">How much a star costs at the purchase button.</p>
    <div class="options">
      {#each COIN_OPTIONS as n (n)}
        <button
          type="button"
          class="pill"
          class:selected={settings.value.coinsPerStar === n}
          onclick={() => setCoinsPerStar(n)}
        >
          {n} 🪙
        </button>
      {/each}
    </div>
  </div>

  <div class="group">
    <h2>Default turns</h2>
    <p class="hint">Pre-selected when you start a new game.</p>
    <div class="options">
      {#each TURN_OPTIONS as n (n)}
        <button
          type="button"
          class="pill"
          class:selected={settings.value.defaultTurns === n}
          onclick={() => setDefaultTurns(n)}
        >
          {n}
        </button>
      {/each}
    </div>
  </div>

  <div class="group">
    <h2>Sound</h2>
    <p class="hint">Sound effects are coming in Phase 5.</p>
    <button
      type="button"
      class="toggle"
      class:on={settings.value.soundEnabled}
      onclick={toggleSound}
    >
      <span class="dot"></span>
      <span>{settings.value.soundEnabled ? 'On' : 'Off'}</span>
    </button>
  </div>

  <div class="group danger-zone">
    <h2>Reset</h2>
    <p class="hint">
      Wipes saved players, restores starter mini-games, resets settings.
    </p>
    <button class="danger" type="button" onclick={clearAll}>
      Clear all saved data
    </button>
  </div>
</section>

<style>
  .settings {
    max-width: 720px;
    margin: 0 auto;
    padding: 24px 24px 64px;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }
  .header {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .header h1 {
    font-family: var(--display);
    font-size: 40px;
    margin: 0;
    color: var(--gold);
  }
  .back {
    font-family: var(--display);
    font-size: 16px;
    padding: 8px 14px;
    border-radius: 12px;
    border: 2px solid var(--border);
    background: var(--surface-2);
    color: var(--text-dim);
    cursor: pointer;
  }
  .back:hover {
    color: var(--text);
    border-color: var(--text-dim);
  }
  .group {
    background: var(--surface-1);
    border: 2px solid var(--border);
    border-radius: 18px;
    padding: 18px 20px;
  }
  .group h2 {
    font-family: var(--display);
    font-size: 22px;
    margin: 0 0 4px;
  }
  .hint {
    margin: 0 0 12px;
    color: var(--text-dim);
    font-size: 14px;
  }
  .options {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .pill {
    font-family: var(--display);
    font-size: 18px;
    padding: 10px 18px;
    border-radius: 999px;
    border: 2px solid var(--border);
    background: var(--surface-2);
    color: var(--text);
    cursor: pointer;
  }
  .pill:hover {
    border-color: var(--gold);
  }
  .pill.selected {
    background: var(--gold);
    color: #1a132e;
    border-color: var(--gold);
  }
  .toggle {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    background: var(--surface-2);
    border: 2px solid var(--border);
    border-radius: 999px;
    padding: 6px 18px 6px 6px;
    cursor: pointer;
    font-family: var(--display);
    font-size: 18px;
    color: var(--text);
  }
  .dot {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: var(--surface-3);
    transition: background 0.15s ease;
  }
  .toggle.on .dot {
    background: var(--gold);
  }
  .danger-zone {
    border-color: rgba(239, 68, 68, 0.4);
  }
  .danger {
    font-family: var(--display);
    font-size: 16px;
    padding: 10px 18px;
    border-radius: 12px;
    border: 2px solid var(--danger);
    background: transparent;
    color: var(--danger);
    cursor: pointer;
  }
  .danger:hover {
    background: var(--danger);
    color: white;
  }
</style>
