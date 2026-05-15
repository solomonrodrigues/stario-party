import type { PlayerPreset } from '../types';
import { persistedState } from './persistedState.svelte';

export const playerPresets = persistedState<PlayerPreset[]>(
  'stario:players',
  [],
);
