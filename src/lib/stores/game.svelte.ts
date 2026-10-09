import type {
  LogEntry,
  MiniGame,
  MiniGameId,
  Player,
  PlayerId,
  PlayerPreset,
  Screen,
  SpaceOutcome,
  SpaceType,
} from '../types';
import { spaceDef } from '../game/spaces';
import { play } from '../sound/sfx';
import { settings } from './settings.svelte';

const SESSION_KEY = 'stario:session';
const SESSION_VERSION = 1;
// How many in-progress actions the host can step back through. Undo history
// is in-memory only (not persisted) — it covers misclicks during live play,
// not recovery across a refresh.
const UNDO_CAP = 25;

interface SessionSnapshot {
  version: number;
  screen: Screen;
  players: Player[];
  currentPlayerIndex: number;
  totalTurns: number;
  currentTurn: number;
  lastRoll: number | null;
  lastOutcome: SpaceOutcome | null;
  selectedMiniGame: MiniGame | null;
  log: LogEntry[];
}

// Screens that represent a game actually in progress and therefore worth
// offering to recover after a refresh / crash. 'setup' has nothing to save;
// 'results' is a finished game; the standalone manager/settings screens are
// reachable from setup and aren't a live session.
const RESUMABLE_SCREENS = new Set<Screen>(['order-roll', 'board', 'minigame']);

function loadSnapshot(): SessionSnapshot | null {
  if (typeof localStorage === 'undefined') return null;
  const raw = localStorage.getItem(SESSION_KEY);
  if (raw === null) return null;
  try {
    const parsed = JSON.parse(raw) as SessionSnapshot;
    if (parsed.version !== SESSION_VERSION) return null;
    if (!RESUMABLE_SCREENS.has(parsed.screen)) return null;
    if (!Array.isArray(parsed.players) || parsed.players.length === 0) {
      return null;
    }
    return parsed;
  } catch (err) {
    console.warn('[stario] Could not parse saved session; ignoring.', err);
    return null;
  }
}

class GameStore {
  screen = $state<Screen>('setup');
  players = $state<Player[]>([]);
  currentPlayerIndex = $state(0);
  totalTurns = $state(10);
  currentTurn = $state(1);
  lastRoll = $state<number | null>(null);
  lastOutcome = $state<SpaceOutcome | null>(null);
  selectedMiniGame = $state<MiniGame | null>(null);
  log = $state<LogEntry[]>([]);

  // A recoverable session found in storage on load. Held aside (not applied
  // to live state) until the host chooses Resume or Start fresh, so the live
  // 'setup' screen doesn't clobber the saved game before they decide.
  recoverable = $state<SessionSnapshot | null>(null);

  // In-memory stack of serialized states, one per undoable host action.
  history = $state<string[]>([]);

  constructor() {
    this.recoverable = loadSnapshot();
    this.startPersistence();
  }

  get currentPlayer(): Player | null {
    return this.players[this.currentPlayerIndex] ?? null;
  }

  get canUndo(): boolean {
    return this.history.length > 0;
  }

  // Serialize the live game to a JSON string. Reading every field directly
  // here (JSON.stringify deep-reads the reactive proxies) is what makes the
  // persistence effect below re-run on ANY change — including player/log-only
  // mutations such as chaos events and star purchases. Routing these reads
  // through `$state.snapshot()` instead failed to register them as effect
  // dependencies, so those events were silently dropped on refresh.
  private serializeState(): string {
    return JSON.stringify({
      version: SESSION_VERSION,
      screen: this.screen,
      players: this.players,
      currentPlayerIndex: this.currentPlayerIndex,
      totalTurns: this.totalTurns,
      currentTurn: this.currentTurn,
      lastRoll: this.lastRoll,
      lastOutcome: this.lastOutcome,
      selectedMiniGame: this.selectedMiniGame,
      log: this.log,
    });
  }

  private applySnapshot(s: SessionSnapshot): void {
    this.players = s.players;
    this.currentPlayerIndex = s.currentPlayerIndex;
    this.totalTurns = s.totalTurns;
    this.currentTurn = s.currentTurn;
    this.lastRoll = s.lastRoll;
    this.lastOutcome = s.lastOutcome ?? null;
    this.selectedMiniGame = s.selectedMiniGame;
    this.log = s.log;
    this.screen = s.screen;
  }

  // Mirror the live session to localStorage on every change so a refresh,
  // sleep, or crash mid-party can be recovered. While the host is on the
  // setup screen we keep storage clear — unless an undecided recoverable
  // session is still waiting, which we must not overwrite.
  private startPersistence(): void {
    if (typeof localStorage === 'undefined') return;
    $effect.root(() => {
      $effect(() => {
        const json = this.serializeState();
        // Reading recoverable here keeps the effect subscribed to it.
        const pending = this.recoverable !== null;
        try {
          if (RESUMABLE_SCREENS.has(this.screen)) {
            localStorage.setItem(SESSION_KEY, json);
          } else if (!pending) {
            localStorage.removeItem(SESSION_KEY);
          }
        } catch (err) {
          console.error('[stario] Failed to persist session:', err);
        }
      });
    });
  }

  // Apply a recovered session and drop back into play where the host left off.
  resumeSession(): void {
    const s = this.recoverable;
    if (!s) return;
    this.recoverable = null;
    this.clearUndo();
    this.applySnapshot(s);
  }

  // Throw away the recovered session and start clean. Clearing recoverable
  // lets the persistence effect wipe the stored snapshot.
  discardSession(): void {
    this.recoverable = null;
  }

  // Capture the current state so the host's next action can be reverted.
  // Called at the start of each undoable mutation.
  pushUndo(): void {
    const next = [...this.history, this.serializeState()];
    this.history = next.length > UNDO_CAP ? next.slice(-UNDO_CAP) : next;
  }

