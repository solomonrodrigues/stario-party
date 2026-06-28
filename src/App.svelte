<script lang="ts">
  import { fade, scale } from 'svelte/transition';
  import { backOut } from 'svelte/easing';
  import { game } from './lib/stores/game.svelte';
  import SetupScreen from './lib/screens/SetupScreen.svelte';
  import OrderRollScreen from './lib/screens/OrderRollScreen.svelte';
  import BoardScreen from './lib/screens/BoardScreen.svelte';
  import MiniGameScreen from './lib/screens/MiniGameScreen.svelte';
  import ResultsScreen from './lib/screens/ResultsScreen.svelte';
  import ManageMiniGamesScreen from './lib/screens/ManageMiniGamesScreen.svelte';
  import SettingsScreen from './lib/screens/SettingsScreen.svelte';
  import ConfirmDialog from './lib/components/ConfirmDialog.svelte';
</script>

<main class="app">
  {#key game.screen}
    <div class="screen" in:fade={{ duration: 220 }}>
      {#if game.screen === 'setup'}
        <SetupScreen />
      {:else if game.screen === 'order-roll'}
        <OrderRollScreen />
      {:else if game.screen === 'board'}
        <BoardScreen />
      {:else if game.screen === 'minigame'}
        <MiniGameScreen />
      {:else if game.screen === 'results'}
        <ResultsScreen />
      {:else if game.screen === 'manage-minigames'}
        <ManageMiniGamesScreen />
      {:else if game.screen === 'settings'}
        <SettingsScreen />
      {/if}
    </div>
  {/key}

  {#if game.recoverable}
    {@const saved = game.recoverable}
    <div class="resume-overlay" transition:fade={{ duration: 180 }}>
      <div class="resume-card" in:scale={{ duration: 280, start: 0.85, easing: backOut }}>
        <span class="resume-kicker">Game in progress</span>
        <h2 class="resume-title">Pick up where you left off?</h2>
        <p class="resume-detail">
          {saved.players.length} players · turn {saved.currentTurn} of {saved.totalTurns}
        </p>
        <div class="resume-actions">
          <button class="resume-btn primary" type="button" onclick={() => game.resumeSession()}>
            Resume game
          </button>
          <button class="resume-btn ghost" type="button" onclick={() => game.discardSession()}>
            Start fresh
          </button>
        </div>
      </div>
    </div>
  {/if}

  <ConfirmDialog />
</main>

<style>
  .app {
    min-height: 100svh;
    width: 100%;
    display: flex;
    flex-direction: column;
  }
  .screen {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .resume-overlay {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background: rgba(10, 6, 20, 0.72);
    backdrop-filter: blur(4px);
    z-index: 100;
  }
  .resume-card {
    background: var(--surface-1);
    border: 3px solid var(--accent-purple);
    border-radius: 24px;
    padding: 32px 36px;
    max-width: min(460px, 92vw);
    text-align: center;
    box-shadow: 0 24px 48px -16px rgba(0, 0, 0, 0.7);
  }
  .resume-kicker {
    font-family: var(--display);
    text-transform: uppercase;
    letter-spacing: 0.16em;
    font-size: 13px;
    color: var(--accent-pink);
  }
  .resume-title {
    font-family: var(--display);
    font-size: 32px;
    margin: 8px 0 4px;
    color: var(--text);
  }
  .resume-detail {
    color: var(--text-dim);
    font-size: 17px;
    margin: 0 0 24px;
  }
  .resume-actions {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .resume-btn {
    font-family: var(--display);
    font-size: 22px;
    padding: 14px 24px;
    border-radius: 16px;
    cursor: pointer;
    border: 2px solid transparent;
    transition:
      transform 0.1s ease,
      box-shadow 0.1s ease,
      background 0.15s ease,
      color 0.15s ease;
  }
  .resume-btn.primary {
    background: var(--accent-purple);
    color: white;
    box-shadow: 0 6px 0 #5b21b6;
  }
  .resume-btn.primary:hover {
    transform: translateY(2px);
    box-shadow: 0 4px 0 #5b21b6;
  }
  .resume-btn.primary:active {
    transform: translateY(6px);
    box-shadow: 0 0 0 #5b21b6;
  }
  .resume-btn.ghost {
    background: transparent;
    color: var(--text-dim);
    border-color: var(--border);
  }
  .resume-btn.ghost:hover {
    color: var(--text);
    border-color: var(--text-dim);
  }
</style>
