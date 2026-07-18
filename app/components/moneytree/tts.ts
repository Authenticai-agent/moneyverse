'use client';

/**
 * Read-aloud (text-to-speech) for the game's learning moments, using the
 * browser's built-in SpeechSynthesis - no dependencies, no network.
 *
 * Design goals from playtesting:
 *  - Kid-friendly voices only: novelty / robotic system voices (Zarvox, Albert,
 *    Bells...) are filtered out and natural ones (Samantha, Google, Karen...)
 *    are preferred, so the "narrator" never sounds robotic.
 *  - A distinct voice + tone PER COACH so Sage, Bit, Robin and Nova each sound
 *    like themselves, plus a separate warm narrator for the game's own story.
 *  - Reliable playback EVERY time: Chrome silently wedges speechSynthesis after
 *    a cancel(), so we resume() + re-speak on a short delay and keep a resume()
 *    heartbeat alive (Chrome also pauses long utterances after ~15s).
 */

import type { MascotId } from '@/app/lib/moneytree/types';

/** Who is speaking - the game narrator, or one of the four coaches. */
export type Speaker = 'narrator' | MascotId;

// Silly / robotic system voices we never want for kids.
const BAD_VOICE =
  /albert|bad news|bahh|bells|boing|bubbles|cellos|deranged|good news|jester|organ|superstar|trinoids|whisper|wobble|zarvox|flo|grandma|grandpa|reed|rocko|sandy|shelley|eddy|junior|ralph|kathy|princess|fred/i;

// Natural, friendly voices to prefer when the device has them (best first).
const PREFERRED = [
  'samantha',
  'karen',
  'moira',
  'tessa',
  'nicky',
  'daniel',
  'aaron',
  'arthur',
  'serena',
  'fiona',
  'catherine',
  'gordon',
  'rishi',
  'google us english',
];

const SPEAKERS: Speaker[] = ['narrator', 'wizard', 'robot', 'adventurer', 'hero'];

/**
 * Per-speaker voice, mixing male and female across the coaches and kept
 * consistent (each coach always the same voice). We name real, natural voices
 * in preference order and take the first the device actually has; if none
 * match, a stable fallback slot still keeps each speaker distinct. Pitch/rate
 * stay near 1.0 - the old settings (e.g. pitch 1.3) sounded robotic/chipmunky.
 */
const VOICE_PREFS: Record<
  Speaker,
  {
    names: string[];
    pitch: number;
    rate: number;
    /** Extra pitch for sentences ending in "?" - the engine can't do a pitch
     * contour inside one utterance, so question sentences are spoken as their
     * own, higher-pitched utterance to get that rising "asking" sound. */
    questionLift?: number;
  }
> = {
  narrator: { names: ['Nicky', 'Tessa', 'Catherine', 'Martha', 'Samantha'], pitch: 1.06, rate: 1.06 }, // bright, lively storyteller
  wizard: { names: ['Daniel', 'Arthur', 'Gordon', 'Alex', 'Rishi'], pitch: 1.0, rate: 1.0 }, // Sage - warm male, no longer sluggish
  robot: { names: ['Karen', 'Moira', 'Tessa', 'Catherine'], pitch: 1.1, rate: 1.08 }, // Bit - chipper female
  adventurer: { names: ['Aaron', 'Rishi', 'Arthur', 'Alex', 'Gordon'], pitch: 1.06, rate: 1.08 }, // Robin - energetic male
  hero: { names: ['Moira', 'Nicky', 'Tessa', 'Martha', 'Samantha'], pitch: 1.04, rate: 1.02, questionLift: 0.18 }, // Nova - gentle, lifts her voice on questions
};

let voices: SpeechSynthesisVoice[] = [];

function supported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

function refreshVoices() {
  if (!supported()) return;
  const v = window.speechSynthesis.getVoices();
  if (v.length) voices = v;
}

if (supported()) {
  refreshVoices();
  window.speechSynthesis.addEventListener?.('voiceschanged', refreshVoices);
}

/** English voices, novelty ones removed, ranked so RELIABLE voices come first.
 * On machines with hundreds of voices, most are remote "Google ..." cloud
 * voices that silently fail if the network TTS doesn't answer - so local
 * (offline) voices are ranked strictly ahead of remote ones, then by the
 * natural-voice preference list. */
