// Synthesised arcade SFX via WebAudio oscillators — no asset files.
// Gated by settings.soundEnabled so the host can mute from the
// settings screen. Browsers require a user gesture before the audio
// context can start, so the first play() may be silent if it fires
// before any click. The Dice roll is the natural first interaction.

import { settings } from '../stores/settings.svelte';
import type { SpaceType } from '../types';
import type { ChaosId } from '../game/chaos';

export type SoundName =
  | 'roll'
  | 'dice-tick'
  | 'dice-land'
  | 'coin'
  | 'coin-loss'
  | 'star'
  | 'star-purchase'
  | 'fanfare'
  | 'roulette-start'
  | 'roulette-land'
  | `chaos-${ChaosId}`
  | `space-${SpaceType}`;

interface AudioCtor {
  new (): AudioContext;
}

interface WindowWithWebkit extends Window {
  webkitAudioContext?: AudioCtor;
}

let ctx: AudioContext | null = null;
let master: GainNode | null = null;

function ensureCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const w = window as WindowWithWebkit;
    const Ctor: AudioCtor | undefined =
      window.AudioContext ?? w.webkitAudioContext;
    if (!Ctor) return null;
    try {
      ctx = new Ctor();
      master = ctx.createGain();
      master.gain.value = 0.6;
      master.connect(ctx.destination);
    } catch {
      ctx = null;
      return null;
    }
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

interface ToneOptions {
  type?: OscillatorType;
  volume?: number;
  attack?: number;
  release?: number;
  delay?: number;
}

function tone(freq: number, duration: number, opts: ToneOptions = {}): void {
  const audio = ensureCtx();
  if (!audio || !master) return;
  const {
    type = 'sine',
    volume = 0.18,
    attack = 0.005,
    release = 0.08,
    delay = 0,
  } = opts;
  const start = audio.currentTime + delay;
  const end = start + attack + duration + release;

  const osc = audio.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);

  const gain = audio.createGain();
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(volume, start + attack);
  gain.gain.setValueAtTime(volume, start + attack + duration);
  gain.gain.linearRampToValueAtTime(0, end);

  osc.connect(gain).connect(master);
  osc.start(start);
  osc.stop(end + 0.05);
}

function noiseBurst(duration: number, volume = 0.08, delay = 0): void {
  const audio = ensureCtx();
  if (!audio || !master) return;
  const sr = audio.sampleRate;
  const samples = Math.max(1, Math.floor(duration * sr));
  const buffer = audio.createBuffer(1, samples, sr);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < samples; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / samples);
  }
  const start = audio.currentTime + delay;
  const src = audio.createBufferSource();
  src.buffer = buffer;
  const gain = audio.createGain();
  gain.gain.value = volume;
  src.connect(gain).connect(master);
  src.start(start);
  src.stop(start + duration + 0.05);
}

