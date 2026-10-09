// Typing engine: shows a text, takes what you type (physical keyboard or phone keyboard),
// colours it right/wrong, and measures it. Every typing mode is built on this.
//
// How input works: one hidden <textarea> holds everything typed so far, and it is the single
// source of truth. Because it's a real text box, all the editing keys work natively, on PC
// and phone: Backspace, Ctrl+Backspace, Delete, ← →, Ctrl+← →, Shift(+Ctrl)+← → to select,
// typing over a selection, typing in the middle (inserts), and ↑ ↓ across lines in code.
// We never block those; we just draw what's in the box: its text, its caret, its selection.
//
// Words like Monkeytype: the text is words with separators between them — a space, or (in code
// snippets) a new line plus indentation. Typed word i is lined up with target word i. A separator
// moves on to the next word; a word left unfinished or wrong gets underlined and its missing letters
// count as missed; letters typed past the end of a word show as extras.
// New lines (code snippets only): Enter types one. With autoIndent, the rest of the separator
// (the next line's tabs, or a blank line) fills itself and isn't counted; with tabTypes, Tab types a
// tab and it counts like any key.
//
// What it measures (research/typing.md): speed, accuracy, corrections (fixes), and per key +
// per letter pair: how often typed, mistakes, and time since the key before. Timing only
// counts keys added at the end of the text, in order; any edit further back is a fix.

export const MIN_RUN_CHARS = 10;

/** WPM uses the standard 5 characters = 1 word. */
export const wpmOf = (chars, ms) => (ms > 0 ? (chars / 5) / (ms / 60000) : 0);

const isLetter = c => c >= 'a' && c <= 'z';
const isSep = c => c === ' ' || c === '\n' || c === '\t';

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
 * Text → words and the separator after each one (a run of spaces / new lines / tabs; '' after the last).
 * If the text ends with a separator, an empty word follows (the word being started), so
 * words.length - 1 is always the number of finished words.
 */
export function tokenize(str) {
  const words = [], seps = [];
  let i = 0;
  do {
    let j = i; while (j < str.length && !isSep(str[j])) j++;
    let k = j; while (k < str.length && isSep(str[k])) k++;
    words.push(str.slice(i, j)); seps.push(str.slice(j, k));
    i = k;
  } while (i < str.length);
  if (seps[seps.length - 1]) { words.push(''); seps.push(''); }
  return { words, seps };
}

