# Stario Party

A browser-based host tool for running an IRL party game in the style of Mario
Party. One person runs the laptop (ideally cast to a TV), 2–4 players gather
around. The app handles turns, coins, stars, dice rolls, and mini-game
selection — with animations and reveals that make it feel like a game show
rather than a spreadsheet.

**Live:** <https://solomonrodrigues.github.io/stario-party/>

## Features

- 2–4 player setup with names, accent colors, and avatars (preset SVGs or your
  own uploaded image, center-cropped to 256×256 in the browser).
- Animated d10 dice roll, slot-machine mini-game roulette, Tween-driven coin
  and star counters.
- 14 bundled starter mini-games (theme-neutral living-room games) plus full
  CRUD for your own — add, edit, delete, active/inactive toggle.
- JSON import / export so you can share your mini-game collection.
- Five chaos events to shake things up on demand.
- Synthesised arcade SFX via WebAudio (no asset files, no external deps).
  Off by default — toggle in Settings.
- Persistent player presets, custom mini-games, and settings via
  `localStorage`. The active session is in-memory only (refresh starts over).

## Stack

Svelte 5 (with runes) · TypeScript (strict) · Vite · plain CSS · zero runtime
dependencies. Animations are Svelte's `Tween` / `Spring` motion classes plus
`transition:` / `animate:` directives and CSS keyframes.

Deployed via the GitHub Actions workflow at `.github/workflows/deploy.yml`,
which builds on every push to `main` and publishes to GitHub Pages.

## Run locally

```bash
npm install
npm run dev      # http://localhost:5173/stario-party/
npm run check    # svelte-check + tsc
npm run build    # production build into dist/
npm run preview  # serve the build locally
```

## Project structure

```
src/
  App.svelte                  # screen orchestrator
  main.ts                     # entry point
  app.css                     # base styles + CSS custom properties
  lib/
    types.ts                  # domain types
    stores/                   # runes-based stores (persisted + session)
    avatars/                  # SVG presets + canvas resize helper
    minigames/                # starter games + JSON import/export
    game/                     # pure logic (rankPlayers, chaos events)
    sound/                    # WebAudio synthesised SFX
    components/               # Dice, Avatar, CoinCounter, PlayerCard, ...
    screens/                  # Setup, Board, MiniGame, Results, Manage, Settings
```

## Data and persistence

`localStorage` keys:

- `stario:players` — saved player presets (name, avatar, color)
- `stario:minigames` — full mini-game list, including the bundled starters
  on first launch
- `stario:settings` — coins-per-star, default turns, sound on/off

Settings → "Clear all saved data" wipes the lot and restores starters.

## Notes on assets

No third-party character art, sprites, or copyrighted audio is bundled. All
SVG avatars and sound effects are original (or synthesised at runtime).
Uploaded photos stay in your browser's localStorage as base64 data URLs —
nothing leaves the machine.