// One fixed sound per action, and distinct actions get distinct sounds so the
// host can tell what happened by ear.
const sounds: Record<SoundName, () => void> = {
  roll: () => {
    // The Dice Block pops in and starts hovering — a soft rounded rising
    // chirp on sine tones, no noise, so it's gentle on the ears.
    tone(523, 0.05, { type: 'sine', volume: 0.09, release: 0.05 });
    tone(784, 0.06, { type: 'sine', delay: 0.04, volume: 0.09, release: 0.05 });
    tone(1046, 0.09, { type: 'sine', delay: 0.09, volume: 0.075, release: 0.07 });
  },
  'dice-tick': () => {
    // Soft rounded blip on every face change while the block spins — a clean
    // sine "bip" (like MP's number cycle) with a gentle attack/release so a
    // rapid sequence stays smooth rather than clicky.
    tone(880, 0.018, { type: 'sine', volume: 0.035, attack: 0.003, release: 0.035 });
  },
  'dice-land': () => {
    // The Mario Party "ding" on a hit: a warm, mellow bell that rings out.
    // Kept to lower partials at softer volumes so it's bright but not piercing.
    tone(659, 0.09, { type: 'sine', volume: 0.13, release: 0.1 });
    tone(988, 0.32, { type: 'sine', delay: 0.02, volume: 0.15, release: 0.3 });
    tone(1318, 0.34, { type: 'sine', delay: 0.05, volume: 0.09, release: 0.34 });
    // One soft higher partial for a touch of shimmer, well rolled off.
    tone(1976, 0.3, { type: 'sine', delay: 0.06, volume: 0.04, release: 0.32 });
  },
  coin: () => {
    tone(988, 0.07, { type: 'triangle', volume: 0.14 });
    tone(1318, 0.14, { type: 'triangle', delay: 0.07, volume: 0.16 });
  },
  'coin-loss': () => {
    tone(988, 0.05, { type: 'triangle', volume: 0.1 });
    tone(784, 0.05, { type: 'triangle', delay: 0.06, volume: 0.1 });
    tone(587, 0.12, { type: 'triangle', delay: 0.12, volume: 0.1 });
  },
  star: () => {
    tone(1318, 0.1, { type: 'triangle', volume: 0.13 });
    tone(1568, 0.1, { type: 'triangle', delay: 0.06, volume: 0.13 });
    tone(1976, 0.2, { type: 'triangle', delay: 0.12, volume: 0.14 });
  },
  'star-purchase': () => {
    tone(330, 0.1, { type: 'square', volume: 0.08 });
    tone(523, 0.1, { type: 'triangle', delay: 0.05, volume: 0.1 });
    tone(1047, 0.22, { type: 'triangle', delay: 0.12, volume: 0.14 });
  },
  fanfare: () => {
    tone(523, 0.16, { type: 'triangle', volume: 0.16 });
    tone(659, 0.16, { type: 'triangle', delay: 0.09, volume: 0.16 });
    tone(784, 0.18, { type: 'triangle', delay: 0.18, volume: 0.18 });
    tone(1047, 0.4, { type: 'triangle', delay: 0.28, volume: 0.2 });
    tone(1568, 0.6, { type: 'sine', delay: 0.32, volume: 0.1 });
  },
  // Mini-game roulette: its own launch and landing so it doesn't echo the
  // dice roll or the end-of-game fanfare.
  'roulette-start': () => {
    tone(392, 0.06, { type: 'triangle', volume: 0.1 });
    tone(523, 0.06, { type: 'triangle', delay: 0.07, volume: 0.1 });
    tone(392, 0.06, { type: 'triangle', delay: 0.14, volume: 0.1 });
    tone(659, 0.12, { type: 'triangle', delay: 0.21, volume: 0.11 });
  },
  'roulette-land': () => {
    tone(523, 0.08, { type: 'triangle', volume: 0.15 });
    tone(523, 0.08, { type: 'triangle', delay: 0.11, volume: 0.15 });
    tone(523, 0.08, { type: 'triangle', delay: 0.22, volume: 0.15 });
    tone(784, 0.5, { type: 'triangle', delay: 0.36, volume: 0.2 });
    tone(1047, 0.5, { type: 'sine', delay: 0.36, volume: 0.1 });
  },
  // Chaos events all open with the same noise hit (so they read as "chaos"),
  // then each has its own tail.
  'chaos-lucky-strike': () => {
    noiseBurst(0.12, 0.08);
    tone(784, 0.05, { type: 'triangle', delay: 0.1, volume: 0.12 });
    tone(1047, 0.05, { type: 'triangle', delay: 0.15, volume: 0.13 });
    tone(1568, 0.16, { type: 'triangle', delay: 0.2, volume: 0.14 });
  },
  'chaos-bandit': () => {
    noiseBurst(0.12, 0.08);
    tone(330, 0.1, { type: 'sawtooth', volume: 0.1 });
    tone(247, 0.1, { type: 'sawtooth', delay: 0.1, volume: 0.1 });
    tone(165, 0.22, { type: 'sawtooth', delay: 0.2, volume: 0.11 });
  },
  'chaos-coin-tornado': () => {
    noiseBurst(0.3, 0.08);
    tone(311, 0.07, { type: 'square', volume: 0.06 });
    tone(440, 0.07, { type: 'square', delay: 0.08, volume: 0.06 });
    tone(311, 0.07, { type: 'square', delay: 0.16, volume: 0.06 });
    tone(440, 0.07, { type: 'square', delay: 0.24, volume: 0.06 });
    tone(622, 0.14, { type: 'square', delay: 0.32, volume: 0.07 });
  },
  'chaos-wallet-swap': () => {
    noiseBurst(0.12, 0.08);
    tone(523, 0.08, { type: 'triangle', delay: 0.1, volume: 0.12 });
    tone(784, 0.08, { type: 'triangle', delay: 0.2, volume: 0.12 });
    tone(784, 0.08, { type: 'triangle', delay: 0.34, volume: 0.12 });
    tone(523, 0.14, { type: 'triangle', delay: 0.44, volume: 0.12 });
  },
  'chaos-shooting-star': () => {
    noiseBurst(0.12, 0.08);
    tone(2349, 0.06, { type: 'sine', delay: 0.1, volume: 0.09 });
    tone(1976, 0.06, { type: 'sine', delay: 0.16, volume: 0.09 });
    tone(1568, 0.06, { type: 'sine', delay: 0.22, volume: 0.09 });
    tone(2093, 0.3, { type: 'triangle', delay: 0.3, volume: 0.13 });
  },
  // Landing stings — short, so they sit under the coin cue that follows.
  'space-blue': () => {
    tone(784, 0.06, { type: 'sine', volume: 0.1 });
    tone(1047, 0.12, { type: 'sine', delay: 0.06, volume: 0.11 });
  },
  'space-red': () => {
    tone(466, 0.08, { type: 'square', volume: 0.06 });
    tone(349, 0.16, { type: 'square', delay: 0.09, volume: 0.06 });
  },
  'space-event': () => {
    tone(659, 0.06, { type: 'triangle', volume: 0.1 });
    tone(880, 0.06, { type: 'triangle', delay: 0.07, volume: 0.1 });
    tone(740, 0.06, { type: 'triangle', delay: 0.14, volume: 0.1 });
    tone(988, 0.14, { type: 'triangle', delay: 0.21, volume: 0.11 });
  },
  'space-bowser': () => {
    noiseBurst(0.25, 0.06);
    tone(110, 0.3, { type: 'sawtooth', volume: 0.12 });
    tone(131, 0.3, { type: 'sawtooth', delay: 0.02, volume: 0.08 });
    tone(98, 0.4, { type: 'sawtooth', delay: 0.3, volume: 0.12 });
  },
  'space-item': () => {
    noiseBurst(0.04, 0.06);
    tone(1047, 0.05, { type: 'triangle', delay: 0.03, volume: 0.12 });
    tone(1568, 0.16, { type: 'sine', delay: 0.08, volume: 0.1 });
  },
  'space-lucky': () => {
    tone(1047, 0.05, { type: 'sine', volume: 0.1 });
    tone(1318, 0.05, { type: 'sine', delay: 0.05, volume: 0.1 });
    tone(1568, 0.05, { type: 'sine', delay: 0.1, volume: 0.1 });
    tone(2093, 0.18, { type: 'sine', delay: 0.15, volume: 0.1 });
  },
  'space-unlucky': () => {
    tone(523, 0.1, { type: 'triangle', volume: 0.11 });
    tone(494, 0.1, { type: 'triangle', delay: 0.12, volume: 0.11 });
    tone(466, 0.1, { type: 'triangle', delay: 0.24, volume: 0.11 });
    tone(440, 0.3, { type: 'triangle', delay: 0.36, volume: 0.11 });
  },
  'space-vs': () => {
    noiseBurst(0.06, 0.08);
    tone(196, 0.08, { type: 'square', volume: 0.08 });
    noiseBurst(0.06, 0.08, 0.16);
    tone(392, 0.2, { type: 'square', delay: 0.16, volume: 0.08 });
  },
};

export function play(name: SoundName): void {
  if (!settings.value.soundEnabled) return;
  sounds[name]();
}
