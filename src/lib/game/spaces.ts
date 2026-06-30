import type { Player, SpaceType } from '../types';
import { game } from '../stores/game.svelte';
import { chaosEvents } from './chaos';

// A board-space type the host can say the active player landed on. Mirrors the
// chaos-event shape: `resolve` mutates game state (coins/stars only — the whole
// economy) and returns a human-readable description for the reveal + log. The
// store wraps each call in a single pushUndo() + log entry, exactly like
// triggerRandomChaos(), so resolve() must not push/log itself.
export interface SpaceDef {
  id: SpaceType;
  label: string;
  emoji: string;
  accent: string;
  resolve(active: Player): string;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function others(excludeId: string): Player[] {
  return game.players.filter((p) => p.id !== excludeId);
}

// The opponent holding the most coins (ties broken by list order). Null when
// the active player is alone.
function leaderExcluding(id: string): Player | null {
  const rest = others(id);
  if (rest.length === 0) return null;
  return rest.reduce((best, p) => (p.coins > best.coins ? p : best), rest[0]);
}

function addCoins(id: string, delta: number): void {
  game.players = game.players.map((p) =>
    p.id === id ? { ...p, coins: Math.max(0, p.coins + delta) } : p,
  );
}

function addStars(id: string, delta: number): void {
  game.players = game.players.map((p) =>
    p.id === id ? { ...p, stars: Math.max(0, p.stars + delta) } : p,
  );
}

export const spaceDefs: SpaceDef[] = [
  {
    id: 'blue',
    label: 'Blue',
    emoji: '🔵',
    accent: '#3da5ff',
    resolve(active) {
      addCoins(active.id, 3);
      return `Blue space — ${active.name} pockets 3 coins.`;
    },
  },
  {
    id: 'red',
    label: 'Red',
    emoji: '🔴',
    accent: '#e2493b',
    resolve(active) {
      const loss = Math.min(3, active.coins);
      addCoins(active.id, -3);
      return loss > 0
        ? `Red space — ${active.name} drops ${loss} coin${loss === 1 ? '' : 's'}.`
        : `Red space — but ${active.name} had no coins to lose.`;
    },
  },
  {
    id: 'event',
    label: 'Event',
    emoji: '❓',
    accent: '#46c46e',
    resolve() {
      // Reuse the chaos machinery directly. We call the event's trigger()
      // (which mutates state + returns a description) rather than
      // triggerRandomChaos(), so the store owns the single undo/log step.
      const event = pickRandom(chaosEvents);
      return `${event.emoji} ${event.trigger()}`;
    },
  },
  {
    id: 'bowser',
    label: 'Bowser',
    emoji: '👹',
    accent: '#7a1f2b',
    resolve(active) {
      const outcomes: Array<() => string> = [
        () => {
          const loss = Math.min(10, active.coins);
          addCoins(active.id, -10);
          return loss > 0
            ? `Bowser demands a toll — ${active.name} forks over ${loss} coins!`
            : `Bowser demands a toll, but ${active.name}'s pockets are empty.`;
        },
        () => {
          const loss = Math.floor(active.coins / 2);
          addCoins(active.id, -loss);
          return loss > 0
            ? `Bowser shuffles the deck — ${active.name} loses half their coins (${loss}).`
            : `Bowser shuffles the deck, but ${active.name} had nothing to lose.`;
        },
        () => {
          if (active.stars > 0) {
            addStars(active.id, -1);
            return `Bowser snatches a star from ${active.name}! −1 ★`;
          }
          const loss = Math.min(15, active.coins);
          addCoins(active.id, -15);
          return loss > 0
            ? `Bowser went for a star but took ${loss} coins from ${active.name} instead.`
            : `Bowser went for a star, but ${active.name} had nothing to give.`;
        },
      ];
      return pickRandom(outcomes)();
    },
  },
  {
    id: 'item',
    label: 'Item',
    emoji: '🎁',
    accent: '#ff9f43',
    resolve(active) {
      const items: Array<{ name: string; coins: number }> = [
        { name: 'a Mushroom', coins: 3 },
        { name: 'a Golden Pipe', coins: 5 },
        { name: 'a Treasure Chest', coins: 8 },
      ];
      const item = pickRandom(items);
      addCoins(active.id, item.coins);
      return `Item space — ${active.name} cashes in ${item.name} for ${item.coins} coins!`;
    },
  },
  {
    id: 'lucky',
    label: 'Lucky',
    emoji: '🍀',
    accent: '#2ecc71',
    resolve(active) {
      const outcomes: Array<() => string> = [
        () => {
          addCoins(active.id, 15);
          return `Lucky! ${active.name} strikes 15 coins.`;
        },
        () => {
          addCoins(active.id, 10);
          return `Lucky! ${active.name} finds 10 coins.`;
        },
        () => {
          const leader = leaderExcluding(active.id);
          if (!leader || leader.coins === 0) {
            addCoins(active.id, 10);
            return `Lucky! No one to rob, so ${active.name} grabs 10 coins instead.`;
          }
          const stolen = Math.min(5, leader.coins);
          addCoins(leader.id, -stolen);
          addCoins(active.id, stolen);
          return `Lucky! ${active.name} swipes ${stolen} coins from ${leader.name}.`;
        },
        () => {
          addStars(active.id, 1);
          return `Incredibly lucky! A star drops into ${active.name}'s lap! +1 ★`;
        },
      ];
      // The +1 ★ is the rare jackpot — weight it down so the others dominate.
      const weighted = [
        outcomes[0],
        outcomes[1],
        outcomes[2],
        outcomes[0],
        outcomes[1],
        outcomes[2],
        outcomes[3],
      ];
      return pickRandom(weighted)();
    },
  },
  {
    id: 'unlucky',
    label: 'Unlucky',
    emoji: '💀',
    accent: '#8e44ad',
    resolve(active) {
      const outcomes: Array<() => string> = [
        () => {
          const loss = Math.min(10, active.coins);
          addCoins(active.id, -10);
          return loss > 0
            ? `Unlucky! ${active.name} loses ${loss} coins down a pipe.`
            : `Unlucky! ${active.name} had no coins to lose.`;
        },
        () => {
          const rivals = others(active.id);
          if (rivals.length === 0 || active.coins === 0) {
            const loss = Math.min(8, active.coins);
            addCoins(active.id, -8);
            return loss > 0
              ? `Unlucky! ${active.name} drops ${loss} coins.`
              : `Unlucky! ${active.name} had nothing to drop.`;
          }
          const rival = pickRandom(rivals);
          const given = Math.min(5, active.coins);
          addCoins(active.id, -given);
          addCoins(rival.id, given);
          return `Unlucky! ${active.name} fumbles ${given} coins straight into ${rival.name}'s hands.`;
        },
        () => {
          const loss = Math.floor(active.coins / 2);
          addCoins(active.id, -loss);
          return loss > 0
            ? `Unlucky! Half of ${active.name}'s coins vanish (${loss}).`
            : `Unlucky! ${active.name} had nothing to lose.`;
        },
      ];
      return pickRandom(outcomes)();
    },
  },
  {
    id: 'vs',
    label: 'VS',
    emoji: '⚔️',
    accent: '#f7c948',
    resolve(active) {
      const rivals = others(active.id);
      if (rivals.length === 0) {
        return `VS space — but ${active.name} has no one to face off against.`;
      }
      const rival = pickRandom(rivals);
      const ante = Math.min(5, active.coins, rival.coins);
      if (ante === 0) {
        return `VS! ${active.name} vs ${rival.name} — but neither could ante up.`;
      }
      const pot = ante * 2;
      const winner = pickRandom([active, rival]);
      const loser = winner.id === active.id ? rival : active;
      // Loser pays their ante to the winner (winner's own ante is returned).
      addCoins(loser.id, -ante);
      addCoins(winner.id, ante);
      return `VS! ${active.name} vs ${rival.name} for a ${pot}-coin pot — ${winner.name} wins it!`;
    },
  },
];

const defById = new Map(spaceDefs.map((d) => [d.id, d] as const));

export function spaceDef(id: SpaceType): SpaceDef | undefined {
  return defById.get(id);
}