  private clearUndo(): void {
    if (this.history.length > 0) this.history = [];
  }

  // Step back one host action. No-op when there's nothing to undo.
  undo(): void {
    if (this.history.length === 0) return;
    const json = this.history[this.history.length - 1];
    this.history = this.history.slice(0, -1);
    try {
      this.applySnapshot(JSON.parse(json) as SessionSnapshot);
    } catch (err) {
      console.error('[stario] Failed to undo:', err);
    }
  }

  startGame(presets: PlayerPreset[], totalTurns: number): void {
    this.players = presets.map((p) => ({ ...p, coins: 0, stars: 0 }));
    this.totalTurns = totalTurns;
    this.currentTurn = 1;
    this.currentPlayerIndex = 0;
    this.lastRoll = null;
    this.lastOutcome = null;
    this.selectedMiniGame = null;
    this.log = [];
    this.clearUndo();
    this.screen = 'order-roll';
  }

  // Reorders the player list (without mutating coins/stars) and enters
  // the first round on the board.
  applyTurnOrder(orderedIds: PlayerId[]): void {
    const byId = new Map(this.players.map((p) => [p.id, p] as const));
    const reordered: Player[] = [];
    for (const id of orderedIds) {
      const p = byId.get(id);
      if (p) reordered.push(p);
    }
    // Append any players that weren't in the ordering (defensive).
    for (const p of this.players) {
      if (!orderedIds.includes(p.id)) reordered.push(p);
    }
    this.players = reordered;
    this.currentPlayerIndex = 0;
    this.lastRoll = null;
    this.lastOutcome = null;
    this.clearUndo();
    this.screen = 'board';
  }

  recordRoll(value: number): void {
    const player = this.currentPlayer;
    if (!player) return;
    this.pushUndo();
    this.lastRoll = value;
    this.log = [
      ...this.log,
      { kind: 'roll', playerId: player.id, value, turn: this.currentTurn },
    ];
  }

  // Resolve the space the active player landed on after their roll. One space
  // per roll: requires a roll and no outcome yet. Mirrors triggerRandomChaos —
  // a single pushUndo() + log entry wraps the def's mutation, so undo reverts
  // the whole landing and the host can re-pick.
  resolveSpace(spaceType: SpaceType): void {
    const player = this.currentPlayer;
    if (!player) return;
    if (this.lastRoll === null || this.lastOutcome !== null) return;
    const def = spaceDef(spaceType);
    if (!def) return;
    this.pushUndo();
    const description = def.resolve(player);
    this.lastOutcome = {
      spaceType: def.id,
      label: def.label,
      icon: def.icon,
      accent: def.accent,
      description,
    };
    this.log = [
      ...this.log,
      {
        kind: 'space',
        playerId: player.id,
        spaceType: def.id,
        description,
        turn: this.currentTurn,
      },
    ];
    play(`space-${def.id}`);
  }

  // Called from BoardScreen after a player has rolled and finished
  // their physical move. If more players are in the round, hands off
  // to them; otherwise launches the round's mini-game.
  endPlayerTurn(): void {
    this.clearUndo();
    this.lastOutcome = null;
    if (this.currentPlayerIndex < this.players.length - 1) {
      this.currentPlayerIndex += 1;
      this.lastRoll = null;
      this.screen = 'board';
    } else {
      this.lastRoll = null;
      this.screen = 'minigame';
    }
  }

  selectMiniGame(game: MiniGame): void {
    this.selectedMiniGame = game;
  }

  awardMiniGame(
    miniGameId: MiniGameId,
    winnerIds: PlayerId[],
    coinsPerWinner: number,
  ): void {
    this.clearUndo();
    if (winnerIds.length > 0 && coinsPerWinner !== 0) {
      this.players = this.players.map((p) =>
        winnerIds.includes(p.id)
          ? { ...p, coins: Math.max(0, p.coins + coinsPerWinner) }
          : p,
      );
    }
    this.log = [
      ...this.log,
      {
        kind: 'minigame',
        miniGameId,
        winnerIds,
        coinsAwarded: coinsPerWinner,
        turn: this.currentTurn,
      },
    ];
    this.selectedMiniGame = null;
    this.lastRoll = null;
    this.endRound();
  }

  // End of a round: either advance to the next round (back to board,
  // first player) or finish the game.
  endRound(): void {
    this.clearUndo();
    if (this.currentTurn >= this.totalTurns) {
      this.screen = 'results';
      return;
    }
    this.currentTurn += 1;
    this.currentPlayerIndex = 0;
    this.lastRoll = null;
    this.lastOutcome = null;
    this.screen = 'board';
  }

  buyStar(playerId: PlayerId): boolean {
    const cost = settings.value.coinsPerStar;
    const idx = this.players.findIndex((p) => p.id === playerId);
    if (idx === -1) return false;
    const player = this.players[idx];
    if (player.coins < cost) return false;
    this.pushUndo();
    const updated = {
      ...player,
      coins: player.coins - cost,
      stars: player.stars + 1,
    };
    const next = [...this.players];
    next[idx] = updated;
    this.players = next;
    this.log = [
      ...this.log,
      { kind: 'star-purchase', playerId, turn: this.currentTurn },
    ];
    return true;
  }

  appendLog(entry: LogEntry): void {
    this.log = [...this.log, entry];
  }

  reset(): void {
    this.screen = 'setup';
    this.players = [];
    this.currentPlayerIndex = 0;
    this.currentTurn = 1;
    this.lastRoll = null;
    this.lastOutcome = null;
    this.selectedMiniGame = null;
    this.log = [];
    this.clearUndo();
  }

  goTo(screen: Screen): void {
    this.screen = screen;
  }
}

export const game = new GameStore();
