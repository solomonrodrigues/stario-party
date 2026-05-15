import type { Settings } from '../types';
import { persistedState } from './persistedState.svelte';

export const settings = persistedState<Settings>('stario:settings', {
  coinsPerStar: 20,
  soundEnabled: false,
  defaultTurns: 10,
});
