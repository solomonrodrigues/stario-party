import type {
  LogEntry,
  MiniGame,
  MiniGameId,
  Player,
  PlayerId,
  PlayerPreset,
  Screen,
} from '../types';
import { settings } from './settings.svelte';

class GameStore {
  screen = $state<Screen>('setup');
  players = $state<Player[]>([]);
  currentPlayerIndex = $state(0);
  totalTurns = $state(10);
  currentTurn = $state(1);
  lastRoll = $state<number | null>(null);
  selectedMiniGame = $state<MiniGame | null>(null);
  log = $state<LogEntry[]>([]);

  get currentPlayer(): Player | null {
    return this.players[this.currentPlayerIndex] ?? null;
  }

  startGame(presets: PlayerPreset[], totalTurns: number): void {
    this.players = presets.map((p) => ({ ...p, coins: 0, stars: 0 }));
    this.totalTurns = totalTurns;
    this.currentTurn = 1;
    this.currentPlayerIndex = 0;
    this.lastRoll = null;
    this.selectedMiniGame = null;
    this.log = [];
    this.screen = 'board';
  }

  recordRoll(value: number): void {
    const player = this.currentPlayer;
    if (!player) return;
    this.lastRoll = value;
    this.log = [
      ...this.log,
      { kind: 'roll', playerId: player.id, value, turn: this.currentTurn },
    ];
  }

  goToMiniGame(): void {
    this.screen = 'minigame';
  }

  selectMiniGame(game: MiniGame): void {
    this.selectedMiniGame = game;
  }

  awardMiniGame(
    miniGameId: MiniGameId,
    winnerIds: PlayerId[],
    coinsPerWinner: number,
  ): void {
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
    this.advanceTurn();
  }

  buyStar(playerId: PlayerId): boolean {
    const cost = settings.value.coinsPerStar;
    const idx = this.players.findIndex((p) => p.id === playerId);
    if (idx === -1) return false;
    const player = this.players[idx];
    if (player.coins < cost) return false;
    const updated = { ...player, coins: player.coins - cost, stars: player.stars + 1 };
    const next = [...this.players];
    next[idx] = updated;
    this.players = next;
    this.log = [
      ...this.log,
      { kind: 'star-purchase', playerId, turn: this.currentTurn },
    ];
    return true;
  }

  advanceTurn(): void {
    const nextIndex = this.currentPlayerIndex + 1;
    if (nextIndex >= this.players.length) {
      // Full round complete
      if (this.currentTurn >= this.totalTurns) {
        this.screen = 'results';
        return;
      }
      this.currentPlayerIndex = 0;
      this.currentTurn += 1;
    } else {
      this.currentPlayerIndex = nextIndex;
    }
    this.screen = 'board';
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
    this.selectedMiniGame = null;
    this.log = [];
  }

  goTo(screen: Screen): void {
    this.screen = screen;
  }
}

export const game = new GameStore();
