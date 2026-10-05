// Notes trainer: the sounds. Plain Web Audio, no files.
// Not pure sine tones (naming is less accurate with them, Miyazaki 1989): each voice has harmonics.
// "No crutch": the mystery note changes octave, sound and loudness, so the only thing
// that gives the answer away is how the note sits against C.

import { SEMI } from './notes-logic.js';

let ctx = null;
let master = null;
const waves = {};

/** Must be called from a tap (phones only allow sound after one). */
export function unlockAudio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.55;
    master.connect(ctx.destination);
    const wave = harmonics => {
      const real = new Float32Array(harmonics.length + 1);
      const imag = new Float32Array([0, ...harmonics]);
      return ctx.createPeriodicWave(real, imag);
    };
    waves.piano = wave([1, 0.55, 0.32, 0.2, 0.12, 0.07]);
    waves.organ = wave([1, 0.7, 0.45, 0.1, 0.25]);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return true;
}

export const now = () => (ctx ? ctx.currentTime : 0);

export const midiOf = (name, octave) => 12 * (octave + 1) + SEMI[name];
const freq = midi => 440 * 2 ** ((midi - 69) / 12);

export const TIMBRES = ['piano', 'organ', 'pluck'];

/**
 * Schedule one note. `at` is in AudioContext seconds; returns when it ends.
 * opts: { dur (s), timbre, db (loudness change in dB) }
 */
export function tone(midi, at, { dur = 1, timbre = 'piano', db = 0 } = {}) {
  if (!ctx) return at;
  const t = Math.max(at, ctx.currentTime + 0.01);
  const peak = 0.32 * 10 ** (db / 20);
  const osc = ctx.createOscillator();
  const env = ctx.createGain();
  osc.frequency.value = freq(midi);
  let out = env;

  if (timbre === 'pluck') {
    osc.type = 'triangle';
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(freq(midi) * 6, t);
    lp.frequency.exponentialRampToValueAtTime(freq(midi) * 1.5, t + dur);
    env.connect(lp);
    out = lp;
  } else {
    osc.setPeriodicWave(waves[timbre] || waves.piano);
  }

  env.gain.setValueAtTime(0.0001, t);
  env.gain.exponentialRampToValueAtTime(peak, t + 0.012);
  if (timbre === 'organ') {
    env.gain.setValueAtTime(peak * 0.8, t + dur * 0.6);
    env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  } else {
    env.gain.exponentialRampToValueAtTime(peak * 0.35, t + Math.min(0.35, dur * 0.4));
    env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  }

  osc.connect(env);
  out.connect(master);
  osc.start(t);
  osc.stop(t + dur + 0.05);
  return t + dur;
}

/** The reference: C–E–G–C around middle C, always the same sound and loudness. Returns end time. */
export function reference(at) {
  let t = Math.max(at, now() + 0.05);
  for (const m of [60, 64, 67, 72]) { tone(m, t, { dur: 0.38, timbre: 'piano' }); t += 0.36; }
  return t + 0.1;
}

export const pick = list => list[Math.floor(Math.random() * list.length)];

/** A mystery-note voice: random octave (weighted to the middle), sound and loudness. */
export function voice() {
  const r = Math.random();
  return {
    octave: r < 0.2 ? 3 : r < 0.8 ? 4 : 5,
    timbre: pick(TIMBRES),
    db: Math.random() * 6 - 3,
  };
}

/** Resolves after `seconds` of audio time (falls back to a timer). */
export const wait = seconds => new Promise(res => setTimeout(res, Math.max(0, seconds) * 1000));
export const until = t => wait(t - now());
