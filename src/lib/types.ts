export type PlayerId = string;
export type MiniGameId = string;

export type AvatarRef =
  | { kind: 'preset'; key: string }
  | { kind: 'upload'; dataUrl: string };

export interface PlayerPreset {
  id: PlayerId;
  name: string;
  avatar: AvatarRef;
  color: string;
}

export interface Player extends PlayerPreset {
  coins: number;
  stars: number;
}

export type MiniGameCategory =
  | 'physical'
  | 'mental'
  | 'silly'
  | 'creative'
  | 'other';

export interface MiniGame {
  id: MiniGameId;
  name: string;
  instructions: string;
  category?: MiniGameCategory;
  durationMinutes?: number;
  active: boolean;
}

export interface Settings {
  coinsPerStar: number;
  soundEnabled: boolean;
  defaultTurns: number;
}

export type Screen =
  | 'setup'
  | 'board'
  | 'minigame'
  | 'results'
  | 'manage-minigames'
  | 'settings';

export type LogEntry =
  | { kind: 'roll'; playerId: PlayerId; value: number; turn: number }
  | {
      kind: 'minigame';
      miniGameId: MiniGameId;
      winnerIds: PlayerId[];
      coinsAwarded: number;
      turn: number;
    }
  | { kind: 'star-purchase'; playerId: PlayerId; turn: number }
  | { kind: 'chaos'; description: string; turn: number };

export interface GameState {
  screen: Screen;
  players: Player[];
  currentPlayerIndex: number;
  totalTurns: number;
  currentTurn: number;
  lastRoll: number | null;
  selectedMiniGame: MiniGame | null;
  log: LogEntry[];
}

export interface MiniGameExport {
  version: 1;
  exportedAt: string;
  minigames: MiniGame[];
}
