<script lang="ts">
  import { fly } from 'svelte/transition';
  import type { MiniGame, MiniGameCategory } from '../types';
  import { minigames } from '../stores/minigames.svelte';
  import { game } from '../stores/game.svelte';
  import {
    exportMiniGames,
    importMiniGamesFromFile,
  } from '../minigames/io';

  const CATEGORIES: MiniGameCategory[] = [
    'physical',
    'mental',
    'silly',
    'creative',
    'other',
  ];

  let editingId = $state<string | null>(null);
  let draft = $state<MiniGame | null>(null);
  let banner = $state<{ kind: 'ok' | 'err'; text: string } | null>(null);
  let importInput: HTMLInputElement | null = $state(null);

  function blankGame(): MiniGame {
    return {
      id: crypto.randomUUID(),
      name: '',
      instructions: '',
      category: 'silly',
      durationMinutes: 2,
      active: true,
    };
  }

  function startNew() {
    draft = blankGame();
    editingId = draft.id;
  }

  function startEdit(g: MiniGame) {
    draft = { ...g };
    editingId = g.id;
  }

  function cancelEdit() {
    draft = null;
    editingId = null;
  }

  function saveDraft() {
    if (!draft) return;
    const cleaned: MiniGame = {
      ...draft,
      name: draft.name.trim(),
      instructions: draft.instructions.trim(),
    };
    if (!cleaned.name || !cleaned.instructions) return;

    const list = minigames.value;
    const idx = list.findIndex((m) => m.id === cleaned.id);
    if (idx === -1) {
      minigames.value = [...list, cleaned];
    } else {
      const next = [...list];
      next[idx] = cleaned;
      minigames.value = next;
    }
    draft = null;
    editingId = null;
  }

  function toggleActive(g: MiniGame) {
    minigames.value = minigames.value.map((m) =>
      m.id === g.id ? { ...m, active: !m.active } : m,
    );
  }

  function remove(g: MiniGame) {
    if (!confirm(`Delete "${g.name}"?`)) return;
    minigames.value = minigames.value.filter((m) => m.id !== g.id);
    if (editingId === g.id) cancelEdit();
  }

  function doExport() {
    if (minigames.value.length === 0) {
      banner = { kind: 'err', text: 'Nothing to export yet.' };
      return;
    }
    exportMiniGames(minigames.value);
    banner = {
      kind: 'ok',
      text: `Exported ${minigames.value.length} mini-game(s).`,
    };
  }

  function pickImport() {
    importInput?.click();
  }

  async function handleImportFile(file: File) {
    try {
      const incoming = await importMiniGamesFromFile(file);
      minigames.value = [...minigames.value, ...incoming];
      banner = {
        kind: 'ok',
        text: `Imported ${incoming.length} mini-game(s).`,
      };
    } catch (err) {
      banner = {
        kind: 'err',
        text:
          err instanceof Error ? err.message : 'Import failed.',
      };
    } finally {
      if (importInput) importInput.value = '';
    }
  }

  function activeCount(): number {
    return minigames.value.filter((m) => m.active).length;
  }
</script>

