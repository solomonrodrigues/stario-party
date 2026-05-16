// Synthesised arcade SFX via WebAudio oscillators — no asset files.
// Gated by settings.soundEnabled so the host can mute from the
// settings screen. Browsers require a user gesture before the audio
// context can start, so the first play() may be silent if it fires
// before any click. The Dice roll is the natural first interaction.

import { settings } from '../stores/settings.svelte';

export type SoundName =
  | 'roll'
  | 'dice-tick'
  | 'dice-land'
  | 'reveal'
  | 'coin'
  | 'star'
  | 'star-purchase'
  | 'fanfare'
  | 'chaos';

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

export function play(name: SoundName): void {
  if (!settings.value.soundEnabled) return;
  switch (name) {
    case 'roll':
      // First-click whoosh: the block is now active.
      noiseBurst(0.06, 0.05);
      tone(440, 0.06, { type: 'square', volume: 0.07 });
      tone(660, 0.08, { type: 'square', delay: 0.04, volume: 0.06 });
      break;
    case 'dice-tick':
      // Tiny percussive click fired on every face change while spinning.
      // Volume is intentionally tiny so a rapid sequence isn't fatiguing.
      tone(1280, 0.012, {
        type: 'square',
        volume: 0.045,
        attack: 0.0005,
        release: 0.004,
      });
      break;
    case 'dice-land':
      // Chunky stop impact: noise punch + descending blip.
      noiseBurst(0.06, 0.12);
      tone(330, 0.08, { type: 'square', volume: 0.16 });
      tone(523, 0.14, { type: 'triangle', delay: 0.04, volume: 0.16 });
      tone(784, 0.18, { type: 'triangle', delay: 0.1, volume: 0.12 });
      break;
    case 'coin':
      tone(988, 0.07, { type: 'triangle', volume: 0.14 });
      tone(1318, 0.14, { type: 'triangle', delay: 0.07, volume: 0.16 });
      break;
    case 'star':
      tone(1318, 0.1, { type: 'triangle', volume: 0.13 });
      tone(1568, 0.1, { type: 'triangle', delay: 0.06, volume: 0.13 });
      tone(1976, 0.2, { type: 'triangle', delay: 0.12, volume: 0.14 });
      break;
    case 'star-purchase':
      tone(330, 0.1, { type: 'square', volume: 0.08 });
      tone(523, 0.1, { type: 'triangle', delay: 0.05, volume: 0.1 });
      tone(1047, 0.22, { type: 'triangle', delay: 0.12, volume: 0.14 });
      break;
    case 'reveal':
      tone(440, 0.1, { type: 'sawtooth', volume: 0.06 });
      tone(587, 0.12, { type: 'sawtooth', delay: 0.08, volume: 0.07 });
      tone(784, 0.2, { type: 'sawtooth', delay: 0.18, volume: 0.09 });
      tone(1175, 0.3, { type: 'triangle', delay: 0.28, volume: 0.12 });
      break;
    case 'fanfare':
      tone(523, 0.16, { type: 'triangle', volume: 0.16 });
      tone(659, 0.16, { type: 'triangle', delay: 0.09, volume: 0.16 });
      tone(784, 0.18, { type: 'triangle', delay: 0.18, volume: 0.18 });
      tone(1047, 0.4, { type: 'triangle', delay: 0.28, volume: 0.2 });
      tone(1568, 0.6, { type: 'sine', delay: 0.32, volume: 0.1 });
      break;
    case 'chaos':
      noiseBurst(0.18, 0.1);
      tone(220, 0.18, { type: 'sawtooth', volume: 0.12 });
      tone(140, 0.22, { type: 'sawtooth', delay: 0.04, volume: 0.1 });
      tone(440, 0.1, { type: 'square', delay: 0.18, volume: 0.08 });
      break;
  }
}
