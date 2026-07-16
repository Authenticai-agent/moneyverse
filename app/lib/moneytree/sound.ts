'use client';

/**
 * Money Tree - sound engine (pure Web Audio, no asset files)
 * ------------------------------------------------------------
 * Small synthesized sound cues via oscillators - no external audio files to
 * download or license, works offline, tiny bundle cost. Respects a muted
 * preference persisted in localStorage.
 */

const MUTE_KEY = 'moneytree:muted';

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

export function isMuted(): boolean {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(MUTE_KEY) === '1';
}

export function setMuted(muted: boolean): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
}

/** Play a single tone. Frequency in Hz, duration in seconds. */
function tone(freq: number, start: number, duration: number, opts: { type?: OscillatorType; gain?: number } = {}): void {
  const audio = getCtx();
  if (!audio || isMuted()) return;
  const osc = audio.createOscillator();
  const gainNode = audio.createGain();
  osc.type = opts.type ?? 'sine';
  osc.frequency.value = freq;
  const peak = opts.gain ?? 0.12;
  const t0 = audio.currentTime + start;
  gainNode.gain.setValueAtTime(0, t0);
  gainNode.gain.linearRampToValueAtTime(peak, t0 + 0.015);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(gainNode);
  gainNode.connect(audio.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

/** A short ascending arpeggio - used for wins, stage-ups, cashing out. */
function arpeggioUp(notes: number[], step = 0.09, duration = 0.22): void {
  notes.forEach((f, i) => tone(f, i * step, duration, { type: 'triangle' }));
}

/** A short descending tone pair - used for losses. */
function descend(notes: number[], step = 0.1, duration = 0.28): void {
  notes.forEach((f, i) => tone(f, i * step, duration, { type: 'sawtooth', gain: 0.09 }));
}

/** A quick pitch sweep (rising or falling) - used for the coin-toss launch. */
function sweep(from: number, to: number, start: number, duration: number, gain = 0.06): void {
  const audio = getCtx();
  if (!audio || isMuted()) return;
  const osc = audio.createOscillator();
  const gainNode = audio.createGain();
  osc.type = 'sine';
  const t0 = audio.currentTime + start;
  osc.frequency.setValueAtTime(from, t0);
  osc.frequency.exponentialRampToValueAtTime(to, t0 + duration);
  gainNode.gain.setValueAtTime(0, t0);
  gainNode.gain.linearRampToValueAtTime(gain, t0 + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(gainNode);
  gainNode.connect(audio.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

/** A short burst of filtered noise, shaped into a bright metallic "clink" -
 * a coin landing needs a percussive transient a pure oscillator can't give,
 * so this builds one short buffer of random samples and band-passes it. */
function clink(start = 0, gain = 0.16): void {
  const audio = getCtx();
  if (!audio || isMuted()) return;
  const t0 = audio.currentTime + start;
  const duration = 0.12;
  const buffer = audio.createBuffer(1, Math.ceil(audio.sampleRate * duration), audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);

  const noise = audio.createBufferSource();
  noise.buffer = buffer;
  const bandpass = audio.createBiquadFilter();
  bandpass.type = 'bandpass';
  bandpass.frequency.value = 2600;
  bandpass.Q.value = 1.4;
  const gainNode = audio.createGain();
  gainNode.gain.setValueAtTime(gain, t0);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

  noise.connect(bandpass);
  bandpass.connect(gainNode);
  gainNode.connect(audio.destination);
  noise.start(t0);

  // A bright high tone layered on top gives the noise burst a coin-like "ting" instead of a dull thud.
  tone(1760, start, 0.12, { type: 'sine', gain: 0.05 });
}

export const sfx = {
  /** Pressing "Grow the year". */
  grow: () => tone(440, 0, 0.12, { type: 'sine', gain: 0.08 }),
  /** A quietly positive year. */
  gain: () => arpeggioUp([523.25, 659.25], 0.08, 0.18),
  /** A down year - not a crash, just a dip. */
  loss: () => descend([392, 329.63], 0.09, 0.22),
  /** Reaching a new tree stage (Sapling / Tree / Forest). */
  stageUp: () => arpeggioUp([523.25, 659.25, 783.99, 1046.5], 0.09, 0.3),
  /** A new best score. */
  newBest: () => arpeggioUp([659.25, 783.99, 987.77, 1318.5], 0.08, 0.34),
  /** Going bankrupt. */
  bankrupt: () => descend([293.66, 246.94, 196.0, 146.83], 0.14, 0.5),
  /** Cashing out shares. */
  cashOut: () => arpeggioUp([784, 987.77], 0.07, 0.16),
  /** Generic UI click. */
  click: () => tone(600, 0, 0.06, { type: 'square', gain: 0.05 }),
  /** A coin tossed toward a bucket. */
  coinLaunch: () => sweep(520, 900, 0, 0.16),
  /** A coin landing in a bucket. */
  coinLand: () => clink(),
  /** Taking a coin back out of a bucket. */
  coinBack: () => sweep(700, 420, 0, 0.14, 0.05),
};
