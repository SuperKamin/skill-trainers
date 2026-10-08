// Typing trainer. Built on typing-engine.js. Research: research/typing.md
// Modes:
//   test   — the classic test: common words, 15 / 30 / 60 s, speed (WPM) and accuracy.
//   pairs  — Weak pairs: real words packed with your slowest / most-missed letter pairs.
//   clean  — Clean run: words keep coming while you're right; the first wrong key ends it.
//   learn  — Learn the keys: a keyboard under the words lights the next key in its finger's
//            colour; each key's light fades once you type it fast and right, and comes back
//            on a miss or a pause (research/fingers.md). Test and Clean run never show it.
// Principles built into every mode: accuracy and fixes shown next to speed; PC and phone
// kept apart; compared only with your own usual; short sessions; real words only.
// Methods (tips you carry anywhere) rotate on screen.

import { createTyper, MIN_RUN_CHARS } from './typing-engine.js';
import { words, pairText } from './typing-words.js';
import { allRuns, weakKeys, runChart } from './typing-history.js';
import { drawKeyboard, legendHtml, currentLayout, setLayout, detectLayout, codeFor, resetFingers, LAYOUTS } from './keyboard.js';

// Learn the keys: a key counts as learned after 3 fast, right presses in a row.
const LS_KNOWN = 'skilltrainers.kb.known';
const FAST_MS = 450, HESITATE_MS = 600, KNOWN_AFTER = 3;
const readKnown = () => { try { return JSON.parse(localStorage.getItem(LS_KNOWN)) || {}; } catch { return {}; } };
const saveKnown = k => { try { localStorage.setItem(LS_KNOWN, JSON.stringify(k)); } catch { /* fine */ } };

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
    { id: 'learn', name: 'Learn the keys', blurb: 'The next key lights up in its finger’s colour, and fades as you learn it.' },
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
    const onPhone = device === 'phone';
    let layout = currentLayout();
    let known = readKnown(), nextCode = null, hesitate = 0, kb = null;

    el.innerHTML = `
      <div class="ty">
        <div class="ty-bar">
          <div class="ty-lens" data-lens></div>
          <div class="ty-live"><b data-left></b><span data-wpm></span></div>
          ${onPhone ? '' : '<button type="button" class="ghost" data-kbbtn>Keyboard</button>'}
        </div>
        <div class="ty-stage" data-stage></div>
        <div class="ty-kb" data-kb hidden></div>
        <p class="ty-hint" data-hint></p>
        <div class="ty-result" data-result hidden></div>
        <p class="ty-tip" data-tip></p>
        <div class="kb-sheet" data-sheet hidden></div>
      </div>`;

    const $ = s => el.querySelector(s);
    const lens = $('[data-lens]'), left = $('[data-left]'), live = $('[data-wpm]');
    const hint = $('[data-hint]'), result = $('[data-result]'), stage = $('[data-stage]'), tipEl = $('[data-tip]');
    const kbBox = $('[data-kb]'), sheet = $('[data-sheet]');
    const showKb = !onPhone && (mode === 'pairs' || mode === 'learn');

    // ---------- the keyboard under the words (Weak pairs + Learn the keys) ----------
    function drawUnder() {
      if (!showKb) return;
      kbBox.hidden = false;
      kb = drawKeyboard(kbBox, { layout, small: true });
      if (mode === 'pairs' && focusPairs) kb.light(new Set(focusPairs.join('').split('').map(c => codeFor(layout, c)).filter(Boolean)));
      if (mode === 'learn') lightNext(false);
    }
    function lightNext(force) {
      if (!kb || mode !== 'learn') return;
      const learned = nextCode && (known[nextCode] || 0) >= KNOWN_AFTER;
      kb.light(nextCode && (force || !learned) ? new Set([nextCode]) : new Set());
    }

    const typer = createTyper(stage, {
      get seconds() { return mode === 'test' ? len : mode === 'pairs' ? PAIRS_SECONDS : mode === 'learn' ? 60 : null; },
      get more() { return mode === 'pairs' ? null : () => ' ' + words(40); },
      stopOnError: mode === 'clean',
      onCaret(ch) {
        if (mode !== 'learn') return;
        nextCode = ch == null ? null : codeFor(layout, ch);
        if (!kb) return;
        lightNext(false);
        // A pause brings the light back, even on a key you know.
        clearTimeout(hesitate);
        hesitate = setTimeout(() => lightNext(true), HESITATE_MS);
      },
      onKey({ want, ok, dt }) {
        if (mode !== 'learn') return;
        const code = codeFor(layout, want);
        if (!code || code === 'Space') return;
        known[code] = ok && dt != null && dt < FAST_MS ? (known[code] || 0) + 1 : ok ? (known[code] || 0) : 0;
        saveKnown(known);
      },
      onStart() { hint.hidden = true; lens.classList.add('dim'); setFocus(true); },
      onTick({ left: l, wpm, chars }) {
        left.textContent = l != null ? Math.ceil(l) : '';
        live.textContent = mode === 'clean' ? `${Math.round(wpm)} wpm · ${chars} clean` : ` · ${Math.round(wpm)} wpm`;
      },
      onDone(run) {
        lens.classList.remove('dim');
        setFocus(false);
        left.textContent = ''; live.textContent = '';
        const enough = run.chars >= MIN_RUN_CHARS || (mode === 'clean' && run.chars > 0);
        if (enough) {
          const rec = { m: mode, at: Date.now(), ...run };
          if (mode === 'test') rec.len = len;
          if (mode === 'pairs') { rec.len = PAIRS_SECONDS; rec.focus = focusPairs; }
          if (mode === 'learn') rec.len = 60;
          if (mode === 'clean') rec.words = cleanWords(run);
          done.push(rec);
          onResult({ run: rec });
          setStatus(`${done.length} ${done.length === 1 ? 'run' : 'runs'}`);
        }
        showResult(run, enough);
      },
    });

    // ---------- focus mode: while typing, everything but the words and the counter fades ----------
    function setFocus(on) { document.body.classList.toggle('ty-focus', on); }
    // Moving the mouse brings everything back; the next key hides it again.
    const onMouse = e => { if (e.movementX || e.movementY) setFocus(false); };
    document.addEventListener('mousemove', onMouse);

    // ---------- what each mode shows before you start ----------
    function startHint() {
      if (mode === 'test') return 'Tap the words (or just start typing). The clock starts on your first key.';
      if (mode === 'clean') return 'Type as cleanly as you can. Words keep coming until the first wrong key.';
      if (mode === 'learn') return onPhone
        ? 'The finger keyboard is for a real keyboard. On the phone this is a normal 60-second round.'
        : 'The next key lights up in the colour of its finger. Once you know a key, its light fades. 60 seconds.';
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
      setFocus(false);
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
      drawUnder();
      hint.textContent = startHint();
      hint.hidden = false;
      left.textContent = mode === 'test' ? len : mode === 'pairs' ? PAIRS_SECONDS : '';
      nextTip();
      typer.focus();
    }

    // ---------- result screens ----------
    const devName = device === 'pc' ? 'PC' : 'phone';

    /** Personal best: only ever adds. Test = best wpm per length; Clean run = most clean words. Same device only. */
    function bestLine(run) {
      if (mode !== 'test' && mode !== 'clean') return '';
      const before = [...past, ...done.slice(0, -1)].filter(r => (r.m || 'test') === mode && (mode !== 'test' || r.len === len));
      if (mode === 'clean') {
        const w = cleanWords(run);
        if (!before.length) return w ? `<p class="ty-pb first">Your first clean run on ${devName}: ${w} to beat next time.</p>` : '';
        const was = Math.max(...before.map(r => r.words || 0));
        return w > was ? `<p class="ty-pb">New best clean run 🎉 <small>(was ${was})</small></p>` : '';
      }
      if (!before.length) return `<p class="ty-pb first">Your first ${len} s test on ${devName}: this is the one to beat.</p>`;
      const was = Math.max(...before.map(r => r.wpm));
      return run.wpm > was ? `<p class="ty-pb">New best for ${len} s 🎉 <small>(was ${Math.round(was)})</small></p>` : '';
    }

    /** Speed graph + letter breakdown (runs from before stage 2 have neither). */
    function runBlock(run) {
      const ch = run.ch;
      return `
        ${run.sec && run.sec.wpm && run.sec.wpm.length >= 2 ? `<div class="ty-run"><div class="chart" data-runchart role="img" aria-label="Speed each second of this run"></div>
          <div class="chart-key"><span><i></i>wpm</span><span><i class="r"></i>raw</span>${run.sec.err.some(Boolean) ? '<span><i class="e">×</i>mistakes</span>' : ''}</div></div>` : ''}
        ${ch ? `<p class="ty-ch"><span><b>${ch.ok}</b> right</span><span class="bad"><b>${ch.bad}</b> wrong</span><span class="x"><b>${ch.x}</b> extra</span><span><b>${ch.miss}</b> missed</span></p>` : ''}`;
    }
    const consSpan = run => (run.cons != null ? `<span><b>${run.cons}%</b> consistency</span>` : '');

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
      clearTimeout(hesitate);
      kbBox.hidden = true;
      stage.hidden = true;
      hint.hidden = true;
      result.hidden = false;
      const stop = done.length === 5 ? '<p class="ty-usual">That’s 5 runs. Short sessions stick better, so stopping here is a good call.</p>' : '';
      if (!enough) {
        result.innerHTML = `<p class="ty-hint">That was too short to count.</p><button type="button" class="btn go" data-again>Again</button>`;
      } else if (mode === 'learn') {
        const n = Object.values(known).filter(v => v >= KNOWN_AFTER).length;
        result.innerHTML = `
          <div class="ty-score"><b>${Math.round(run.wpm)}</b><span>wpm</span></div>
          <div class="ty-sub"><span><b>${Math.round(run.acc * 100)}%</b> accuracy</span>${consSpan(run)}<span><b>${n}</b> keys learned</span></div>
          ${runBlock(run)}
          <p class="ty-usual">A key counts as learned after ${KNOWN_AFTER} fast, right presses in a row. A miss lights it up again.</p>
          ${stop}
          <button type="button" class="btn go" data-again>Again</button>
          <p class="fine">Tab or Enter also starts again.</p>`;
      } else if (mode === 'clean') {
        const w = cleanWords(run);
        result.innerHTML = `
          <div class="ty-score"><b>${w}</b><span>${w === 1 ? 'word' : 'words'} clean</span></div>
          <div class="ty-sub"><span><b>${Math.round(run.wpm)}</b> wpm while clean</span><span><b>${run.correct}</b> letters</span></div>
          ${bestLine(run)}
          ${runBlock(run)}
          ${usualLine(run)}${stop}
          <button type="button" class="btn go" data-again>Again</button>
          <p class="fine">Tab or Enter also starts again.</p>`;
      } else {
        result.innerHTML = `
          <div class="ty-score"><b>${Math.round(run.wpm)}</b><span>wpm</span></div>
          <div class="ty-sub">
            <span><b>${Math.round(run.acc * 100)}%</b> accuracy</span>
            ${consSpan(run)}
            <span><b>${Math.round(run.raw)}</b> raw</span>
            <span><b>${run.fixes}</b> ${run.fixes === 1 ? 'fix' : 'fixes'}</span>
          </div>
          ${bestLine(run)}
          ${runBlock(run)}
          ${mode === 'pairs' ? pairLine(run) : trickiest(run.keys)}
          ${usualLine(run)}${stop}
          <button type="button" class="btn go" data-again>Again</button>
          <p class="fine">Tab or Enter also starts again.</p>`;
      }
      result.querySelector('[data-again]').addEventListener('click', fresh);
      const rc = result.querySelector('[data-runchart]');
      if (rc) rc.innerHTML = runChart(run, Math.round(rc.clientWidth) || 340);
    }

    lens.addEventListener('click', e => {
      const b = e.target.closest('[data-len]');
      if (!b || typer.running) return;
      len = Number(b.dataset.len); saveLen(len);
      fresh();
    });

    // ---------- the full chart, one tap away ----------
    function openSheet() {
      sheet.hidden = false;
      sheet.innerHTML = `
        <div class="kb-panel" role="dialog" aria-label="Finger chart">
          <div class="kb-head">
            <h2>Which finger for each key</h2>
            <button type="button" class="ghost" data-close>Close</button>
          </div>
          <label class="kb-pick">Keyboard
            <select id="kb-layout">${Object.entries(LAYOUTS).map(([id, L]) => `<option value="${id}"${id === layout ? ' selected' : ''}>${L.name}</option>`).join('')}</select>
          </label>
          <div data-chart></div>
          ${legendHtml()}
          <p class="fine">These are the usual fingers. What matters most is using the <b>same</b> finger for a key every time, whichever one it is. Tap a key to change it to the finger you actually use (a dot marks your changes).</p>
          <button type="button" class="ghost" data-reset>Back to the usual fingers</button>
        </div>`;
      const chart = sheet.querySelector('[data-chart]');
      const draw = () => drawKeyboard(chart, { layout, editable: true, onChange: () => drawUnder() });
      draw();
      sheet.querySelector('#kb-layout').addEventListener('change', e => { layout = e.target.value; setLayout(layout); draw(); drawUnder(); });
      sheet.querySelector('[data-reset]').addEventListener('click', () => { resetFingers(); draw(); drawUnder(); });
      sheet.querySelector('[data-close]').addEventListener('click', closeSheet);
      sheet.addEventListener('click', e => { if (e.target === sheet) closeSheet(); });
    }
    function closeSheet() { sheet.hidden = true; sheet.innerHTML = ''; typer.focus(); }
    const kbBtn = $('[data-kbbtn]');
    if (kbBtn) kbBtn.addEventListener('click', () => { if (!typer.running) openSheet(); });

    // First time: ask the browser which keyboard is plugged in (Chrome/Edge only).
    if (!onPhone) {
      let saved = null; try { saved = localStorage.getItem('skilltrainers.kb.layout'); } catch { /* fine */ }
      if (!saved) detectLayout().then(id => { if (id && id !== layout) { layout = id; drawUnder(); } });
    }

    function onKey(e) {
      if (!sheet.hidden) { if (e.key === 'Escape') closeSheet(); return; }
      if (typer.running && e.key !== 'Escape' && e.key !== 'Tab') setFocus(true);
      if (e.key === 'Tab' || (e.key === 'Enter' && !result.hidden)) { e.preventDefault(); fresh(); }
      else if (e.key === 'Escape') fresh();
    }
    document.addEventListener('keydown', onKey);

    setStatus('');
    fresh();

    return function unmount() {
      clearTimeout(hesitate);
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousemove', onMouse);
      setFocus(false);
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
