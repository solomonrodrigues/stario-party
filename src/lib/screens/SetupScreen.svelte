<script lang="ts">
  import type { PlayerPreset } from '../types';
  import { game } from '../stores/game.svelte';
  import {
    avatarPresets,
    playerColorPalette,
  } from '../avatars/presets';
  import PlayerEditor from '../components/PlayerEditor.svelte';

  const MIN_PLAYERS = 2;
  const MAX_PLAYERS = 4;
  const TURN_OPTIONS = [10, 15, 20] as const;

  function newPlayerId(): string {
    return crypto.randomUUID();
  }

  function buildDefaultPlayer(index: number): PlayerPreset {
    const presetIdx = index % avatarPresets.length;
    const colorIdx = index % playerColorPalette.length;
    return {
      id: newPlayerId(),
      name: `Player ${index + 1}`,
      avatar: { kind: 'preset', key: avatarPresets[presetIdx].key },
      color: playerColorPalette[colorIdx],
    };
  }

  let players = $state<PlayerPreset[]>([
    buildDefaultPlayer(0),
    buildDefaultPlayer(1),
  ]);
  let totalTurns = $state(10);

  function addPlayer() {
    if (players.length >= MAX_PLAYERS) return;
    players = [...players, buildDefaultPlayer(players.length)];
  }

  function updatePlayer(index: number, next: PlayerPreset) {
    players = players.map((p, i) => (i === index ? next : p));
  }

  function removePlayer(index: number) {
    if (players.length <= MIN_PLAYERS) return;
    players = players.filter((_, i) => i !== index);
  }

  function canStart(): boolean {
    return (
      players.length >= MIN_PLAYERS &&
      players.every((p) => p.name.trim().length > 0)
    );
  }

  function start() {
    if (!canStart()) return;
    game.startGame(players, totalTurns);
  }
</script>

<section class="setup">
  <header>
    <h1 class="title">Stario Party</h1>
    <p class="subtitle">Set up your squad and get the show going.</p>
  </header>

  <div class="players">
    {#each players as player, i (player.id)}
      <PlayerEditor
        {player}
        onChange={(next) => updatePlayer(i, next)}
        onRemove={players.length > MIN_PLAYERS
          ? () => removePlayer(i)
          : undefined}
      />
    {/each}
    {#if players.length < MAX_PLAYERS}
      <button class="add-player" type="button" onclick={addPlayer}>
        + Add player
      </button>
    {/if}
  </div>

  <div class="turn-row">
    <span class="label-text">Turns</span>
    <div class="turns">
      {#each TURN_OPTIONS as opt (opt)}
        <button
          type="button"
          class="turn"
          class:selected={totalTurns === opt}
          onclick={() => (totalTurns = opt)}
        >
          {opt}
        </button>
      {/each}
    </div>
  </div>

  <button
    class="start"
    type="button"
    disabled={!canStart()}
    onclick={start}
  >
    Start game
  </button>
</section>

<style>
  .setup {
    max-width: 880px;
    margin: 0 auto;
    padding: 32px 24px 64px;
    display: flex;
    flex-direction: column;
    gap: 28px;
  }
  header {
    text-align: center;
  }
  .title {
    font-family: var(--display);
    font-size: 72px;
    margin: 0;
    color: var(--gold);
    text-shadow: 0 4px 0 rgba(0, 0, 0, 0.25);
    letter-spacing: -0.01em;
  }
  .subtitle {
    margin: 4px 0 0;
    color: var(--text-dim);
    font-size: 20px;
  }
  .players {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .add-player {
    font-family: var(--display);
    font-size: 22px;
    padding: 18px;
    border-radius: 20px;
    border: 2px dashed var(--border);
    background: transparent;
    color: var(--text-dim);
    cursor: pointer;
    transition:
      border-color 0.12s ease,
      color 0.12s ease;
  }
  .add-player:hover {
    border-color: var(--gold);
    color: var(--gold);
  }
  .turn-row {
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: center;
  }
  .label-text {
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--text-dim);
  }
  .turns {
    display: flex;
    gap: 12px;
  }
  .turn {
    font-family: var(--display);
    font-size: 28px;
    width: 80px;
    height: 64px;
    border-radius: 16px;
    border: 2px solid var(--border);
    background: var(--surface-1);
    color: var(--text);
    cursor: pointer;
    transition: all 0.15s ease;
  }
  .turn:hover {
    border-color: var(--gold);
  }
  .turn.selected {
    background: var(--gold);
    color: #1a132e;
    border-color: var(--gold);
    transform: translateY(-2px);
  }
  .start {
    font-family: var(--display);
    font-size: 32px;
    padding: 22px;
    border-radius: 24px;
    border: none;
    background: var(--gold);
    color: #1a132e;
    cursor: pointer;
    box-shadow: 0 6px 0 #b78a17;
    transition:
      transform 0.1s ease,
      box-shadow 0.1s ease;
  }
  .start:hover:not(:disabled) {
    transform: translateY(2px);
    box-shadow: 0 4px 0 #b78a17;
  }
  .start:active:not(:disabled) {
    transform: translateY(6px);
    box-shadow: 0 0 0 #b78a17;
  }
  .start:disabled {
    opacity: 0.45;
    cursor: not-allowed;
    box-shadow: none;
  }
</style>
