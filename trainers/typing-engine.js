// Typing engine: shows a text, takes what you type (physical keyboard or phone keyboard),
// colours it right/wrong, and measures it. Every typing mode is built on this.
//
// How input works: one hidden <input> holds everything typed so far. On each change we
// compare it with what we had, so phone keyboards (which compose and autocorrect) work too.
//
// What it measures (research/typing.md): speed, accuracy, corrections (backspaces),
// and per key + per letter pair: how often typed, mistakes, and time since the key before.

export const MIN_RUN_CHARS = 10;

/** WPM uses the standard 5 characters = 1 word. */
export const wpmOf = (chars, ms) => (ms > 0 ? (chars / 5) / (ms / 60000) : 0);

const isLetter = c => c >= 'a' && c <= 'z';

/**
 * createTyper(el, opts) → { reset(text, marks?), focus(), running, destroy() }
 * opts:
 *   seconds      — timed run length (null = untimed)
 *   more()       — returns more text to append as you get near the end (optional)
 *   stopOnError  — the run ends at the first wrong key (Clean run)
 *   onStart()    — first keystroke
 *   onTick({ elapsed, left, wpm, chars }) — about 4×/s while running
 *   onDone(run)  — finished; run = { ms, wpm, raw, acc, chars, fixes, keys, pairs, ended }
 * reset(text, marks): marks = Set of character positions to highlight (e.g. the pairs being drilled).
 */
