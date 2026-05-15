import type { Player } from '../types';

export function rankPlayers(players: Player[]): Player[] {
  return [...players].sort((a, b) => {
    if (b.stars !== a.stars) return b.stars - a.stars;
    return b.coins - a.coins;
  });
}
