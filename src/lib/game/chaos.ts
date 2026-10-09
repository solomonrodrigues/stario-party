import { game } from '../stores/game.svelte';
import { play } from '../sound/sfx';
import type { IconName } from '../icons';

export type ChaosId =
  | 'lucky-strike'
  | 'bandit'
  | 'coin-tornado'
  | 'wallet-swap'
  | 'shooting-star';

export interface ChaosEvent {
  id: ChaosId;
  name: string;
  icon: IconName;
  // Mutates game state. Returns a human-readable description for the toast + log.
  trigger(): string;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function others(excludeId: string) {
  return game.players.filter((p) => p.id !== excludeId);
}

export const chaosEvents: ChaosEvent[] = [
  {
    id: 'lucky-strike',
    name: 'Lucky strike',
    icon: 'clover',
    trigger() {
      const target = pickRandom(game.players);
      game.players = game.players.map((p) =>
        p.id === target.id ? { ...p, coins: p.coins + 10 } : p,
      );
      return `${target.name} found 10 coins on the floor!`;
    },
  },
  {
    id: 'bandit',
    name: 'Bandit attack',
    icon: 'robber',
    trigger() {
      const target = pickRandom(game.players);
      const loss = Math.min(5, target.coins);
      game.players = game.players.map((p) =>
        p.id === target.id ? { ...p, coins: p.coins - loss } : p,
      );
      return loss > 0
        ? `A bandit swiped ${loss} coin${loss === 1 ? '' : 's'} from ${target.name}!`
        : `A bandit went after ${target.name} but their pockets were empty.`;
    },
  },
  {
    id: 'coin-tornado',
    name: 'Coin tornado',
    icon: 'tornado',
    trigger() {
      const total = game.players.reduce((s, p) => s + p.coins, 0);
      const share = Math.floor(total / game.players.length);
      const remainder = total - share * game.players.length;
      game.players = game.players.map((p, i) => ({
        ...p,
        coins: share + (i < remainder ? 1 : 0),
      }));
      return `A tornado redistributed every coin — roughly ${share} each.`;
    },
  },
  {
    id: 'wallet-swap',
    name: 'Wallet swap',
    icon: 'swap',
    trigger() {
      if (game.players.length < 2) {
        return 'A swap was attempted — but nobody to swap with.';
      }
      const a = pickRandom(game.players);
      const b = pickRandom(others(a.id));
      const aCoins = a.coins;
      const bCoins = b.coins;
      game.players = game.players.map((p) => {
        if (p.id === a.id) return { ...p, coins: bCoins };
        if (p.id === b.id) return { ...p, coins: aCoins };
        return p;
      });
      return `${a.name} and ${b.name} swapped wallets!`;
    },
  },
  {
    id: 'shooting-star',
    name: 'Shooting star',
    icon: 'falling-star',
    trigger() {
      const target = pickRandom(game.players);
      game.players = game.players.map((p) =>
        p.id === target.id ? { ...p, stars: p.stars + 1 } : p,
      );
      return `A shooting star fell straight into ${target.name}'s lap! +1 ★`;
    },
  },
];

export function triggerRandomChaos(): {
  event: ChaosEvent;
  description: string;
} {
  // Capture state first so the whole chaos event (coin/star changes + log)
  // can be reverted as a single undo step.
  game.pushUndo();
  const event = pickRandom(chaosEvents);
  const description = event.trigger();
  play(`chaos-${event.id}`);
  game.appendLog({
    kind: 'chaos',
    description,
    turn: game.currentTurn,
  });
  return { event, description };
}
