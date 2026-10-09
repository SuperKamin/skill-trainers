// Typing: key sounds. Plain Web Audio, no files, made fresh for every key (so it's instant).
// Off by default. Each sound varies its pitch a little so it doesn't sound like a machine gun.
// Settings live on the device: skilltrainers.typing.sound = { kind, vol, wrong }.

const LS = 'skilltrainers.typing.sound';

export const SOUNDS = [
  ['off', 'Off'],
  ['click', 'Click'],
  ['thock', 'Thock'],
  ['typewriter', 'Typewriter'],
  ['beep', 'Soft beep'],
];

export function readSound() {
  let s = {};
  try { s = JSON.parse(localStorage.getItem(LS)) || {}; } catch { /* fine */ }
  return {
    kind: SOUNDS.some(([k]) => k === s.kind) ? s.kind : 'off',
    vol: typeof s.vol === 'number' ? Math.min(1, Math.max(0, s.vol)) : 0.6,
    wrong: s.wrong !== false,
  };
}
export function saveSound(s) { try { localStorage.setItem(LS, JSON.stringify(s)); } catch { /* fine */ } }

let ctx = null, out = null, noise = null;

/** Starts audio. Phones only allow it after a tap or key, so call it from one. */
export function unlockSound() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC({ latencyHint: 'interactive' });
    out = ctx.createGain();
    out.connect(ctx.destination);
    // 0.3 s of white noise, reused by every click.
    noise = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.3), ctx.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === 'suspended') ctx.resume();
  return true;
}

const vary = (v, amt = 0.06) => v * (1 + (Math.random() * 2 - 1) * amt);

/** A short burst of filtered noise. */
function burst(t, { type = 'bandpass', freq, q = 1, gain, dur }) {
  const src = ctx.createBufferSource();
  src.buffer = noise;
  src.playbackRate.value = vary(1, 0.1);
  const f = ctx.createBiquadFilter();
  f.type = type; f.frequency.value = vary(freq); f.Q.value = q;
  const g = ctx.createGain();
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(out);
  src.start(t, Math.random() * 0.2);
  src.stop(t + dur + 0.02);
}

/** A short tone that falls in pitch (from → to Hz). */
function tone(t, { wave = 'sine', from, to = from, gain, dur, attack = 0.002 }) {
  const o = ctx.createOscillator();
  o.type = wave;
  o.frequency.setValueAtTime(vary(from), t);
  o.frequency.exponentialRampToValueAtTime(Math.max(20, vary(to)), t + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(out);
  o.start(t);
  o.stop(t + dur + 0.02);
}

const KINDS = {
  click(t, space) {
    burst(t, { freq: space ? 1800 : 3200, q: 1.4, gain: space ? 0.5 : 0.42, dur: space ? 0.035 : 0.022 });
  },
  thock(t, space) {
    tone(t, { from: space ? 150 : 210, to: space ? 70 : 95, gain: 0.55, dur: space ? 0.09 : 0.065 });
    burst(t, { type: 'lowpass', freq: space ? 900 : 1300, q: 0.7, gain: 0.35, dur: 0.03 });
  },
  typewriter(t, space) {
    burst(t, { freq: space ? 900 : 1600, q: 2, gain: 0.55, dur: space ? 0.06 : 0.03 });
    if (!space) tone(t, { wave: 'triangle', from: 2400, to: 2300, gain: 0.05, dur: 0.05 });
  },
  beep(t, space) {
    tone(t, { from: space ? 520 : 660, gain: 0.18, dur: 0.06, attack: 0.006 });
  },
};

/** One key: { ok, space, back } — back = something was erased. */
export function playKey(s, { ok = true, space = false, back = false } = {}) {
  if (s.kind === 'off' || !s.vol || !unlockSound()) return;
  out.gain.value = s.vol;
  const t = ctx.currentTime;
  // A wrong key: a soft, low bump instead (if that's on). Never loud, never harsh.
  if (!ok && s.wrong) { tone(t, { wave: 'triangle', from: 140, to: 90, gain: 0.35, dur: 0.08 }); return; }
  KINDS[s.kind](t, space || back);
}
