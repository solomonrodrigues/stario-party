import type { MiniGame } from '../types';
import { persistedState } from './persistedState.svelte';

// Phase 1 ships an empty seed list. Phase 2 will replace this with the
// bundled starter mini-games. Existing users keep their saved list.
export const minigames = persistedState<MiniGame[]>('stario:minigames', []);
