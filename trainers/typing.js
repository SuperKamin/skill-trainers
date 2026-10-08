// Typing trainer. Built on typing-engine.js. Research: research/typing.md
// Modes:
//   test   — the classic test: common words, 15 / 30 / 60 s, speed (WPM) and accuracy.
//   pairs  — Weak pairs: real words packed with your slowest / most-missed letter pairs.
//   clean  — Clean run: words keep coming while you're right; the first wrong key ends it.
// Principles built into every mode: accuracy and fixes shown next to speed; PC and phone
// kept apart; compared only with your own usual; short sessions; real words only.
// Methods (tips you carry anywhere) rotate on screen.

import { createTyper, MIN_RUN_CHARS } from './typing-engine.js';
import { words, pairText } from './typing-words.js';
import { allRuns, weakKeys } from './typing-history.js';

const LENGTHS = [15, 30, 60];
const LS_LEN = 'skilltrainers.typing.len';
const PAIRS_SECONDS = 45;
const FALLBACK_PAIRS = ['th', 'er', 'in', 'ou'];

const TIPS = [
  'Eyes on the screen. If you peek at the keys, just notice it.',
  'Same finger for the same key, every time, even if it isn’t the “official” one.',
  'Hands stay put, fingers move.',
  'Slow down until mistakes almost stop, then speed up.',
  'Read the next word while you type this one.',
];
const PHONE_TIP = 'On the phone: two thumbs, and skip the suggestion bar.';

const readLen = () => { try { return Number(localStorage.getItem(LS_LEN)) || 30; } catch { return 30; } };
const saveLen = v => { try { localStorage.setItem(LS_LEN, String(v)); } catch { /* fine */ } };
const median = a => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };

/** Letter pairs (bigrams) over runs: { 'th': [n, mistakes, ms, timed] } summed. */
function sumPairs(runs) {
  const sum = {};
  for (const r of runs) for (const [k, v] of Object.entries(r.pairs || {})) {
    const s = sum[k] || (sum[k] = [0, 0, 0, 0]);
    for (let i = 0; i < 4; i++) s[i] += v[i] || 0;
  }
  return sum;
}
const pairMs = r => (r && r[3] ? r[2] / r[3] : null);

/** Your 4 costliest pairs: slow ones, made costlier by mistakes. Needs a few runs of data. */
function weakPairs(runs) {
  const sum = sumPairs(runs);
  const list = Object.entries(sum)
    .filter(([, s]) => s[0] >= 6 && s[3] >= 4)
    .map(([p, s]) => ({ p, cost: pairMs(s) * (1 + 3 * (s[1] / s[0])) }))
    .sort((a, b) => b.cost - a.cost)
    .slice(0, 4)
    .map(x => x.p);
  return list.length >= 3 ? list : null;
}