function goodVoices(): SpeechSynthesisVoice[] {
  if (!voices.length) refreshVoices();
  const en = voices.filter((v) => v.lang && v.lang.toLowerCase().startsWith('en') && !BAD_VOICE.test(v.name));
  const pool = en.length ? en : voices;
  const rank = (v: SpeechSynthesisVoice) => {
    const local = v.localService ? 0 : 1000; // local voices win, always
    const i = PREFERRED.findIndex((p) => v.name.toLowerCase().includes(p));
    return local + (i === -1 ? 100 : i);
  };
  return pool.slice().sort((a, b) => rank(a) - rank(b));
}

/** The consistent voice for a speaker: the first of its named preferences the
 * device has, else a stable fallback slot so speakers still differ. */
function voiceFor(speaker: Speaker): SpeechSynthesisVoice | null {
  const pool = goodVoices();
  if (!pool.length) return null;
  for (const name of VOICE_PREFS[speaker].names) {
    const v = pool.find((x) => x.name.toLowerCase().includes(name.toLowerCase()));
    if (v) return v;
  }
  const slot = Math.max(0, SPEAKERS.indexOf(speaker));
  return pool[slot % pool.length];
}

function utter(text: string, speaker: Speaker, pitchOverride?: number, volume?: number): SpeechSynthesisUtterance {
  const u = new SpeechSynthesisUtterance(text);
  const pref = VOICE_PREFS[speaker];
  const v = voiceFor(speaker);
  if (v) {
    u.voice = v;
    u.lang = v.lang;
  }
  u.pitch = Math.min(2, pitchOverride ?? pref.pitch);
  u.rate = pref.rate;
  u.volume = volume ?? 1; // 0 = the silent filler used for pauses
  return u;
}

/** One utterance's worth of speech (a part may expand into several). */
type Step = { text: string; speaker: Speaker; pauseAfter?: number; pitch?: number; volume?: number };

/** Words-per-pause calibration: the silent filler is sized in words to
 * approximate the requested milliseconds. Measured in-browser - three filler
 * words took 1329ms end-to-end, i.e. ~443ms per word - so a 1000ms request
 * becomes two words (~890ms), landing just under a second. */
const MS_PER_FILLER_WORD = 443;

/**
 * Trailing commas that make a voice pause at the END of a line, roughly a
 * quarter-second each. This is appended to the line's own text on purpose: a
 * separate punctuation-only "silence" utterance reads as EMPTY to Chrome, which
 * then never finishes it and jams the whole queue behind it - that's what made
 * everything after the first passage go silent.
 */
/**
 * Expand a step's `pauseAfter` into real silence.
 *
 * Getting a pause out of the Web Speech API is genuinely awkward - everything
 * obvious fails:
 *  - trailing punctuation on a passage is TRIMMED (no pause at all);
 *  - merging passages into one utterance removes the boundary entirely;
 *  - a punctuation-only "silence" utterance is READ ALOUD as the word "comma";
 *  - a setTimeout gap loses the click's user-activation, so Chrome refuses to
 *    start the next utterance (and the engine can wedge while idle).
 *
 *  - [[slnc N]], Apple's inline silence command, is READ ALOUD ("slnc three
 *    thousand") by the voices Chrome exposes. The +2195ms it added to a test
 *    sentence was the time spent SAYING the token, not silence.
 *
 * What's left is a filler utterance at volume 0: inaudible by construction,
 * but it still takes real time to utter, and that time is the beat. Its length
 * is set by word count rather than any engine-specific syntax, so there is no
 * token that can leak into the audio on any platform.
 */
function toPauseSteps(s: Step): Step[] {
  if (!s.pauseAfter || s.pauseAfter <= 0) return [s];
  const { pauseAfter, ...rest } = s;
  const words = Math.max(1, Math.round(pauseAfter / MS_PER_FILLER_WORD));
  return [
    rest,
    {
      text: new Array(words).fill('pause').join(' '),
      speaker: s.speaker,
      pitch: s.pitch,
      volume: 0, // inaudible, but still takes time to utter - that IS the beat
    },
  ];
}

/**
 * Split a line into per-sentence steps when its speaker lifts questions, so
 * sentences ending in "?" get spoken at a higher pitch and actually sound like
 * questions. Lines without a "?" (or speakers without a lift) stay a single
 * utterance, so nothing else gets chopped up.
 */
