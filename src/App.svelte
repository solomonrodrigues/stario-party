<script lang="ts">
  import { fade } from 'svelte/transition';
  import { game } from './lib/stores/game.svelte';
  import SetupScreen from './lib/screens/SetupScreen.svelte';
  import BoardScreen from './lib/screens/BoardScreen.svelte';
  import MiniGameScreen from './lib/screens/MiniGameScreen.svelte';
  import ResultsScreen from './lib/screens/ResultsScreen.svelte';
</script>

<main class="app">
  {#key game.screen}
    <div class="screen" in:fade={{ duration: 220 }}>
      {#if game.screen === 'setup'}
        <SetupScreen />
      {:else if game.screen === 'board'}
        <BoardScreen />
      {:else if game.screen === 'minigame'}
        <MiniGameScreen />
      {:else if game.screen === 'results'}
        <ResultsScreen />
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
