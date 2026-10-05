// Notes trainer — hear a note against C and name it (relative pitch).
// Three modes (Leo's picks, 04/10):
//   test   — "Where am I": practice that also measures; notes unlock as you get them.
//   twin   — your most mixed-up neighbour pair, back and forth.
//   listen — notes with their names, nothing to answer.
// Built into every mode (a principle, not a mode): "no crutch" — octave, sound and
// loudness of the mystery note change, so only the note's place against C gives it away.
// Research: research/notes.md

import { NAMES, PAIRS, progress, worstPair } from './notes-logic.js';
import { unlockAudio, now, midiOf, tone, reference, voice, pick, until, wait } from './notes-audio.js';

const TIP = 'Tip: hum the note, then sing down to C before you answer.';

export default {
  id: 'notes',
  name: 'Notes',
  blurb: 'Hear C, then a mystery note. Name it.',
  modes: [
    { id: 'test', name: 'Test', blurb: 'Name the note. New notes unlock as you get them.' },
    { id: 'twin', name: 'Twin notes', blurb: 'Your two most mixed-up notes, back and forth.' },
    { id: 'listen', name: 'Listen', blurb: 'Notes with their names. Nothing to answer.' },
  ],
  tip: TIP,

  mount(el, onResult, ctx = {}) {
    const mode = ctx.mode || 'test';
    const setStatus = ctx.setStatus || (() => {});
    const past = ctx.sessions || [];
    let alive = true;

    el.innerHTML = `
      <div class="nt">
        <div class="nt-show">
          <div class="nt-big" data-big>♪</div>
          <div class="nt-hint" data-hint></div>
        </div>
        <div class="nt-keys" data-keys></div>
        <div class="nt-foot">
          <button type="button" class="ghost" data-again hidden>Play again</button>
          <span class="nt-tip">${TIP}</span>
        </div>
        <button type="button" class="nt-start" data-start>
          <b>Tap to start</b>
          <span data-start-sub></span>
        </button>
      </div>`;

    const $ = s => el.querySelector(s);
    const big = $('[data-big]'), hint = $('[data-hint]'), keys = $('[data-keys]');
    const again = $('[data-again]'), start = $('[data-start]');
    const say = (b, h = '') => { big.textContent = b; hint.textContent = h; };

    // ---------- shared answer machinery ----------
    let resolveAnswer = null;   // set while waiting for a tap
    let onsetMs = 0;            // performance.now() when the mystery note starts
    let lastPlay = null;        // { name, v } for "Play again"
    let right = 0, total = 0;

    function drawKeys(names, enabled) {
      keys.className = 'nt-keys' + (names.length === 2 ? ' twin' : '');
      keys.innerHTML = names.map(n => {
        const on = enabled.includes(n);
        return `<button type="button" class="nt-key" data-n="${n}" ${on ? '' : 'disabled aria-label="' + n + ' (locked)"'}>${n}</button>`;
      }).join('');
    }
    keys.addEventListener('pointerdown', e => {
      const b = e.target.closest('.nt-key');
      if (!b || b.disabled || !resolveAnswer) return;
      e.preventDefault();
      const r = resolveAnswer; resolveAnswer = null;
      r(b.dataset.n);
    });
    function onKey(e) {
      const n = (e.key || '').toUpperCase();
      if (!resolveAnswer || !NAMES.includes(n)) return;
      const b = keys.querySelector(`[data-n="${n}"]`);
      if (!b || b.disabled) return;
      const r = resolveAnswer; resolveAnswer = null;
      r(n);
    }
    document.addEventListener('keydown', onKey);

    function mark(n, cls) {
      const b = keys.querySelector(`[data-n="${n}"]`);
      if (b) { b.classList.add(cls); setTimeout(() => b.classList.remove(cls), 900); }
    }

    /** Play the mystery note and wait for a tap. Resolves to the answer record. */
    async function ask(name, { distract = [] } = {}) {
      let t = now() + 0.05;
      if (distract.length && Math.random() < 0.33) {
        // An extra note between reference and mystery note, so the reference can't just be held in the head.
        tone(midiOf(pick(distract.filter(n => n !== name)), 4), t, { dur: 0.4, timbre: 'piano' });
        t += 0.75;
      }
      const v = voice();
      lastPlay = { name, v };
      tone(midiOf(name, v.octave), t, { dur: 1.1, timbre: v.timbre, db: v.db });
      onsetMs = performance.now() + (t - now()) * 1000;
      again.hidden = false;
      const answer = await new Promise(res => { resolveAnswer = res; });
      const ms = Math.max(0, Math.round(performance.now() - onsetMs));
      return { t: name, a: answer, ok: answer === name, ms, o: v.octave, tb: v.timbre };
    }

    /** Hear it back: right → the note again; wrong → your pick, then the real one. */
    async function feedback(rec) {
      total += 1;
      if (rec.ok) right += 1;
      setStatus(`${right} of ${total} right`);
      const o = rec.o;
      let t = now() + 0.05;
      if (rec.ok) {
        mark(rec.a, 'yes');
        say(rec.t, 'That one.');
        t = tone(midiOf(rec.t, o), t, { dur: 0.6 });
        await until(t + 0.35);
      } else {
        mark(rec.a, 'no'); mark(rec.t, 'yes');
        say(rec.t, `You picked ${rec.a}. Listen to both: ${rec.a}, then ${rec.t}.`);
        t = tone(midiOf(rec.a, o), t, { dur: 0.6 });
        t = tone(midiOf(rec.t, o), t + 0.15, { dur: 0.8 });
        await until(t + 0.6);
      }
    }

    again.addEventListener('click', () => {
      if (!lastPlay || !resolveAnswer) return;
      let t = reference(now() + 0.05);
      tone(midiOf(lastPlay.name, lastPlay.v.octave), t + 0.25, { dur: 1.1, timbre: lastPlay.v.timbre, db: lastPlay.v.db });
    });

    async function playReference(text = 'This is C.') {
      say('C', text);
      const t = reference(now() + 0.05);
      await until(t + 0.35);
    }

    // ---------- modes ----------
    async function runTest() {
      const mine = [];
      const prog = () => progress([...past, { mode: 'test', startedAt: Date.now(), answers: mine }]);
      let p = prog();
      let since = 99, missed = false;
      drawKeys(NAMES, p.unlocked);
      while (alive) {
        if (since >= 3 || missed) { await playReference(); since = 0; missed = false; }
        if (!alive) return;
        say('?', 'Which note?');
        const rec = await ask(pick(p.unlocked), { distract: p.unlocked.length >= 5 ? NAMES : [] });
        if (!alive) return;
        mine.push(rec);
        onResult({ answer: rec });
        await feedback(rec);
        since += 1; missed = !rec.ok;
        const before = p.count;
        p = prog();
        if (alive && p.count > before) await welcome(p.unlocked[p.unlocked.length - 1], p.unlocked);
      }
    }

    async function welcome(n, unlocked) {
      drawKeys(NAMES, unlocked);
      say(n, `New note: ${n}. Here it is against C, twice.`);
      await wait(0.8);
      let t = reference(now() + 0.05);
      t = tone(midiOf(n, 4), t + 0.2, { dur: 1 });
      t = tone(midiOf(n, 4), t + 0.3, { dur: 1 });
      await until(t + 0.5);
    }

    async function runTwin() {
      const p = progress(past);
      let pair = worstPair(past, p.unlocked);
      // Pair chooser above the keys
      const chooser = document.createElement('div');
      chooser.className = 'nt-pairs';
      const drawChooser = () => {
        chooser.innerHTML = PAIRS.map(([x, y]) =>
          `<button type="button" class="chip${x === pair[0] && y === pair[1] ? ' on' : ''}" data-p="${x}${y}">${x}/${y}</button>`).join('');
      };
      drawChooser();
      keys.before(chooser);
      let changed = false;
      chooser.addEventListener('click', e => {
        const b = e.target.closest('[data-p]');
        if (!b) return;
        pair = [b.dataset.p[0], b.dataset.p[1]];
        changed = true;
        drawChooser();
        drawKeys(pair, pair);
      });

      drawKeys(pair, pair);
      let since = 99, missed = false;
      while (alive) {
        if (since >= 5 || missed || changed) {
          await playReference(`This is C. Now: ${pair[0]} or ${pair[1]}?`);
          since = 0; missed = false; changed = false;
        }
        if (!alive) return;
        say('?', `${pair[0]} or ${pair[1]}?`);
        const asked = pair.join('');
        const rec = await ask(pick(pair));
        if (!alive) return;
        if (changed || pair.join('') !== asked) continue; // pair switched mid-question: don't count it
        onResult({ answer: rec });
        await feedback(rec);
        since += 1; missed = !rec.ok;
      }
    }

    async function runListen() {
      keys.hidden = true;
      again.hidden = true;
      const p = progress(past);
      // What you know, plus the next note to come — so it's familiar before it's tested.
      const pool = p.next ? [...p.unlocked, p.next, p.next] : p.unlocked;
      while (alive) {
        for (let i = 0; i < 20 && alive; i++) {
          if (i % 5 === 0) await playReference();
          if (!alive) return;
          const n = pick(pool);
          const v = voice();
          say(n, n === p.next ? `${n} (the next one you'll unlock)` : '');
          const t = tone(midiOf(n, v.octave), now() + 0.05, { dur: 1.1, timbre: v.timbre, db: v.db });
          onResult({ heard: n });
          setStatus(`${i + 1} heard`);
          await until(t + 0.45);
        }
        if (!alive) return;
        say('✓', 'That was a round of 20. Tap to listen to another, or go back and try the test.');
        await new Promise(res => {
          start.hidden = false;
          start.querySelector('b').textContent = 'Another round';
          start.querySelector('[data-start-sub]').textContent = '';
          start.onclick = () => { start.hidden = true; res(); };
        });
      }
    }

    // ---------- start (sound needs a tap first) ----------
    const startText = {
      test: `You have ${progress(past).unlocked.join(' ')}. More unlock as you get them.`,
      twin: 'Two notes, back and forth.',
      listen: 'Just listen. Nothing to answer.',
    }[mode];
    start.querySelector('[data-start-sub]').textContent = startText;
    if (mode === 'test') drawKeys(NAMES, progress(past).unlocked);
    if (mode === 'listen') keys.hidden = true;
    setStatus(mode === 'listen' ? '' : '0 answered');
    say('♪', '');

    start.addEventListener('click', () => {
      if (!unlockAudio()) { say('—', 'This browser can’t play sound.'); return; }
      start.hidden = true;
      (mode === 'twin' ? runTwin() : mode === 'listen' ? runListen() : runTest())
        .catch(err => console.warn('notes:', err));
    }, { once: true });

    return function unmount() {
      alive = false;
      if (resolveAnswer) resolveAnswer(null);
      resolveAnswer = null;
      document.removeEventListener('keydown', onKey);
      el.innerHTML = '';
    };
  },
};