function toSteps(p: { text: string; speaker: Speaker; pauseAfter?: number }): Step[] {
  const pref = VOICE_PREFS[p.speaker];
  if (!pref.questionLift || !p.text.includes('?')) return [p];
  const sentences = (p.text.match(/[^.!?]+[.!?]+|\S[^.!?]*$/g) ?? [p.text]).map((s) => s.trim()).filter(Boolean);
  return sentences.map((s, i) => ({
    text: s,
    speaker: p.speaker,
    pitch: s.endsWith('?') ? pref.pitch + pref.questionLift! : pref.pitch,
    // keep any requested pause on the final sentence only
    pauseAfter: i === sentences.length - 1 ? p.pauseAfter : undefined,
  }));
}

export function ttsSupported(): boolean {
  return supported();
}

// Every speakSequence run gets a token; starting a new run or stopping bumps
// it, so a stale/cancelled run's onend/onerror can't keep chaining (which was
// making the coach line read twice, or not at all, under React's dev double
// render + a teardown cancel).
let seqToken = 0;

// Chrome pauses long speech after ~15s; a periodic resume() keeps it going.
let heartbeat: ReturnType<typeof setInterval> | undefined;
function startHeartbeat() {
  stopHeartbeat();
  heartbeat = setInterval(() => {
    if (!supported()) return;
    const synth = window.speechSynthesis;
    // Chrome cuts speech off after ~15s; a pause/resume tick resets that timer.
    if (synth.speaking) {
      synth.pause();
      synth.resume();
    }
  }, 8000);
}
function stopHeartbeat() {
  if (heartbeat) {
    clearInterval(heartbeat);
    heartbeat = undefined;
  }
}

export function stopSpeaking() {
  if (!supported()) return;
  seqToken++; // invalidate any in-flight sequence so it stops chaining
  stopHeartbeat();
  const synth = window.speechSynthesis;
  // Only cancel when something is actually going - an unconditional cancel()
  // is what wedges Chrome/macOS into silence for every later utterance.
  if (synth.speaking || synth.pending) synth.cancel();
}

/**
 * Speaks the parts one after another, each in its own voice, calling onDone
 * when the last finishes.
 *
 * Every utterance is queued SYNCHRONOUSLY in one burst, inside whatever user
 * gesture triggered the read, and Chrome's own queue plays them in order. This
 * matters: speech started from a later callback (an onend handler, or a
 * setTimeout) is outside the gesture's activation window, and Chrome silently
 * refuses it - which is why only the very first line was ever audible while
 * every line after it produced nothing.
 *
 * `pauseAfter` (ms) becomes a queued silence utterance (see toPauseSteps), not
 * a timer, so the gap costs us neither the gesture nor an idle engine.
 */
export function speakSequence(parts: { text: string; speaker: Speaker; pauseAfter?: number }[], onDone?: () => void) {
  if (!supported()) {
    onDone?.();
    return;
  }
  const synth = window.speechSynthesis;
  // Drop caller-supplied lines with no actual words, THEN expand pauses - the
  // silence utterances are punctuation-only by design and must survive this.
  const clean = parts
    .filter((p) => /[a-z0-9]/i.test(p.text ?? ''))
    .flatMap(toSteps)
    .flatMap(toPauseSteps);
  if (!clean.length) {
    onDone?.();
    return;
  }
  // Interrupt anything already playing (conditional - an unconditional cancel()
  // is what wedges Chrome/macOS into global silence).
  if (synth.speaking || synth.pending) synth.cancel();
  synth.resume();
  startHeartbeat();

  const my = ++seqToken; // this run owns the queue now

  // Queue every line in one synchronous burst so they all inherit the current
  // user activation. Chrome then plays them back-to-back on its own; nothing
  // depends on a later callback being allowed to start speech.
  clean.forEach((p, idx) => {
    const u = utter(p.text, p.speaker, p.pitch, p.volume);
    if (idx === clean.length - 1) {
      const finish = () => {
        if (my !== seqToken) return; // superseded or stopped
        stopHeartbeat();
        onDone?.();
      };
      u.onend = finish;
      u.onerror = finish;
    }
    synth.speak(u);
  });
  // Chrome/macOS sometimes queues but doesn't start until a resume() nudge.
  synth.resume();
}