/**
 * createTyper(el, opts) → { reset(text, marks?), focus(), running, stop(), destroy() }
 * opts:
 *   seconds      — timed run length (null = untimed)
 *   more()       — returns more text (starting with a space) to append near the end (optional)
 *   stopOnError  — the run ends at the first wrong key (Clean run)
 *   zen          — no text to copy: whatever you type is the text (all of it counts as right); Shift+Enter ends it
 *   canEnd       — Shift+Enter ends the run (zen, and tests with no end)
 *   autoIndent   — code snippets: after Enter, the rest of the separator (tabs, blank line) fills itself
 *   tabTypes     — code snippets: Tab types a tab (instead of leaving it to the page, where it restarts)
 *   Untimed with no more(): a word-count test — ends when the last word is right, or on a separator after it.
 *   onStart()    — first keystroke
 *   onTick({ elapsed, left, wpm, chars, words }) — about 4×/s while running (words = words finished)
 *   onDone(run)  — finished; run = { ms, wpm, raw, acc, chars, correct, fixes, wordsClean, keys, pairs, ended,
 *                  sec: { wpm[], raw[], err[], burst[] } (one per second), cons (consistency %, or null), ch: { ok, bad, x, miss } }
 *                  burst = speed of the last word finished by that second (separator before it → separator after it)
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
    <textarea class="ty-input" data-input rows="1" wrap="off" autocomplete="off" autocapitalize="off"
      autocorrect="off" spellcheck="false" aria-label="Type here"></textarea>`;
  const box = el.querySelector('[data-box]');
  const textEl = el.querySelector('[data-text]');
  const caret = el.querySelector('[data-caret]');
  const input = el.querySelector('[data-input]');

  let target = '', tw = [], tsep = [], starts = [], wordEls = [], spEls = [], marks = new Set();
  let multiline = false;
  let typed = '', typedW = [''], typedS = [''];
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
    ({ words: tw, seps: tsep } = tokenize(target));
    // A target never has a word being started: drop the empty word tokenize adds after a final separator.
    if (!opts.zen && tw.length > 1 && tw[tw.length - 1] === '' && tsep[tw.length - 2]) { tw.pop(); tsep.pop(); }
    starts = [];
    let at = 0;
    tw.forEach((w, i) => { starts.push(at); at += w.length + tsep[i].length; });
  }
  function retokenize() { ({ words: typedW, seps: typedS } = tokenize(typed)); }

  function addWords(from) {
    const frag = document.createDocumentFragment();
    for (let i = from; i < tw.length; i++) {
      if (i > 0 && !spEls[i - 1]) {
        const sp = document.createElement('span');
        sp.className = 'sep';
        frag.appendChild(sp); spEls[i - 1] = sp;
      }
      const w = document.createElement('span');
      w.className = 'w';
      frag.appendChild(w); wordEls[i] = w;
    }
    textEl.appendChild(frag);
    for (let i = Math.max(0, from - 1); i < tw.length; i++) paintWord(i);
  }

  /** Where caret position k falls: word i, letter c in it, and s = how far into the separator after it (0 = not in it). */
  function locate(k) {
    let i = 0, at = 0;
    while (i < typedW.length - 1) {
      const end = at + typedW[i].length;
      if (k <= end) break;
      const sepEnd = end + typedS[i].length;
      if (k < sepEnd) return { i, c: typedW[i].length, s: k - end };
      at = sepEnd; i++;
    }
    return { i, c: k - at, s: 0 };
  }

  /** Which typed character is at position pos: letter c of word i, or separator character j after word i. */
  function where(pos) {
    let at = 0;
    for (let i = 0; i < typedW.length; i++) {
      const end = at + typedW[i].length;
      if (pos < end) return { i, c: pos - at, j: null };
      const sepEnd = end + typedS[i].length;
      if (pos < sepEnd) return { i, c: typedW[i].length, j: pos - end };
      at = sepEnd;
    }
    return { i: typedW.length - 1, c: pos - at, j: null };
  }

  function paintWord(i) {
    const want = tw[i], got = i < typedW.length ? typedW[i] : null;
    const finished = i < typedW.length - 1; // a separator was typed after it
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
    paintSep(i);
  }

  /** True once you've moved past the separator after word i (the next word has started). */
  const sepDone = i => i < typedW.length - 2 || (i === typedW.length - 2 && typedW[i + 1] !== '');

  /** The separator after word i: one box per character (space, new line, tab), right / wrong as typed. */
  function paintSep(i) {
    const el = spEls[i];
    if (!el) return;
    const want = tsep[i] || '';
    const got = i < typedW.length - 1 || (i === typedW.length - 1 && typedS[i]) ? typedS[i] : '';
    const complete = sepDone(i);
    let html = '';
    for (let j = 0; j < want.length; j++) {
      const ch = want[j];
      let cls = ch === '\n' ? 'nl' : ch === '\t' ? 'tab' : 'sp';
      if (j < got.length) cls += got[j] === ch ? ' ok' : ' bad';
      else if (complete) cls += ' bad'; // left out (e.g. a tab of indentation) and already moved on
      html += `<span class="${cls}">${ch}</span>`;
    }
    el.innerHTML = html;
    el.className = 'sep' + (got.length > want.length ? ' xs' : '');
  }

  function paintSelection() {
    textEl.querySelectorAll('.sel').forEach(s => s.classList.remove('sel'));
    const a = input.selectionStart ?? typed.length, b = input.selectionEnd ?? a;
    for (let k = a; k < b; k++) {
      const { i, c, j } = where(k);
      if (j == null) wordEls[i]?.children[c]?.classList.add('sel');
      else spEls[i]?.children[Math.min(j, (spEls[i]?.children.length || 1) - 1)]?.classList.add('sel');
    }
  }

  const lineHeight = () => parseFloat(getComputedStyle(textEl).lineHeight) || 40;

  function placeCaret() {
    const k = input.selectionDirection === 'backward' ? input.selectionStart : input.selectionEnd;
    const { i, c, s } = locate(k ?? typed.length);
    const w = wordEls[Math.min(i, wordEls.length - 1)];
    if (!w) return;
    const kids = w.children;
    const sepKids = s ? spEls[i]?.children : null;
    let x, y, h;
    const at = el => { x = el.offsetLeft; y = el.offsetTop; h = el.offsetHeight; };
    const after = el => { x = el.offsetLeft + el.offsetWidth; y = el.offsetTop; h = el.offsetHeight; };
    if (sepKids && sepKids.length) { if (s < sepKids.length) at(sepKids[s]); else after(sepKids[sepKids.length - 1]); }
    else if (!kids.length) at(w);
    else if (c < kids.length) at(kids[c]);
    else after(kids[kids.length - 1]);
    caret.style.height = h + 'px';
    caret.style.transform = `translate(${x - 1}px, ${y}px)`;
    // Keep the caret's line as the first or second of the three visible lines.
    const lh = lineHeight();
    const first = (wordEls[0].children[0] || wordEls[0]).offsetTop;
    const line = Math.round((y - first) / lh);
    textEl.style.transform = `translateY(${-Math.max(0, line - 1) * lh}px)`;
    // What comes next at the caret (for the lit key in Learn the keys).
    const want = tw[i] ?? '';
    const next = s ? (tsep[i] || '')[s] ?? null : c < want.length ? want[c] : (tsep[i] || '')[0] ?? null;
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
  /** Characters actually typed: auto-filled indentation doesn't count. */
  function typedCount() {
    if (!opts.autoIndent) return typed.length;
    return typed.length - typedS.reduce((n, s) => n + (s.includes('\n') ? s.length - 1 : 0), 0);
  }

  function stats(now) {
    const ms = Math.max(1, now - started);
    let correct = 0;
    typedW.forEach((g, i) => {
      const w = tw[i] ?? '';
      for (let c = 0; c < Math.min(g.length, w.length); c++) if (g[c] === w[c]) correct++;
      if (i < typedW.length - 1) correct++; // the separator after it counts as one character
    });
    return { ms, correct, wpm: wpmOf(correct, ms), raw: wpmOf(typedCount(), ms) };
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
      // Code: indentation left out counts as missed too.
      if (multiline && sepDone(i) && (tsep[i] || '').length > typedS[i].length) ch.miss += tsep[i].length - typedS[i].length;
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

  /** Up to the end of word n-1 (drops anything typed after the last word). */
  function upToWords(t, n) {
    let out = '';
    for (let k = 0; k < n; k++) out += t.words[k] + (k < n - 1 ? t.seps[k] : '');
    return out;
  }

  /** No separator at the very start, no two spaces in a row (no empty words), no words past the end. */
  function tidy(val) {
    let out = val.replace(/^[ \n\t]+/, '').replace(/ {2,}/g, ' ');
    if (!multiline) out = out.replace(/[\n\t]/g, '');
    if (!opts.zen) { const t = tokenize(out); if (t.words.length > tw.length) out = upToWords(t, tw.length); }
    return out;
  }

  function onInput() {
    if (done) { input.value = typed; return; }
    if (composing) return; // wait until the phone keyboard settles the word
    let val = input.value;
    const wordTest = !opts.seconds && !opts.more && !opts.zen;
    const pastEnd = wordTest && tokenize(val.replace(/^[ \n\t]+/, '').replace(/ {2,}/g, ' ')).words.length > tw.length;
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
    const before = typed;
    typed = val;
    retokenize();
    if (opts.zen) syncZen();

    // Score each new character against the word (or separator) it landed in.
    let wrong = false;
    for (let n = 0; n < added.length; n++) {
      const pos = p + n;
      const { i, c, j } = where(pos);
      const ch = added[n];
      const w = tw[i] ?? '';
      let want, ok;
      if (j != null) {
        // A separator: right when it's the expected one (and the word before it is right).
        want = (tsep[i] || '')[j];
        ok = ch === want && (j > 0 || typedW[i] === w);
      } else { want = w[c]; ok = ch === want; }
      strokes++; if (ok) goodStrokes++;
      if (!ok) wrong = true;
      const b = Math.floor((now - started) / 1000);
      secKeys[b] = (secKeys[b] || 0) + 1;
      if (!ok) secErr[b] = (secErr[b] || 0) + 1;
      if (!atEnd) continue; // edits further back: no timing, no key/pair stats
      if (j === 0) {
        // A word finished at the end: its burst speed, from the separator before it to this one.
        const ms = now - wordFrom;
        if (ms > 0 && typedW[i].length) secBurst[b] = Math.round(wpmOf(typedW[i].length + 1, ms));
        wordFrom = now;
      }
      // Only single keystrokes give a fair time (a pasted/autocorrected chunk doesn't).
      const dt = added.length === 1 && strokes > 1 ? now - lastKeyAt : null;
      if (want == null) continue; // an extra letter: counted wrong above, no key to blame
      const k = want.toLowerCase();
      if (!isSep(k)) bump(keys, k, ok, dt);
      opts.onKey && opts.onKey({ want, ok, dt });
      // A letter pair counts when the key before it (same word) was typed right.
      const prev = j == null && isLetter(k) && c > 0 && c <= w.length ? w[c - 1].toLowerCase() : ' ';
      if (isLetter(prev) && typedW[i][c - 1] === w[c - 1]) bump(pairs, prev + k, ok, dt);
    }
    if (added.length) lastKeyAt = now;

    if (opts.autoIndent && multiline) {
      // Enter at the end: the rest of the line break (the next line's tabs, a blank line) fills itself.
      if (atEnd && added.endsWith('\n')) {
        const { i, j } = where(typed.length - 1);
        const want = tsep[i] || '';
        if (j === 0 && want[0] === '\n' && /^[\n\t]+$/.test(want) && want.length > 1) setTyped(typed + want.slice(1));
      // Backspace into filled-in indentation: the whole line break goes, back to the end of the line above.
      } else if (removed > 0 && !added && s === 0 && /[\n\t]$/.test(before) && /\n[\n\t]*$/.test(typed)) {
        setTyped(typed.replace(/\n[\n\t]*$/, ''));
      }
    }

    if (opts.onType) {
      if (added.length) opts.onType({ ok: !wrong, space: isSep(added[added.length - 1]) });
      else if (removed > 0) opts.onType({ back: true });
    }

    if (opts.more && tw.length - typedW.length < 15) append(opts.more());
    draw(where(Math.max(0, p - 1)).i - 1, Math.max(oldWords, typedW.length) + 1);

    if (opts.stopOnError && wrong) { finish('error'); return; }
    // Word-count test (and quotes / snippets): done once the last word is typed right, or on a separator after it.
    const last = tw.length - 1;
    if (wordTest && (pastEnd || (typedW.length - 1 === last && typedW[last] === tw[last]))) finish('end');
  }

  /** Change what's typed from here (auto indentation), keeping the caret at the end. */
  function setTyped(v) {
    typed = v;
    input.value = v;
    input.setSelectionRange(v.length, v.length);
    retokenize();
  }

  input.addEventListener('input', onInput);
  input.addEventListener('compositionstart', () => { composing = true; });
  input.addEventListener('compositionend', () => { composing = false; onInput(); });
  // A space (or new line) where it would make an empty word does nothing (like Monkeytype).
  input.addEventListener('beforeinput', e => {
    if (e.isComposing) return;
    const a = input.selectionStart, b = input.selectionEnd;
    if (e.inputType === 'insertLineBreak' || e.inputType === 'insertParagraph') {
      if (!multiline || (a === b && a === 0)) e.preventDefault();
      return;
    }
    if (e.inputType !== 'insertText' || e.data !== ' ') return;
    if (a !== b) return;
    if (a === 0 || isSep(typed[a - 1] ?? '') || isSep(typed[a] ?? '')) e.preventDefault();
  });
  input.addEventListener('keydown', e => {
    // Tab types a tab in code snippets when you type the indentation yourself.
    if (e.key === 'Tab' && opts.tabTypes && multiline && !e.ctrlKey && !e.altKey) {
      e.preventDefault(); e.stopPropagation();
      if (done) return;
      input.setRangeText('\t', input.selectionStart, input.selectionEnd, 'end');
      onInput();
      return;
    }
    if (e.key !== 'Enter') return;
    // Shift+Enter ends zen / tests with no end. Enter types a new line only in code snippets.
    if ((opts.zen || opts.canEnd) && e.shiftKey) { e.preventDefault(); finish('end'); return; }
    if (!multiline) e.preventDefault();
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
      target = text; typed = ''; typedW = ['']; typedS = ['']; input.value = ''; marks = markSet || new Set();
      multiline = text.includes('\n');
      input.setAttribute('enterkeyhint', multiline ? 'enter' : 'done');
      started = 0; done = false; strokes = 0; goodStrokes = 0; fixes = 0; keys = {}; pairs = {};
      secWpm = []; secKeys = []; secErr = []; secBurst = []; wordFrom = 0;
      lastNext = undefined;
      textEl.querySelectorAll('.w, .sep').forEach(n => n.remove());
      textEl.classList.toggle('code', multiline);
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