<section class="manage">
  <header class="header">
    <button class="back" type="button" onclick={() => game.goTo('setup')}>
      ← Back
    </button>
    <h1>Mini-games</h1>
    <div class="badges">
      <span class="badge">{activeCount()} active</span>
      <span class="badge muted">{minigames.value.length} total</span>
    </div>
  </header>

  <div class="toolbar">
    <button class="add" type="button" onclick={startNew}>+ New mini-game</button>
    <div class="io">
      <button class="io-btn" type="button" onclick={doExport}>Export JSON</button>
      <button class="io-btn" type="button" onclick={pickImport}>Import JSON</button>
      <input
        bind:this={importInput}
        type="file"
        accept="application/json,.json"
        hidden
        onchange={(e) => {
          const file = e.currentTarget.files?.[0];
          if (file) void handleImportFile(file);
        }}
      />
    </div>
  </div>

  {#if banner}
    <div class="banner banner-{banner.kind}" transition:fly={{ y: -8, duration: 200 }}>
      {banner.text}
      <button class="banner-close" type="button" onclick={() => (banner = null)}>×</button>
    </div>
  {/if}

  {#if draft && editingId}
    {@const d = draft}
    <div class="editor" transition:fly={{ y: -8, duration: 220 }}>
      <h2>{minigames.value.some((m) => m.id === d.id) ? 'Edit' : 'New'} mini-game</h2>
      <label>
        <span class="label-text">Name</span>
        <input
          type="text"
          maxlength="60"
          value={d.name}
          oninput={(e) => (draft = { ...d, name: e.currentTarget.value })}
        />
      </label>
      <label>
        <span class="label-text">Instructions</span>
        <textarea
          rows="5"
          maxlength="600"
          value={d.instructions}
          oninput={(e) =>
            (draft = { ...d, instructions: e.currentTarget.value })}
        ></textarea>
      </label>
      <div class="row">
        <label class="grow">
          <span class="label-text">Category</span>
          <select
            value={d.category ?? 'silly'}
            onchange={(e) =>
              (draft = {
                ...d,
                category: e.currentTarget.value as MiniGameCategory,
              })}
          >
            {#each CATEGORIES as c (c)}
              <option value={c}>{c}</option>
            {/each}
          </select>
        </label>
        <label class="grow">
          <span class="label-text">Duration (min)</span>
          <input
            type="number"
            min="1"
            max="60"
            value={d.durationMinutes ?? ''}
            oninput={(e) => {
              const n = Number(e.currentTarget.value);
              draft = {
                ...d,
                durationMinutes: Number.isFinite(n) && n > 0 ? n : undefined,
              };
            }}
          />
        </label>
      </div>
      <div class="editor-actions">
        <button class="ghost" type="button" onclick={cancelEdit}>Cancel</button>
        <button
          class="primary"
          type="button"
          disabled={!d.name.trim() || !d.instructions.trim()}
          onclick={saveDraft}
        >
          Save
        </button>
      </div>
    </div>
  {/if}

  <ul class="list">
    {#each minigames.value as g (g.id)}
      <li class="row-item" class:inactive={!g.active}>
        <label class="active-toggle">
          <input
            type="checkbox"
            checked={g.active}
            onchange={() => toggleActive(g)}
          />
          <span class="check" aria-hidden="true"></span>
        </label>
        <div class="meta">
          <div class="name">{g.name}</div>
          <div class="sub">
            {#if g.category}
              <span class="cat cat-{g.category}">{g.category}</span>
            {/if}
            {#if g.durationMinutes}
              <span>~{g.durationMinutes} min</span>
            {/if}
          </div>
          <p class="excerpt">{g.instructions}</p>
        </div>
        <div class="ops">
          <button class="op" type="button" onclick={() => startEdit(g)}>Edit</button>
          <button class="op danger" type="button" onclick={() => remove(g)}>
            Delete
          </button>
        </div>
      </li>
    {:else}
      <li class="empty">No mini-games yet. Add one or import a list.</li>
    {/each}
  </ul>
</section>

<style>
  .manage {
    max-width: 960px;
    margin: 0 auto;
    padding: 24px 24px 64px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  .header {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
  }
  .header h1 {
    font-family: var(--display);
    font-size: 40px;
    margin: 0;
    color: var(--gold);
    flex: 1;
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
  .badges {
    display: flex;
    gap: 8px;
  }
  .badge {
    font-family: var(--display);
    font-size: 13px;
    padding: 6px 12px;
    border-radius: 999px;
    background: var(--gold);
    color: #1a132e;
  }
  .badge.muted {
    background: var(--surface-2);
    color: var(--text-dim);
  }

  .toolbar {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  }
  .add {
    font-family: var(--display);
    font-size: 18px;
    padding: 10px 18px;
    border-radius: 14px;
    border: none;
    background: var(--gold);
    color: #1a132e;
    cursor: pointer;
    box-shadow: 0 4px 0 #b78a17;
  }
  .add:hover {
    transform: translateY(2px);
    box-shadow: 0 2px 0 #b78a17;
  }
  .io {
    display: flex;
    gap: 8px;
  }
  .io-btn {
    font-family: var(--display);
    font-size: 15px;
    padding: 10px 14px;
    border-radius: 12px;
    border: 2px solid var(--border);
    background: var(--surface-2);
    color: var(--text);
    cursor: pointer;
  }
  .io-btn:hover {
    border-color: var(--gold);
  }

  .banner {
    border-radius: 12px;
    padding: 12px 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    font-family: var(--display);
  }
  .banner-ok {
    background: rgba(34, 197, 94, 0.15);
    border: 1px solid rgba(34, 197, 94, 0.4);
    color: #86efac;
  }
  .banner-err {
    background: rgba(239, 68, 68, 0.15);
    border: 1px solid rgba(239, 68, 68, 0.4);
    color: #fca5a5;
  }
  .banner-close {
    background: transparent;
    border: none;
    color: inherit;
    font-size: 20px;
    cursor: pointer;
    padding: 0 4px;
  }

  .editor {
    background: var(--surface-1);
    border: 2px solid var(--gold);
    border-radius: 20px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .editor h2 {
    font-family: var(--display);
    font-size: 22px;
    margin: 0 0 4px;
  }
  .editor label {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .label-text {
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-dim);
  }
  input[type='text'],
  input[type='number'],
  select,
  textarea {
    font: inherit;
    font-size: 18px;
    padding: 10px 12px;
    background: var(--surface-2);
    color: var(--text);
    border: 2px solid var(--border);
    border-radius: 12px;
    width: 100%;
    box-sizing: border-box;
  }
  textarea {
    font-family: var(--sans);
    line-height: 1.45;
    resize: vertical;
  }
  input:focus,
  textarea:focus,
  select:focus {
    outline: none;
    border-color: var(--gold);
  }
  .row {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }
  .grow {
    flex: 1 1 200px;
  }
  .editor-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }
  .ghost,
  .primary {
    font-family: var(--display);
    font-size: 18px;
    padding: 10px 18px;
    border-radius: 12px;
    cursor: pointer;
    border: 2px solid var(--border);
  }
  .ghost {
    background: transparent;
    color: var(--text-dim);
  }
  .primary {
    background: var(--gold);
    color: #1a132e;
    border-color: var(--gold);
  }
  .primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .empty {
    text-align: center;
    color: var(--text-dim);
    padding: 24px;
  }
  .row-item {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    background: var(--surface-1);
    border: 2px solid var(--border);
    border-radius: 16px;
    padding: 14px 16px;
    transition: opacity 0.15s ease;
  }
  .row-item.inactive {
    opacity: 0.55;
  }
  .active-toggle {
    flex: none;
    width: 28px;
    height: 28px;
    cursor: pointer;
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  .active-toggle input {
    position: absolute;
    inset: 0;
    opacity: 0;
    cursor: pointer;
  }
  .check {
    width: 22px;
    height: 22px;
    border: 2px solid var(--border);
    border-radius: 6px;
    background: var(--surface-2);
    position: relative;
    transition:
      background 0.15s ease,
      border-color 0.15s ease;
  }
  .active-toggle input:checked + .check {
    background: var(--gold);
    border-color: var(--gold);
  }
  .active-toggle input:checked + .check::after {
    content: '✓';
    position: absolute;
    inset: 0;
    color: #1a132e;
    font-size: 16px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .meta {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }
  .name {
    font-family: var(--display);
    font-size: 22px;
  }
  .sub {
    display: flex;
    gap: 10px;
    color: var(--text-dim);
    font-size: 13px;
  }
  .cat {
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    padding: 2px 8px;
    border-radius: 999px;
    background: var(--surface-2);
  }
  .cat-physical { color: #fb923c; }
  .cat-mental { color: #60a5fa; }
  .cat-silly { color: #ff5d8f; }
  .cat-creative { color: #34d399; }
  .cat-other { color: var(--text-dim); }
  .excerpt {
    margin: 4px 0 0;
    font-size: 14px;
    color: var(--text);
    opacity: 0.85;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .ops {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: none;
  }
  .op {
    font-family: var(--display);
    font-size: 13px;
    padding: 6px 12px;
    border-radius: 10px;
    border: 1px solid var(--border);
    background: var(--surface-2);
    color: var(--text-dim);
    cursor: pointer;
  }
  .op:hover {
    color: var(--text);
    border-color: var(--text-dim);
  }
  .op.danger:hover {
    color: var(--danger);
    border-color: var(--danger);
  }
</style>
