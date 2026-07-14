'use client';

/**
 * Money Tree — sound engine (pure Web Audio, no asset files)
 * ------------------------------------------------------------
 * Small synthesized sound cues via oscillators — no external audio files to
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

/** A short ascending arpeggio — used for wins, stage-ups, cashing out. */
function arpeggioUp(notes: number[], step = 0.09, duration = 0.22): void {
  notes.forEach((f, i) => tone(f, i * step, duration, { type: 'triangle' }));
}

/** A short descending tone pair — used for losses. */
function descend(notes: number[], step = 0.1, duration = 0.28): void {
  notes.forEach((f, i) => tone(f, i * step, duration, { type: 'sawtooth', gain: 0.09 }));
}

export const sfx = {
  /** Pressing "Grow the year". */
  grow: () => tone(440, 0, 0.12, { type: 'sine', gain: 0.08 }),
  /** A quietly positive year. */
  gain: () => arpeggioUp([523.25, 659.25], 0.08, 0.18),
  /** A down year — not a crash, just a dip. */
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
};
