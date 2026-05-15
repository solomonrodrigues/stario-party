<script lang="ts">
  import { untrack } from 'svelte';
  import { fly } from 'svelte/transition';
  import type { PlayerPreset } from '../types';
  import { game } from '../stores/game.svelte';
  import { settings } from '../stores/settings.svelte';
  import { playerPresets } from '../stores/playerPresets.svelte';
  import {
    avatarPresets,
    playerColorPalette,
  } from '../avatars/presets';
  import Avatar from '../components/Avatar.svelte';
  import PlayerEditor from '../components/PlayerEditor.svelte';

  const MIN_PLAYERS = 2;
  const MAX_PLAYERS = 4;
  const TURN_OPTIONS = [10, 15, 20] as const;

  function newPlayerId(): string {
    return crypto.randomUUID();
  }

  function defaultPlayer(index: number): PlayerPreset {
    return {
      id: newPlayerId(),
      name: `Player ${index + 1}`,
      avatar: { kind: 'preset', key: avatarPresets[index % avatarPresets.length].key },
      color: playerColorPalette[index % playerColorPalette.length],
    };
  }

  let players = $state<PlayerPreset[]>([defaultPlayer(0), defaultPlayer(1)]);
  let totalTurns = $state(untrack(() => settings.value.defaultTurns));
  let saveBanner = $state<string | null>(null);

  function addPlayer() {
    if (players.length >= MAX_PLAYERS) return;
    players = [...players, defaultPlayer(players.length)];
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

  function saveAsSquad() {
    // Save each current player as a preset, keyed by ID. Overwrites
    // matching IDs, appends new ones.
    const existing = playerPresets.value;
    const updated: PlayerPreset[] = [...existing];
    let added = 0;
    for (const p of players) {
      const idx = updated.findIndex((e) => e.id === p.id);
      if (idx === -1) {
        updated.push({ ...p });
        added += 1;
      } else {
        updated[idx] = { ...p };
      }
    }
    playerPresets.value = updated;
    saveBanner = added > 0
      ? `Saved ${added} new preset(s).`
      : 'Updated saved presets.';
    setTimeout(() => (saveBanner = null), 2500);
  }

  function loadPreset(preset: PlayerPreset) {
    if (players.length >= MAX_PLAYERS) return;
    if (players.some((p) => p.id === preset.id)) return;
    players = [...players, { ...preset }];
  }

  function deletePreset(preset: PlayerPreset) {
    if (!confirm(`Forget "${preset.name}"?`)) return;
    playerPresets.value = playerPresets.value.filter(
      (p) => p.id !== preset.id,
    );
  }

  const availablePresets = $derived(
    playerPresets.value.filter(
      (preset) => !players.some((p) => p.id === preset.id),
    ),
  );
</script>

<section class="setup">
  <header class="header">
    <h1 class="title">Stario Party</h1>
    <p class="subtitle">Set up your squad and get the show going.</p>
    <div class="nav">
      <button type="button" onclick={() => game.goTo('manage-minigames')}>
        Mini-games
      </button>
      <button type="button" onclick={() => game.goTo('settings')}>
        Settings
      </button>
    </div>
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

  <div class="squad-row">
    <button class="ghost-btn" type="button" onclick={saveAsSquad}>
      Save squad
    </button>
    {#if saveBanner}
      <span class="save-banner" transition:fly={{ y: -4, duration: 200 }}>
        {saveBanner}
      </span>
    {/if}
  </div>

  {#if availablePresets.length > 0}
    <section class="saved">
      <h2>Saved players</h2>
      <ul>
        {#each availablePresets as preset (preset.id)}
          <li>
            <button
              class="preset"
              type="button"
              disabled={players.length >= MAX_PLAYERS}
              onclick={() => loadPreset(preset)}
            >
              <Avatar avatar={preset.avatar} size={48} ring={preset.color} />
              <span class="preset-name">{preset.name}</span>
            </button>
            <button
              class="preset-del"
              type="button"
              aria-label="Delete {preset.name}"
              onclick={() => deletePreset(preset)}
            >
              ×
            </button>
          </li>
        {/each}
      </ul>
    </section>
  {/if}

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
    gap: 24px;
  }
  .header {
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
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
    margin: 0;
    color: var(--text-dim);
    font-size: 20px;
  }
  .nav {
    display: flex;
    gap: 8px;
    margin-top: 4px;
  }
  .nav button {
    font-family: var(--display);
    font-size: 15px;
    padding: 8px 16px;
    border-radius: 12px;
    border: 2px solid var(--border);
    background: var(--surface-2);
    color: var(--text-dim);
    cursor: pointer;
  }
  .nav button:hover {
    color: var(--text);
    border-color: var(--gold);
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

  .squad-row {
    display: flex;
    gap: 12px;
    align-items: center;
    justify-content: center;
    min-height: 36px;
  }
  .ghost-btn {
    font-family: var(--display);
    font-size: 16px;
    padding: 8px 16px;
    border-radius: 12px;
    border: 2px solid var(--border);
    background: transparent;
    color: var(--text-dim);
    cursor: pointer;
  }
  .ghost-btn:hover {
    color: var(--text);
    border-color: var(--text-dim);
  }
  .save-banner {
    font-size: 14px;
    color: #86efac;
    background: rgba(34, 197, 94, 0.15);
    padding: 4px 10px;
    border-radius: 999px;
  }

  .saved h2 {
    font-family: var(--display);
    font-size: 18px;
    margin: 0 0 8px;
    color: var(--text-dim);
  }
  .saved ul {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 8px;
  }
  .saved li {
    display: flex;
    align-items: center;
    gap: 4px;
    background: var(--surface-1);
    border: 2px solid var(--border);
    border-radius: 14px;
    padding: 4px 4px 4px 8px;
  }
  .preset {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 10px;
    border: none;
    background: transparent;
    color: var(--text);
    cursor: pointer;
    font-family: inherit;
    padding: 4px;
    border-radius: 10px;
  }
  .preset:hover:not(:disabled) {
    background: var(--surface-2);
  }
  .preset:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
  .preset-name {
    font-family: var(--display);
    font-size: 17px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .preset-del {
    background: transparent;
    border: none;
    color: var(--text-dim);
    cursor: pointer;
    font-size: 20px;
    width: 28px;
    height: 28px;
    border-radius: 8px;
    flex: none;
  }
  .preset-del:hover {
    color: var(--danger);
    background: var(--surface-2);
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
