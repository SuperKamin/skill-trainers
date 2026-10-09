// Typing engine: shows a text, takes what you type (physical keyboard or phone keyboard),
// colours it right/wrong, and measures it. Every typing mode is built on this.
//
// How input works: one hidden <input> holds everything typed so far, and it is the single
// source of truth. Because it's a real text box, all the editing keys work natively, on PC
// and phone: Backspace, Ctrl+Backspace, Delete, ← →, Ctrl+← →, Shift(+Ctrl)+← → to select,
// typing over a selection, typing in the middle (inserts). We never block those; we just
// draw what's in the box: its text, its caret, its selection.
//
// Words like Monkeytype: typed word i is lined up with target word i (split on spaces).
// Space jumps to the next word; a word left unfinished or wrong gets underlined and its
// missing letters count as missed; letters typed past the end of a word show as extras.
//
// What it measures (research/typing.md): speed, accuracy, corrections (fixes), and per key +
// per letter pair: how often typed, mistakes, and time since the key before. Timing only
// counts keys added at the end of the text, in order; any edit further back is a fix.

export const MIN_RUN_CHARS = 10;

/** WPM uses the standard 5 characters = 1 word. */
export const wpmOf = (chars, ms) => (ms > 0 ? (chars / 5) / (ms / 60000) : 0);

const isLetter = c => c >= 'a' && c <= 'z';

/** Consistency like Monkeytype: 100 = perfectly even speed second to second (from the raw speed's coefficient of variation). */
export function consistency(raw) {
  if (!raw || raw.length < 2) return null;
  const m = raw.reduce((a, b) => a + b, 0) / raw.length;
  if (!m) return null;
  const sd = Math.sqrt(raw.reduce((a, b) => a + (b - m) ** 2, 0) / raw.length);
  const cv = sd / m;
  return Math.round(Math.max(0, 100 * (1 - Math.tanh(cv + cv ** 3 / 3 + cv ** 5 / 5))));
}
const esc = c => (c === '&' ? '&amp;' : c === '<' ? '&lt;' : c === '>' ? '&gt;' : c);

/**
 * createTyper(el, opts) → { reset(text, marks?), focus(), running, stop(), destroy() }
 * opts:
 *   seconds      — timed run length (null = untimed)
 *   more()       — returns more text (starting with a space) to append near the end (optional)
 *   stopOnError  — the run ends at the first wrong key (Clean run)
 *   zen          — no text to copy: whatever you type is the text (all of it counts as right); Shift+Enter ends it
 *   canEnd       — Shift+Enter ends the run (zen, and tests with no end)
 *   Untimed with no more(): a word-count test — ends when the last word is right, or on a space after it.
 *   onStart()    — first keystroke
 *   onTick({ elapsed, left, wpm, chars, words }) — about 4×/s while running (words = words finished)
 *   onDone(run)  — finished; run = { ms, wpm, raw, acc, chars, correct, fixes, wordsClean, keys, pairs, ended,
 *                  sec: { wpm[], raw[], err[], burst[] } (one per second), cons (consistency %, or null), ch: { ok, bad, x, miss } }
 *                  burst = speed of the last word finished by that second (space before it → space after it)
 *   onKey({ want, ok, dt }) — every scored keystroke at the end of the text (dt = ms since the key before, or null)
 *   onCaret(nextChar)       — whenever the next character to type changes (null at the end)
 *   onType({ ok, space, back }) — once per change to the text, anywhere (for key sounds): back = something erased
 * reset(text, marks): marks = Set of character positions in text to highlight (e.g. the pairs being drilled).
 */
