<script lang="ts">
  import { untrack } from 'svelte';
  import { fly } from 'svelte/transition';
  import type { AvatarRef, PlayerPreset } from '../types';
  import { game } from '../stores/game.svelte';
  import { settings } from '../stores/settings.svelte';
  import { playerPresets } from '../stores/playerPresets.svelte';
  import { minigames } from '../stores/minigames.svelte';
  import { confirmDialog } from '../stores/confirm.svelte';
  import {
    avatarPresets,
    findPreset,
    playerColorPalette,
  } from '../avatars/presets';
  import { resizeImage } from '../avatars/resizeImage';
  import Avatar from '../components/Avatar.svelte';
  import Icon from '../components/Icon.svelte';

  const MIN_PLAYERS = 2;
  const MAX_PLAYERS = 4;
  const TURN_OPTIONS = [10, 15, 20] as const;

  // Title rendered one letter at a time in cycling Mario-logo colours.
  const TITLE = 'Stario Party';
  const TITLE_COLORS = [
    '#e8412b', // red
    '#f57e20', // orange
    '#ffcf33', // yellow
    '#43b34a', // green
    '#2aa3e8', // blue
    '#e0489e', // magenta
  ];
  let titleLetterIndex = 0;
  const titleParts = TITLE.split('').map((ch) => {
    if (ch === ' ') return { ch, color: null as string | null };
    const color = TITLE_COLORS[titleLetterIndex % TITLE_COLORS.length];
    titleLetterIndex += 1;
    return { ch, color };
  });

  function newPlayerId(): string {
    return crypto.randomUUID();
  }

  // A player's colour is no longer hand-picked — it rides along with the
  // chosen character emblem. Uploads (which have no inherent colour) fall back
  // to a stable per-slot colour from the palette.
  function colorFor(avatar: AvatarRef, slotIndex: number): string {
    if (avatar.kind === 'preset') {
      return findPreset(avatar.key)?.color ?? playerColorPalette[slotIndex % playerColorPalette.length];
    }
    return playerColorPalette[slotIndex % playerColorPalette.length];
  }

  function defaultPlayer(index: number): PlayerPreset {
    const avatar: AvatarRef = {
      kind: 'preset',
      key: avatarPresets[index % avatarPresets.length].key,
    };
    return {
      id: newPlayerId(),
      name: `Player ${index + 1}`,
      avatar,
      color: colorFor(avatar, index),
    };
  }

  let players = $state<PlayerPreset[]>([defaultPlayer(0), defaultPlayer(1)]);
  let activeIndex = $state(0);
  let totalTurns = $state(untrack(() => settings.value.defaultTurns));
  let saveBanner = $state<string | null>(null);

  // Upload handling for the shared gallery's "your own image" tile.
  let uploadBusy = $state(false);
  let uploadError = $state<string | null>(null);
  let fileInput: HTMLInputElement | null = $state(null);

  function addPlayer() {
    if (players.length >= MAX_PLAYERS) return;
    players = [...players, defaultPlayer(players.length)];
  }

  function removePlayer(index: number) {
    if (players.length <= MIN_PLAYERS) return;
    players = players.filter((_, i) => i !== index);
    if (activeIndex >= players.length) activeIndex = players.length - 1;
  }

  function renamePlayer(index: number, name: string) {
    players = players.map((p, i) => (i === index ? { ...p, name } : p));
  }

  // Assign an avatar to the active slot. Characters are unique: if another
  // player already holds this preset, the two swap so nobody is left blank.
  function assignAvatar(avatar: AvatarRef) {
    const i = activeIndex;
    const current = players[i];

    let next = players.map((p, idx) =>
      idx === i ? { ...p, avatar, color: colorFor(avatar, idx) } : p,
    );

    if (avatar.kind === 'preset') {
      const otherIdx = players.findIndex(
        (p, idx) =>
          idx !== i && p.avatar.kind === 'preset' && p.avatar.key === avatar.key,
      );
      if (otherIdx !== -1) {
        next = next.map((p, idx) =>
          idx === otherIdx
            ? { ...p, avatar: current.avatar, color: colorFor(current.avatar, idx) }
            : p,
        );
      }
    }

    players = next;
  }

  function takenBy(key: string): number {
    return players.findIndex(
      (p) => p.avatar.kind === 'preset' && p.avatar.key === key,
    );
  }

  async function handleFile(file: File) {
    uploadError = null;
    uploadBusy = true;
    try {
      const dataUrl = await resizeImage(file);
      assignAvatar({ kind: 'upload', dataUrl });
    } catch (err) {
      uploadError = err instanceof Error ? err.message : 'Could not load that image.';
    } finally {
      uploadBusy = false;
      if (fileInput) fileInput.value = '';
    }
  }

  // A game is unplayable without at least one active mini-game to roll for,
  // so gate the start on it (matches the pool MiniGameScreen draws from).
  const hasActiveMiniGame = $derived(minigames.value.some((m) => m.active));

  function canStart(): boolean {
    return (
      players.length >= MIN_PLAYERS &&
      players.every((p) => p.name.trim().length > 0) &&
      hasActiveMiniGame
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

  async function deletePreset(preset: PlayerPreset) {
    const ok = await confirmDialog.ask({
      title: 'Forget player',
      message: `Forget "${preset.name}"?`,
      confirmLabel: 'Forget',
      tone: 'danger',
    });
    if (!ok) return;
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
    <h1 class="title" aria-label={TITLE}>
      {#each titleParts as part, i (i)}
        {#if part.color}
          <span style:color={part.color}>{part.ch}</span>
        {:else}
          <span class="title-space" aria-hidden="true"></span>
        {/if}
      {/each}
    </h1>
    <div class="nav">
      <button type="button" onclick={() => game.goTo('manage-minigames')}>
        Mini-games
      </button>
      <button type="button" onclick={() => game.goTo('settings')}>
        Settings
      </button>
    </div>
  </header>

  <div class="stage">
    <!-- ── Player slots: each gets a big dedicated space ── -->
    <div class="slots" style:--slot-count={players.length}>
      {#each players as player, i (player.id)}
        <div
          class="slot"
          class:active={activeIndex === i}
          style:--accent={player.color}
        >
          <button
            type="button"
            class="select"
            aria-label="Select player {i + 1}"
            aria-pressed={activeIndex === i}
            onclick={() => (activeIndex = i)}
          ></button>
          <span class="badge">{i + 1}</span>
          {#if players.length > MIN_PLAYERS}
            <button
              type="button"
              class="remove"
              title="Remove player"
              onclick={() => removePlayer(i)}
            >
              ×
            </button>
          {/if}
          <span class="slot-avatar">
            <Avatar avatar={player.avatar} size={132} ring={player.color} />
          </span>
          <input
            class="name"
            type="text"
            maxlength="16"
            value={player.name}
            placeholder="Player name"
            onfocus={() => (activeIndex = i)}
            oninput={(e) => renamePlayer(i, e.currentTarget.value)}
          />
        </div>
      {/each}

      {#if players.length < MAX_PLAYERS}
        <button class="add-slot" type="button" onclick={addPlayer}>
          <span class="add-plus">+</span>
          <span class="add-label">Add player</span>
        </button>
      {/if}
    </div>

    <!-- ── Shared character gallery: tap to assign to the active slot ── -->
    <div class="gallery-wrap">
      <p class="gallery-hint">
        Pick a character for
        <strong style:color={players[activeIndex]?.color}>
          {players[activeIndex]?.name || `Player ${activeIndex + 1}`}
        </strong>
      </p>
      <div class="gallery" role="radiogroup" aria-label="Choose a character">
        {#each avatarPresets as preset (preset.key)}
          {@const owner = takenBy(preset.key)}
          {@const mine = owner === activeIndex}
          <button
            type="button"
            class="char"
            class:mine
            class:taken={owner !== -1 && !mine}
            title={preset.label}
            aria-pressed={mine}
            onclick={() => assignAvatar({ kind: 'preset', key: preset.key })}
          >
            <Avatar avatar={{ kind: 'preset', key: preset.key }} size={56} />
            {#if owner !== -1}
              <span class="char-owner" style:background={players[owner].color}>
                {owner + 1}
              </span>
            {/if}
          </button>
        {/each}

        <button
          type="button"
          class="char upload"
          disabled={uploadBusy}
          title="Upload your own image"
          onclick={() => fileInput?.click()}
        >
          <span class="upload-glyph"><Icon name="camera" size="26px" /></span>
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
      {#if uploadBusy}
        <p class="gallery-status">Resizing image…</p>
      {:else if uploadError}
        <p class="gallery-status error">{uploadError}</p>
      {/if}
    </div>
  </div>

  <!-- ── Bottom control bar ── -->
  <div class="controls">
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

    <div class="squad">
      <button class="ghost-btn" type="button" onclick={saveAsSquad}>
        Save squad
      </button>
      {#if saveBanner}
        <span class="save-banner" transition:fly={{ y: -4, duration: 200 }}>
          {saveBanner}
        </span>
      {/if}
      {#if availablePresets.length > 0}
        <div class="saved-strip">
          {#each availablePresets as preset (preset.id)}
            <span class="saved-chip">
              <button
                class="saved-load"
                type="button"
                disabled={players.length >= MAX_PLAYERS}
                title="Add {preset.name}"
                onclick={() => loadPreset(preset)}
              >
                <Avatar avatar={preset.avatar} size={32} ring={preset.color} />
                <span class="saved-name">{preset.name}</span>
              </button>
              <button
                class="saved-del"
                type="button"
                aria-label="Forget {preset.name}"
                onclick={() => deletePreset(preset)}
              >
                ×
              </button>
            </span>
          {/each}
        </div>
      {/if}
    </div>

    <div class="start-col">
      {#if !hasActiveMiniGame}
        <p class="minigame-warning" transition:fly={{ y: -4, duration: 200 }}>
          No mini-games active —
          <button
            type="button"
            class="link"
            onclick={() => game.goTo('manage-minigames')}
          >
            add some
          </button>
          first.
        </p>
      {/if}
      <button class="start" type="button" disabled={!canStart()} onclick={start}>
        Start game
      </button>
    </div>
  </div>

  <p class="disclaimer">
    Stario Party is an unofficial fan project, not affiliated with or endorsed by Nintendo.
    Mario and related names, characters and emblems are trademarks of Nintendo.
  </p>
</section>

<style>
  .setup {
    width: 100%;
    max-width: 1180px;
    margin: 0 auto;
    padding: 12px 16px 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  /* ── Header ── */
  .header {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 20px;
    flex-wrap: wrap;
  }
  .title {
    font-family: 'Mario Party Hudson', var(--display);
    font-size: clamp(36px, 5vw, 56px);
    margin: 0;
    line-height: 1;
    letter-spacing: 0.04em;
    -webkit-text-stroke: 2.5px #1e1b4b;
    paint-order: stroke fill;
    text-shadow: 0 4px 0 rgba(0, 0, 0, 0.3);
  }
  .title span {
    display: inline-block;
  }
  .title .title-space {
    width: 0.3em;
  }
  .nav {
    display: flex;
    gap: 8px;
  }
  .nav button {
    font-family: var(--display);
    font-size: 14px;
    padding: 7px 14px;
    border-radius: 10px;
    border: 1px solid var(--border);
    background: var(--surface-2);
    color: var(--text-dim);
    cursor: pointer;
  }
  .nav button:hover {
    color: var(--text);
    border-color: var(--gold);
  }

  /* ── Stage: slots + gallery ── */
  .stage {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .slots {
    display: grid;
    grid-template-columns: repeat(var(--slot-count), 1fr) auto;
    gap: 14px;
    align-items: stretch;
  }

  .slot {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 20px 16px 16px;
    border-radius: 22px;
    border: 2px solid var(--border);
    background: var(--surface-1);
    cursor: pointer;
    text-align: center;
    transition:
      border-color 0.15s ease,
      background 0.15s ease,
      transform 0.12s ease;
  }
  .slot:hover {
    border-color: var(--border-strong);
  }
  .slot.active {
    border-color: var(--accent);
    background: color-mix(in srgb, var(--accent) 8%, var(--surface-1));
    box-shadow: 0 0 0 1px var(--accent) inset;
    transform: translateY(-2px);
  }

  /* Full-card overlay button: tapping anywhere selects the slot, while the
     name input and remove button sit above it and stay interactive. */
  .select {
    position: absolute;
    inset: 0;
    border: none;
    background: transparent;
    cursor: pointer;
    border-radius: inherit;
    z-index: 0;
  }
  /* Decorative — let clicks fall through to the select overlay beneath so
     tapping the icon (or anywhere on the card) selects the player. */
  .slot > .badge,
  .slot > .slot-avatar {
    pointer-events: none;
  }
  /* Interactive — sit above the overlay. */
  .slot > .remove {
    z-index: 1;
  }
  .slot > .name {
    position: relative;
    z-index: 1;
  }

  .badge {
    position: absolute;
    top: 10px;
    left: 12px;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    font-family: var(--display);
    font-weight: 600;
    font-size: 15px;
    color: #1a132e;
    background: var(--accent);
  }
  .remove {
    position: absolute;
    top: 8px;
    right: 10px;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    font-size: 20px;
    line-height: 1;
    color: var(--text-dim);
    background: transparent;
    border: 1px solid transparent;
    cursor: pointer;
  }
  .remove:hover {
    color: var(--danger);
    border-color: var(--danger);
  }

  .slot-avatar {
    display: inline-flex;
  }

  .name {
    font-family: var(--display);
    font-size: 20px;
    text-align: center;
    padding: 8px 10px;
    border-radius: 12px;
    border: 1px solid var(--border);
    background: var(--surface-2);
    color: var(--text);
    width: 100%;
    box-sizing: border-box;
  }
  .name:focus {
    outline: none;
    border-color: var(--accent);
  }

  .add-slot {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    min-width: 96px;
    padding: 16px;
    border-radius: 22px;
    border: 2px dashed var(--border);
    background: transparent;
    color: var(--text-dim);
    cursor: pointer;
    transition:
      border-color 0.12s ease,
      color 0.12s ease;
  }
  .add-slot:hover {
    border-color: var(--gold);
    color: var(--gold);
  }
  .add-plus {
    font-family: var(--display);
    font-size: 40px;
    line-height: 1;
  }
  .add-label {
    font-family: var(--display);
    font-size: 14px;
  }

  /* ── Shared gallery ── */
  .gallery-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }
  .gallery-hint {
    margin: 0;
    font-size: 14px;
    color: var(--text-dim);
  }
  .gallery-hint strong {
    font-family: var(--display);
    font-weight: 600;
  }
  .gallery {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 10px;
  }
  .char {
    position: relative;
    padding: 6px;
    border-radius: 16px;
    border: 2px solid transparent;
    background: var(--surface-2);
    cursor: pointer;
    display: inline-flex;
    transition:
      transform 0.12s ease,
      border-color 0.12s ease,
      background 0.12s ease,
      opacity 0.12s ease;
  }
  .char:hover:not(:disabled) {
    transform: translateY(-2px);
    background: var(--surface-3);
  }
  .char.taken {
    opacity: 0.5;
  }
  .char.mine {
    border-color: var(--gold);
    background: var(--surface-3);
  }
  .char-owner {
    position: absolute;
    bottom: -4px;
    right: -4px;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    font-family: var(--display);
    font-weight: 600;
    font-size: 12px;
    color: #1a132e;
    border: 2px solid var(--surface-1);
  }
  .upload-glyph {
    width: 56px;
    height: 56px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    border: 2px dashed var(--border);
  }
  .disclaimer {
    margin: 8px auto 0;
    max-width: 60ch;
    text-align: center;
    font-size: 12px;
    color: var(--text-dim);
  }
  .char.upload:disabled {
    opacity: 0.5;
    cursor: wait;
  }
  .gallery-status {
    margin: 0;
    font-size: 13px;
    color: var(--gold);
  }
  .gallery-status.error {
    color: var(--danger);
  }

  /* ── Bottom controls ── */
  .controls {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 20px;
    flex-wrap: wrap;
  }
  .turn-row {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .label-text {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--text-dim);
  }
  .turns {
    display: flex;
    gap: 8px;
  }
  .turn {
    font-family: var(--display);
    font-size: 22px;
    width: 58px;
    height: 50px;
    border-radius: 14px;
    border: 1px solid var(--border);
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
  }

  .squad {
    flex: 1;
    min-width: 200px;
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }
  .ghost-btn {
    font-family: var(--display);
    font-size: 15px;
    padding: 8px 14px;
    border-radius: 12px;
    border: 1px solid var(--border);
    background: transparent;
    color: var(--text-dim);
    cursor: pointer;
  }
  .ghost-btn:hover {
    color: var(--text);
    border-color: var(--border-strong);
  }
  .save-banner {
    font-size: 13px;
    color: #86efac;
    background: rgba(34, 197, 94, 0.15);
    padding: 4px 10px;
    border-radius: 999px;
  }
  .saved-strip {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    max-width: 100%;
    padding-bottom: 2px;
  }
  .saved-chip {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    background: var(--surface-1);
    border: 1px solid var(--border);
    border-radius: 999px;
    padding: 3px 4px 3px 4px;
    flex: none;
  }
  .saved-load {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    border: none;
    background: transparent;
    color: var(--text);
    cursor: pointer;
    font-family: inherit;
    padding: 2px 6px 2px 2px;
    border-radius: 999px;
  }
  .saved-load:hover:not(:disabled) {
    background: var(--surface-2);
  }
  .saved-load:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
  .saved-name {
    font-family: var(--display);
    font-size: 14px;
    max-width: 90px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .saved-del {
    background: transparent;
    border: none;
    color: var(--text-dim);
    cursor: pointer;
    font-size: 16px;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    flex: none;
  }
  .saved-del:hover {
    color: var(--danger);
    background: var(--surface-2);
  }

  .start-col {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 6px;
  }
  .minigame-warning {
    margin: 0;
    font-size: 13px;
    color: var(--text-dim);
    text-align: right;
  }
  .minigame-warning .link {
    font: inherit;
    color: var(--gold);
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    text-decoration: underline;
  }
  .minigame-warning .link:hover {
    color: var(--text);
  }
  .start {
    font-family: var(--display);
    font-size: 26px;
    padding: 14px 40px;
    border-radius: 18px;
    border: none;
    background: var(--gold);
    color: #43320a;
    cursor: pointer;
    transition:
      transform 0.08s ease,
      background 0.15s ease;
  }
  .start:not(:disabled):hover {
    background: #ffd45e;
  }
  .start:not(:disabled):active {
    transform: translateY(1px);
  }
  .start:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  /* ── Narrow screens: let the slots stack and the page scroll ── */
  @media (max-width: 720px) {
    .slots {
      grid-template-columns: repeat(2, 1fr);
    }
    .add-slot {
      min-height: 120px;
    }
    .controls {
      justify-content: center;
    }
    .start-col {
      align-items: center;
    }
  }
</style>
