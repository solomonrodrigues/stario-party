import type { MiniGame } from '../types';
import { starterMiniGames } from '../minigames/starter';
import { persistedState } from './persistedState.svelte';

export const minigames = persistedState<MiniGame[]>(
  'stario:minigames',
  starterMiniGames,
);