export function createTyper(el, opts = {}) {
  el.innerHTML = `
    <div class="ty-box" data-box tabindex="-1">
      <div class="ty-text" data-text><i class="ty-caret idle" data-caret></i></div>
    </div>
    <input class="ty-input" data-input type="text" autocomplete="off" autocapitalize="off"
      autocorrect="off" spellcheck="false" enterkeyhint="done" aria-label="Type here">`;
  const box = el.querySelector('[data-box]');
  const textEl = el.querySelector('[data-text]');
  const caret = el.querySelector('[data-caret]');
  const input = el.querySelector('[data-input]');

  let target = '', tw = [], starts = [], wordEls = [], spEls = [], marks = new Set();
  let typed = '', typedW = [''];
  let started = 0, done = false, tick = 0, timer = 0, lastKeyAt = 0, composing = false;
  let strokes = 0, goodStrokes = 0, fixes = 0;
  // key → [times typed, mistakes, total ms since previous key, how many of those were timed]
  let keys = {}, pairs = {};
  let lastNext;
  // Second by second: cumulative wpm at the end of each second, and keys / wrong keys typed in it.
  let secWpm = [], secKeys = [], secErr = [], secBurst = [], wordFrom = 0;

  const bump = (map, k, ok, dt) => {
    const r = map[k] || (map[k] = [0, 0, 0, 0]);
    r[0]++; if (!ok) r[1]++;
    if (dt != null) { r[2] += Math.round(dt); r[3]++; }
  };

  // ---------- drawing ----------
  function indexWords() {
    tw = target.split(' ');
    starts = [];
    let at = 0;
    for (const w of tw) { starts.push(at); at += w.length + 1; }
  }

  function addWords(from) {
    const frag = document.createDocumentFragment();
    for (let i = from; i < tw.length; i++) {
      if (i > 0) {
        const sp = document.createElement('span');
        sp.className = 'sp'; sp.textContent = ' ';
        frag.appendChild(sp); spEls[i - 1] = sp;
      }
      const w = document.createElement('span');
      w.className = 'w';
      frag.appendChild(w); wordEls[i] = w;
    }
    textEl.appendChild(frag);
    for (let i = from; i < tw.length; i++) paintWord(i);
  }

  /** Where input position k falls: word index + letter index within that typed word. */
  function locate(k) {
    let i = 0, at = 0;
    while (i < typedW.length - 1 && k > at + typedW[i].length) { at += typedW[i].length + 1; i++; }
    return { i, c: k - at };
  }

  function paintWord(i) {
    const want = tw[i], got = i < typedW.length ? typedW[i] : null;
    const finished = i < typedW.length - 1; // a space was typed after it
    const n = Math.max(want.length, got ? got.length : 0);
    let html = '';
    for (let c = 0; c < n; c++) {
      let cls = 'l';
      if (c >= want.length) cls += ' x'; // extra letter, shown as typed
      else {
        if (marks.has(starts[i] + c)) cls += ' mk';
        if (got && c < got.length) cls += got[c] === want[c] ? ' ok' : ' bad';
        else if (finished) cls += ' miss';
      }
      html += `<span class="${cls}">${esc(c < want.length ? want[c] : got[c])}</span>`;
    }
    // An empty word (zen) still needs a box, so the caret has somewhere to stand.
    if (!n) html = '<span class="zw">&#8203;</span>';
    const w = wordEls[i];
    w.innerHTML = html;
    w.className = 'w' + (finished && got !== want ? ' err' : '');
  }

  function paintSelection() {
    textEl.querySelectorAll('.sel').forEach(s => s.classList.remove('sel'));
    const a = input.selectionStart ?? typed.length, b = input.selectionEnd ?? a;
    if (b <= a) return;
    let { i, c } = locate(a);
    for (let k = a; k < b && i < typedW.length; k++) {
      if (c < typedW[i].length) { wordEls[i]?.children[c]?.classList.add('sel'); c++; }
      else { spEls[i]?.classList.add('sel'); i++; c = 0; }
    }
  }

  const lineHeight = () => parseFloat(getComputedStyle(textEl).lineHeight) || 40;

  function placeCaret() {
    const k = input.selectionDirection === 'backward' ? input.selectionStart : input.selectionEnd;
    const { i, c } = locate(k ?? typed.length);
    const w = wordEls[Math.min(i, wordEls.length - 1)];
    if (!w) return;
    const kids = w.children;
    let x, y, h;
    if (!kids.length) { x = w.offsetLeft; y = w.offsetTop; h = w.offsetHeight; }
    else if (c < kids.length) { const s = kids[c]; x = s.offsetLeft; y = s.offsetTop; h = s.offsetHeight; }
    else { const s = kids[kids.length - 1]; x = s.offsetLeft + s.offsetWidth; y = s.offsetTop; h = s.offsetHeight; }
    caret.style.height = h + 'px';
    caret.style.transform = `translate(${x - 1}px, ${y}px)`;
    // Keep the caret's line as the first or second of the three visible lines.
    const lh = lineHeight();
    const first = (wordEls[0].children[0] || wordEls[0]).offsetTop;
    const line = Math.round((y - first) / lh);
    textEl.style.transform = `translateY(${-Math.max(0, line - 1) * lh}px)`;
    // What comes next at the caret (for the lit key in Learn the keys).
    const want = tw[i] ?? '';
    const next = c < want.length ? want[c] : i < tw.length - 1 ? ' ' : null;
    if (next !== lastNext) { lastNext = next; opts.onCaret && opts.onCaret(next); }
  }

  function draw(fromWord, toWord) {
    for (let i = Math.max(0, fromWord); i <= Math.min(toWord, tw.length - 1); i++) paintWord(i);
    paintSelection();
    placeCaret();
  }

  /** Zen: the text is whatever was typed, so add / drop word boxes to match. */
  function syncZen() {
    target = typed;
    indexWords();
    while (wordEls.length > tw.length) {
      wordEls.pop().remove();
      if (spEls.length > Math.max(0, wordEls.length - 1)) spEls.pop().remove();
    }
    if (wordEls.length < tw.length) addWords(wordEls.length);
  }

  function append(text) {
    const before = tw.length;
    target += text;
    indexWords();
    addWords(before);
  }

  // ---------- measuring ----------
  function stats(now) {
    const ms = Math.max(1, now - started);
    let correct = 0;
    typedW.forEach((g, i) => {
      const w = tw[i] ?? '';
      for (let c = 0; c < Math.min(g.length, w.length); c++) if (g[c] === w[c]) correct++;
      if (i < typedW.length - 1) correct++; // the space after it
    });
    return { ms, correct, wpm: wpmOf(correct, ms), raw: wpmOf(typed.length, ms) };
  }

  /** Record the wpm at every whole second that has passed (up to the run's length). */
  function sample(now) {
    if (!started) return;
    const limit = opts.seconds || Infinity;
    while (secWpm.length < limit && now - started >= (secWpm.length + 1) * 1000) {
      secWpm.push(Math.round(wpmOf(stats(now).correct, (secWpm.length + 1) * 1000)));
    }
  }

  /** Letters right / wrong / extra / missed in what's on screen now (missed = skipped in a finished word). */
  function letters() {
    const ch = { ok: 0, bad: 0, x: 0, miss: 0 };
    typedW.forEach((g, i) => {
      const w = tw[i] ?? '';
      for (let c = 0; c < Math.min(g.length, w.length); c++) g[c] === w[c] ? ch.ok++ : ch.bad++;
      if (g.length > w.length) ch.x += g.length - w.length;
      else if (i < typedW.length - 1) ch.miss += w.length - g.length;
    });
    return ch;
  }

  function finish(ended = 'time') {
    if (done || !started) return;
    done = true;
    clearInterval(tick); clearTimeout(timer);
    input.blur();
    caret.classList.add('idle');
    const end = opts.seconds && ended === 'time' ? started + opts.seconds * 1000 : performance.now();
    const s = stats(end);
    sample(end);
    // A last part-second of at least half a second gets its own point.
    const rest = s.ms - secWpm.length * 1000;
    const n = secWpm.length + (rest >= 500 ? 1 : 0);
    if (n > secWpm.length) secWpm.push(Math.round(s.wpm));
    const raw = [], err = [];
    for (let b = 0; b < n; b++) {
      const len = b < Math.floor(s.ms / 1000) ? 1000 : Math.max(rest, 1);
      // Keys typed after the last whole second count in the last point.
      const k = (secKeys[b] || 0) + (b === n - 1 ? secKeys.slice(n).reduce((a, x) => a + (x || 0), 0) : 0);
      const e = (secErr[b] || 0) + (b === n - 1 ? secErr.slice(n).reduce((a, x) => a + (x || 0), 0) : 0);
      raw.push(Math.round(wpmOf(k, len)));
      err.push(e);
    }
    // Burst: the last word finished by each second (carried on through seconds with no word finished).
    const burst = [];
    let lastBurst = 0;
    for (let b = 0; b < n; b++) {
      for (let q = b; q < (b === n - 1 ? secBurst.length : b + 1); q++) if (secBurst[q] != null) lastBurst = secBurst[q];
      burst.push(lastBurst);
    }
    // Whole words right before the first wrong one (for Clean run).
    let wordsClean = 0;
    while (wordsClean < typedW.length && typedW[wordsClean] === tw[wordsClean] &&
      (wordsClean < typedW.length - 1 || wordsClean === tw.length - 1)) wordsClean++;
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
      sec: { wpm: secWpm.slice(0, n), raw, err, burst },
      cons: consistency(raw),
      ch: letters(),
    });
  }

  function begin(now) {
    started = now; lastKeyAt = now; wordFrom = now;
    caret.classList.remove('idle');
    opts.onStart && opts.onStart();
    tick = setInterval(() => {
      const t = performance.now(), s = stats(t);
      sample(t);
      const elapsed = (t - started) / 1000;
      opts.onTick && opts.onTick({ elapsed, left: opts.seconds ? Math.max(0, opts.seconds - elapsed) : null, wpm: s.wpm, chars: s.correct, words: typedW.length - 1 });
    }, 250);
    if (opts.seconds) timer = setTimeout(() => finish('time'), opts.seconds * 1000);
  }

  /** No space at the very start, no two spaces in a row (no empty words), no words past the end. */
  function tidy(val) {
    let out = val.replace(/^ +/, '').replace(/ {2,}/g, ' ');
    const ws = out.split(' ');
    if (!opts.zen && ws.length > tw.length) out = ws.slice(0, tw.length).join(' ');
    return out;
  }

  function onInput() {
    if (done) { input.value = typed; return; }
    if (composing) return; // wait until the phone keyboard settles the word
    let val = input.value;
    const wordTest = !opts.seconds && !opts.more && !opts.zen;
    const pastEnd = wordTest && val.replace(/^ +/, '').replace(/ {2,}/g, ' ').split(' ').length > tw.length;
    const clean = tidy(val);
    if (clean !== val) {
      const pos = input.selectionStart ?? clean.length;
      const p = Math.max(0, Math.min(clean.length, pos - (val.length - clean.length)));
      input.value = val = clean;
      input.setSelectionRange(p, p);
    }
    if (val === typed) { if (pastEnd && started) finish('end'); else { paintSelection(); placeCaret(); } return; }
    const now = performance.now();
    sample(now); // seconds that ended before this key, measured before it lands

    // What changed: same start (p) and same end (s); in between, something removed and/or added.
    let p = 0;
    while (p < typed.length && p < val.length && typed[p] === val[p]) p++;
    let s = 0;
    while (s < typed.length - p && s < val.length - p && typed[typed.length - 1 - s] === val[val.length - 1 - s]) s++;
    const removed = typed.length - p - s;
    const added = val.slice(p, val.length - s);
    const atEnd = s === 0 && removed === 0;
    if (removed > 0) fixes += 1; // something was taken back
    if (added.length && !started) begin(now);

    const oldWords = typedW.length;
    typed = val;
    typedW = typed.split(' ');
    if (opts.zen) syncZen();

    // Score each new character against the word it landed in.
    let wrong = false;
    for (let n = 0; n < added.length; n++) {
      const pos = p + n;
      const { i, c } = locate(pos);
      const ch = added[n];
      const w = tw[i] ?? '';
      let want, ok;
      if (ch === ' ') { want = ' '; ok = typedW[i] === w; } // a space is right when it ends a right word
      else { want = w[c]; ok = ch === want; }
      strokes++; if (ok) goodStrokes++;
      if (!ok) wrong = true;
      const b = Math.floor((now - started) / 1000);
      secKeys[b] = (secKeys[b] || 0) + 1;
      if (!ok) secErr[b] = (secErr[b] || 0) + 1;
      if (!atEnd) continue; // edits further back: no timing, no key/pair stats
      if (ch === ' ') {
        // A word finished at the end: its burst speed, from the space before it to this one.
        const ms = now - wordFrom;
        if (ms > 0 && typedW[i].length) secBurst[b] = Math.round(wpmOf(typedW[i].length + 1, ms));
        wordFrom = now;
      }
      // Only single keystrokes give a fair time (a pasted/autocorrected chunk doesn't).
      const dt = added.length === 1 && strokes > 1 ? now - lastKeyAt : null;
      if (want == null) continue; // an extra letter: counted wrong above, no key to blame
      const k = want.toLowerCase();
      if (k !== ' ') bump(keys, k, ok, dt);
      opts.onKey && opts.onKey({ want, ok, dt });
      // A letter pair counts when the key before it (same word) was typed right.
      const prev = isLetter(k) && c > 0 && c <= w.length ? w[c - 1].toLowerCase() : ' ';
      if (isLetter(prev) && typedW[i][c - 1] === w[c - 1]) bump(pairs, prev + k, ok, dt);
    }
    if (added.length) lastKeyAt = now;
    if (opts.onType) {
      if (added.length) opts.onType({ ok: !wrong, space: added[added.length - 1] === ' ' });
      else if (removed > 0) opts.onType({ back: true });
    }

    if (opts.more && tw.length - typedW.length < 15) append(opts.more());
    draw(locate(p).i - 1, Math.max(oldWords, typedW.length) + 1);

    if (opts.stopOnError && wrong) { finish('error'); return; }
    // Word-count test: done once the last word is typed right, or on a space after it.
    const last = tw.length - 1;
    if (wordTest && (pastEnd || (typedW.length - 1 === last && typedW[last] === tw[last]))) finish('end');
  }

  input.addEventListener('input', onInput);
  input.addEventListener('compositionstart', () => { composing = true; });
  input.addEventListener('compositionend', () => { composing = false; onInput(); });
  // A space where it would make an empty word does nothing (like Monkeytype).
  input.addEventListener('beforeinput', e => {
    if (e.inputType !== 'insertText' || e.data !== ' ' || e.isComposing) return;
    const a = input.selectionStart, b = input.selectionEnd;
    if (a !== b) return;
    if (a === 0 || typed[a - 1] === ' ' || typed[a] === ' ') e.preventDefault();
  });
  // Enter does nothing while typing. Every other key (arrows, Ctrl, Shift, Delete…) is the text box's own.
  input.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    if ((opts.zen || opts.canEnd) && e.shiftKey) finish('end');
  });
  // Moving the caret / selecting doesn't change the text, so redraw on those too.
  const onSel = () => { if (document.activeElement === input && !done) { paintSelection(); placeCaret(); } };
  document.addEventListener('selectionchange', onSel);
  input.addEventListener('selectionchange', onSel);
  input.addEventListener('keyup', onSel);
  // Clicking the words just focuses typing; the caret stays where it is (keyboard-only editing).
  box.addEventListener('pointerdown', e => { e.preventDefault(); input.focus({ preventScroll: true }); });
  const onResize = () => placeCaret();
  window.addEventListener('resize', onResize);

  return {
    reset(text, markSet) {
      clearInterval(tick); clearTimeout(timer);
      target = text; typed = ''; typedW = ['']; input.value = ''; marks = markSet || new Set();
      started = 0; done = false; strokes = 0; goodStrokes = 0; fixes = 0; keys = {}; pairs = {};
      secWpm = []; secKeys = []; secErr = []; secBurst = []; wordFrom = 0;
      lastNext = undefined;
      textEl.querySelectorAll('.w, .sp').forEach(n => n.remove());
      wordEls = []; spEls = [];
      indexWords();
      addWords(0);
      caret.classList.add('idle');
      placeCaret();
    },
    focus() { input.focus({ preventScroll: true }); },
    get running() { return !!started && !done; },
    stop() { finish('stopped'); },
    destroy() {
      clearInterval(tick); clearTimeout(timer);
      document.removeEventListener('selectionchange', onSel);
      window.removeEventListener('resize', onResize);
      el.innerHTML = '';
    },
  };
}
