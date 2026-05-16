<script lang="ts">
  import { fade } from 'svelte/transition';
  import { game } from './lib/stores/game.svelte';
  import SetupScreen from './lib/screens/SetupScreen.svelte';
  import OrderRollScreen from './lib/screens/OrderRollScreen.svelte';
  import BoardScreen from './lib/screens/BoardScreen.svelte';
  import MiniGameScreen from './lib/screens/MiniGameScreen.svelte';
  import ResultsScreen from './lib/screens/ResultsScreen.svelte';
  import ManageMiniGamesScreen from './lib/screens/ManageMiniGamesScreen.svelte';
  import SettingsScreen from './lib/screens/SettingsScreen.svelte';
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
</style>