export function createTyper(el, opts = {}) {
  el.innerHTML = `
    <div class="ty-box" data-box tabindex="-1">
      <div class="ty-text" data-text></div>
    </div>
    <input class="ty-input" data-input type="text" autocomplete="off" autocapitalize="off"
      autocorrect="off" spellcheck="false" enterkeyhint="done" aria-label="Type here">`;
  const box = el.querySelector('[data-box]');
  const textEl = el.querySelector('[data-text]');
  const input = el.querySelector('[data-input]');

  let target = '', spans = [], typed = '', marks = new Set();
  let started = 0, done = false, tick = 0, timer = 0, lastKeyAt = 0;
  let strokes = 0, goodStrokes = 0, fixes = 0;
  // key → [times typed, mistakes, total ms since previous key, how many of those were timed]
  let keys = {}, pairs = {};

  const bump = (map, k, ok, dt) => {
    const r = map[k] || (map[k] = [0, 0, 0, 0]);
    r[0]++; if (!ok) r[1]++;
    if (dt != null) { r[2] += Math.round(dt); r[3]++; }
  };

  function spanFor(ch, i) {
    const s = document.createElement('span');
    s.textContent = ch;
    s.dataset.base = (ch === ' ' ? 'sp' : '') + (marks.has(i) ? ' mk' : '');
    return s;
  }

  function render() {
    textEl.innerHTML = '';
    spans = [...target].map((ch, i) => { const s = spanFor(ch, i); textEl.appendChild(s); return s; });
    paint(0, target.length);
  }

  function paint(from, to) {
    for (let i = Math.max(0, from); i < Math.min(to, spans.length); i++) {
      const s = spans[i];
      let cls = s.dataset.base;
      if (i < typed.length) cls += typed[i] === target[i] ? ' ok' : ' bad';
      if (i === typed.length) cls += ' caret';
      s.className = cls.trim();
    }
    // Keep the current line as the first or second visible line.
    const cur = spans[Math.min(typed.length, spans.length - 1)];
    if (cur) {
      const lh = parseFloat(getComputedStyle(textEl).lineHeight) || 40;
      const line = Math.round(cur.offsetTop / lh);
      textEl.style.transform = `translateY(${-Math.max(0, line - 1) * lh}px)`;
    }
  }

  function append(text) {
    const start = target.length;
    target += text;
    for (let i = 0; i < text.length; i++) {
      const s = spanFor(text[i], start + i);
      textEl.appendChild(s);
      spans.push(s);
    }
    paint(start, target.length);
  }

  function stats(now) {
    const ms = Math.max(1, now - started);
    let correct = 0;
    for (let i = 0; i < typed.length; i++) if (typed[i] === target[i]) correct++;
    return { ms, correct, wpm: wpmOf(correct, ms), raw: wpmOf(typed.length, ms) };
  }

  function finish(ended = 'time') {
    if (done || !started) return;
    done = true;
    clearInterval(tick); clearTimeout(timer);
    input.blur();
    const end = opts.seconds && ended === 'time' ? started + opts.seconds * 1000 : performance.now();
    const s = stats(end);
    // Whole words finished before the first mistake (for Clean run).
    let prefix = 0;
    while (prefix < typed.length && typed[prefix] === target[prefix]) prefix++;
    const wordsClean = (target.slice(0, prefix).match(/ /g) || []).length + (prefix > 0 && prefix === target.length ? 1 : 0);
    opts.onDone && opts.onDone({
      ms: Math.round(s.ms),
      wpm: Math.round(s.wpm * 10) / 10,
      raw: Math.round(s.raw * 10) / 10,
      acc: strokes ? Math.round((goodStrokes / strokes) * 1000) / 1000 : 1,
      chars: typed.length,
      correct: s.correct,
      fixes,
      wordsClean,
      keys,
      pairs,
      ended,
    });
  }

  function onInput() {
    if (done) { input.value = typed; return; }
    const val = input.value;
    const now = performance.now();
    // Common prefix between old and new = what stayed; the rest was deleted / added.
    let p = 0;
    while (p < typed.length && p < val.length && typed[p] === val[p]) p++;
    const added = val.slice(p);
    if (p < typed.length) fixes += 1; // something was taken back
    if (added.length && !started) {
      started = now; lastKeyAt = now;
      opts.onStart && opts.onStart();
      tick = setInterval(() => {
        const t = performance.now(), s = stats(t);
        const elapsed = (t - started) / 1000;
        opts.onTick && opts.onTick({ elapsed, left: opts.seconds ? Math.max(0, opts.seconds - elapsed) : null, wpm: s.wpm, chars: s.correct });
      }, 250);
      if (opts.seconds) timer = setTimeout(() => finish('time'), opts.seconds * 1000);
    }
    let firstWrong = -1;
    // Score each new character against the text at its position.
    for (let i = 0; i < added.length; i++) {
      const pos = p + i;
      const want = target[pos];
      if (want === undefined) break;
      const ok = added[i] === want;
      strokes++; if (ok) goodStrokes++;
      if (!ok && firstWrong < 0) firstWrong = pos;
      // Only single keystrokes give a fair time (a pasted/autocorrected chunk doesn't).
      const dt = added.length === 1 && strokes > 1 ? now - lastKeyAt : null;
      const k = want.toLowerCase();
      if (k !== ' ') bump(keys, k, ok, dt);
      const prev = pos > 0 ? target[pos - 1].toLowerCase() : ' ';
      // A letter pair counts when the key before it was typed right.
      if (isLetter(prev) && isLetter(k) && typed[pos - 1] === target[pos - 1]) bump(pairs, prev + k, ok, dt);
    }
    if (added.length) lastKeyAt = now;
    const before = typed.length;
    typed = val.slice(0, target.length);
    if (input.value !== typed) input.value = typed;
    paint(Math.min(before, typed.length) - 1, Math.max(before, typed.length) + 2);

    if (opts.stopOnError && firstWrong >= 0) { finish('error'); return; }
    if (opts.more && target.length - typed.length < 60) append(opts.more());
    if (!opts.seconds && !opts.more && typed.length >= target.length) finish('end');
  }

  input.addEventListener('input', onInput);
  // Enter does nothing while typing; keep focus on the hidden input.
  input.addEventListener('keydown', e => { if (e.key === 'Enter') e.preventDefault(); });
  box.addEventListener('pointerdown', e => { e.preventDefault(); input.focus({ preventScroll: true }); });

  return {
    reset(text, markSet) {
      clearInterval(tick); clearTimeout(timer);
      target = text; typed = ''; input.value = ''; marks = markSet || new Set();
      started = 0; done = false; strokes = 0; goodStrokes = 0; fixes = 0; keys = {}; pairs = {};
      render();
    },
    focus() { input.focus({ preventScroll: true }); },
    get running() { return !!started && !done; },
    stop() { finish('stopped'); },
    destroy() { clearInterval(tick); clearTimeout(timer); el.innerHTML = ''; },
  };
}