export default {
  id: 'typing',
  name: 'Typing',
  blurb: 'The classic test: common words, as fast and clean as you can.',
  modes: [
    { id: 'test', name: 'Test', blurb: 'Common words for 15, 30 or 60 seconds.' },
    { id: 'pairs', name: 'Weak pairs', blurb: 'Real words full of the letter pairs that slow you down.' },
    { id: 'clean', name: 'Clean run', blurb: 'Words keep coming while you’re right. One slip ends it.' },
  ],

  mount(el, onResult, ctx = {}) {
    const mode = ctx.mode || 'test';
    const setStatus = ctx.setStatus || (() => {});
    const device = ctx.device || 'pc';
    const past = allRuns(ctx.sessions || []).filter(r => r.device === device);
    const done = []; // runs from this visit
    let len = LENGTHS.includes(readLen()) ? readLen() : 30;
    let focusPairs = null, usingFallback = false;
    let tipIndex = Math.floor(Math.random() * TIPS.length);

    el.innerHTML = `
      <div class="ty">
        <div class="ty-bar">
          <div class="ty-lens" data-lens></div>
          <div class="ty-live"><b data-left></b><span data-wpm></span></div>
        </div>
        <div class="ty-stage" data-stage></div>
        <p class="ty-hint" data-hint></p>
        <div class="ty-result" data-result hidden></div>
        <p class="ty-tip" data-tip></p>
      </div>`;

    const $ = s => el.querySelector(s);
    const lens = $('[data-lens]'), left = $('[data-left]'), live = $('[data-wpm]');
    const hint = $('[data-hint]'), result = $('[data-result]'), stage = $('[data-stage]'), tipEl = $('[data-tip]');

    const typer = createTyper(stage, {
      get seconds() { return mode === 'test' ? len : mode === 'pairs' ? PAIRS_SECONDS : null; },
      get more() { return mode === 'pairs' ? null : () => ' ' + words(40); },
      stopOnError: mode === 'clean',
      onStart() { hint.hidden = true; lens.classList.add('dim'); },
      onTick({ left: l, wpm, chars }) {
        left.textContent = l != null ? Math.ceil(l) : '';
        live.textContent = mode === 'clean' ? `${Math.round(wpm)} wpm · ${chars} clean` : ` · ${Math.round(wpm)} wpm`;
      },
      onDone(run) {
        lens.classList.remove('dim');
        left.textContent = ''; live.textContent = '';
        const enough = run.chars >= MIN_RUN_CHARS || (mode === 'clean' && run.chars > 0);
        if (enough) {
          const rec = { m: mode, at: Date.now(), ...run };
          if (mode === 'test') rec.len = len;
          if (mode === 'pairs') { rec.len = PAIRS_SECONDS; rec.focus = focusPairs; }
          if (mode === 'clean') rec.words = cleanWords(run);
          done.push(rec);
          onResult({ run: rec });
          setStatus(`${done.length} ${done.length === 1 ? 'run' : 'runs'}`);
        }
        showResult(run, enough);
      },
    });

    // ---------- what each mode shows before you start ----------
    function startHint() {
      if (mode === 'test') return 'Tap the words (or just start typing). The clock starts on your first key.';
      if (mode === 'clean') return 'Type as cleanly as you can. Words keep coming until the first wrong key.';
      return usingFallback
        ? `Not enough of your typing yet to know your pairs, so these are common ones: ${focusPairs.join(' · ')}. After a few tests it uses yours.`
        : `Your slowest pairs right now: ${focusPairs.join(' · ')}. They're marked in the words. ${PAIRS_SECONDS} seconds.`;
    }

    function drawLens() {
      if (mode !== 'test') { lens.innerHTML = mode === 'pairs' && focusPairs ? focusPairs.map(p => `<kbd>${p}</kbd>`).join(' ') : ''; return; }
      lens.innerHTML = LENGTHS.map(s => `<button type="button" class="chip${s === len ? ' on' : ''}" data-len="${s}">${s} s</button>`).join('');
    }

    function nextTip() {
      const tips = device === 'phone' ? [...TIPS, PHONE_TIP] : TIPS;
      tipIndex = (tipIndex + 1) % tips.length;
      tipEl.textContent = 'Tip: ' + tips[tipIndex];
    }

    function fresh() {
      result.hidden = true;
      stage.hidden = false;
      if (mode === 'pairs') {
        const mine = weakPairs([...past, ...done].slice(-30));
        usingFallback = !mine;
        focusPairs = mine || FALLBACK_PAIRS;
        const { text, marks } = pairText(focusPairs);
        typer.reset(text, marks);
      } else {
        typer.reset(words(60));
      }
      drawLens();
      hint.textContent = startHint();
      hint.hidden = false;
      left.textContent = mode === 'test' ? len : mode === 'pairs' ? PAIRS_SECONDS : '';
      nextTip();
      typer.focus();
    }

    // ---------- result screens ----------
    function usualLine(run) {
      // Compared only with your own usual on this device (median of your last 10 like it).
      const same = [...past, ...done.slice(0, -1)].filter(r => (r.m || 'test') === mode && (mode !== 'test' || r.len === len)).slice(-10);
      if (same.length < 3) return '';
      if (mode === 'clean') {
        const u = median(same.map(r => r.words || 0));
        return `<p class="ty-usual">Your usual clean run: <b>${Math.round(u)} words</b>.</p>`;
      }
      const u = median(same.map(r => r.wpm));
      const d = Math.round(run.wpm - u);
      return `<p class="ty-usual">Your usual${mode === 'test' ? ` for ${len} s` : ''} on ${device === 'pc' ? 'PC' : 'phone'}: <b>${Math.round(u)} wpm</b>${d ? ` · this one ${d > 0 ? '+' : ''}${d}` : ' · right on it'}.</p>`;
    }

    function pairLine(run) {
      // How each drilled pair went this time vs before, in milliseconds.
      const before = sumPairs(past);
      const rows = focusPairs.map(p => {
        const now = pairMs(run.pairs[p]), was = pairMs(before[p]);
        if (now == null) return null;
        return `<span><kbd>${p}</kbd> ${was != null ? `${Math.round(was)} → ` : ''}<b>${Math.round(now)} ms</b></span>`;
      }).filter(Boolean);
      return rows.length ? `<div class="ty-pairs">${rows.join('')}</div><p class="fine">Time from the first letter of the pair to the second${Object.keys(before).length ? ', before → this drill' : ''}.</p>` : '';
    }

    function showResult(run, enough) {
      stage.hidden = true;
      hint.hidden = true;
      result.hidden = false;
      const stop = done.length === 5 ? '<p class="ty-usual">That’s 5 runs. Short sessions stick better, so stopping here is a good call.</p>' : '';
      if (!enough) {
        result.innerHTML = `<p class="ty-hint">That was too short to count.</p><button type="button" class="btn go" data-again>Again</button>`;
      } else if (mode === 'clean') {
        const w = cleanWords(run);
        result.innerHTML = `
          <div class="ty-score"><b>${w}</b><span>${w === 1 ? 'word' : 'words'} clean</span></div>
          <div class="ty-sub"><span><b>${Math.round(run.wpm)}</b> wpm while clean</span><span><b>${run.correct}</b> letters</span></div>
          ${usualLine(run)}${stop}
          <button type="button" class="btn go" data-again>Again</button>
          <p class="fine">Tab or Enter also starts again.</p>`;
      } else {
        result.innerHTML = `
          <div class="ty-score"><b>${Math.round(run.wpm)}</b><span>wpm</span></div>
          <div class="ty-sub">
            <span><b>${Math.round(run.acc * 100)}%</b> accuracy</span>
            <span><b>${run.fixes}</b> ${run.fixes === 1 ? 'fix' : 'fixes'}</span>
            <span><b>${Math.round(run.raw)}</b> raw</span>
          </div>
          ${mode === 'pairs' ? pairLine(run) : trickiest(run.keys)}
          ${usualLine(run)}${stop}
          <button type="button" class="btn go" data-again>Again</button>
          <p class="fine">Tab or Enter also starts again.</p>`;
      }
      result.querySelector('[data-again]').addEventListener('click', fresh);
    }

    lens.addEventListener('click', e => {
      const b = e.target.closest('[data-len]');
      if (!b || typer.running) return;
      len = Number(b.dataset.len); saveLen(len);
      fresh();
    });

    function onKey(e) {
      if (e.key === 'Tab' || (e.key === 'Enter' && !result.hidden)) { e.preventDefault(); fresh(); }
      else if (e.key === 'Escape') fresh();
    }
    document.addEventListener('keydown', onKey);

    setStatus('');
    fresh();

    return function unmount() {
      document.removeEventListener('keydown', onKey);
      typer.destroy();
      el.innerHTML = '';
    };
  },
};

/** Whole words typed before the slip in a Clean run. */
function cleanWords(run) {
  return run.wordsClean || 0;
}

/** The keys that cost the most this run: most mistakes, then slowest. */
function trickiest(keys) {
  const list = weakKeys([{ keys }], 2)
    .sort((a, b) => b.err - a.err || (b.ms || 0) - (a.ms || 0))
    .slice(0, 3)
    .filter(x => x.err > 0 || x.ms);
  if (!list.length) return '';
  return `<p class="ty-keys">Trickiest keys this run: ${list.map(x => `<kbd>${x.k}</kbd>`).join(' ')}</p>`;
}
