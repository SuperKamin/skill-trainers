// Keyboard pictures with the finger for each key. Research: research/fingers.md
// One finger map by physical key position (KeyboardEvent.code) works for every layout:
// the colour comes from where the key is, the label comes from the layout.
// What matters most is using the SAME finger for a key every time (Feit et al. 2016),
// so any key's finger can be changed to the one you actually use.

const N = 'Backquote Digit1 Digit2 Digit3 Digit4 Digit5 Digit6 Digit7 Digit8 Digit9 Digit0 Minus Equal'.split(' ');
const T = 'KeyQ KeyW KeyE KeyR KeyT KeyY KeyU KeyI KeyO KeyP BracketLeft BracketRight'.split(' ');
const H = 'KeyA KeyS KeyD KeyF KeyG KeyH KeyJ KeyK KeyL Semicolon Quote'.split(' ');
const B = 'KeyZ KeyX KeyC KeyV KeyB KeyN KeyM Comma Period Slash'.split(' ');

// Unshifted characters, in code order. ISO layouts list IntlBackslash first on the bottom row
// and Backslash last on the home row; ANSI lists Backslash last on the top row; ABNT2 adds IntlRo.
const sp = s => s.split(' ');
export const LAYOUTS = {
  abnt2: { name: 'ABNT2 (Brasil)', geo: 'abnt2', N: sp("' 1 2 3 4 5 6 7 8 9 0 - ="), T: sp('q w e r t y u i o p ´ ['), H: sp('a s d f g h j k l ç ~ ]'), B: sp('\\ z x c v b n m , . ; /') },
  us: { name: 'US QWERTY', geo: 'ansi', N: sp('` 1 2 3 4 5 6 7 8 9 0 - ='), T: sp('q w e r t y u i o p [ ] \\'), H: sp("a s d f g h j k l ; '"), B: sp('z x c v b n m , . /') },
  uk: { name: 'UK QWERTY', geo: 'iso', N: sp('` 1 2 3 4 5 6 7 8 9 0 - ='), T: sp('q w e r t y u i o p [ ]'), H: sp("a s d f g h j k l ; ' #"), B: sp('\\ z x c v b n m , . /') },
  pt: { name: 'Português (PT)', geo: 'iso', N: sp("\\ 1 2 3 4 5 6 7 8 9 0 ' «"), T: sp('q w e r t y u i o p + ´'), H: sp('a s d f g h j k l ç º ~'), B: sp('< z x c v b n m , . -') },
  de: { name: 'Deutsch (QWERTZ)', geo: 'iso', N: sp('^ 1 2 3 4 5 6 7 8 9 0 ß ´'), T: sp('q w e r t z u i o p ü +'), H: sp('a s d f g h j k l ö ä #'), B: sp('< y x c v b n m , . -') },
  fr: { name: 'Français (AZERTY)', geo: 'iso', N: sp('² & é " \' ( - è _ ç à ) ='), T: sp('a z e r t y u i o p ^ $'), H: sp('q s d f g h j k l m ù *'), B: sp('< w x c v b n , ; : !') },
  dvorak: { name: 'Dvorak', geo: 'ansi', N: sp('` 1 2 3 4 5 6 7 8 9 0 [ ]'), T: sp("' , . p y f g c r l / = \\"), H: sp('a o e u i d h t n s -'), B: sp('; q j k x b m w v z') },
  colemak: { name: 'Colemak', geo: 'ansi', N: sp('` 1 2 3 4 5 6 7 8 9 0 - ='), T: sp('q w f p g j l u y ; [ ] \\'), H: sp("a r s t d h n e i o '"), B: sp('z x c v b k m , . /') },
};

/** Codes for each row of a layout, matching its character lists. */
function rowCodes(geo) {
  return {
    N,
    T: geo === 'ansi' ? [...T, 'Backslash'] : T,
    H: geo === 'ansi' ? H : [...H, 'Backslash'],
    B: geo === 'ansi' ? B : geo === 'abnt2' ? ['IntlBackslash', ...B, 'IntlRo'] : ['IntlBackslash', ...B],
  };
}

export const FINGERS = {
  LP: 'left pinky', LR: 'left ring', LM: 'left middle', LI: 'left index',
  RI: 'right index', RM: 'right middle', RR: 'right ring', RP: 'right pinky', TH: 'thumb',
};
const ORDER = ['LP', 'LR', 'LM', 'LI', 'RI', 'RM', 'RR', 'RP', 'TH'];

// Standard column method (research §2). 6 = right index by default.
const STD = {};
const put = (f, codes) => codes.split(' ').forEach(c => { STD[c] = f; });
put('LP', 'Backquote Digit1 Tab KeyQ CapsLock KeyA ShiftLeft IntlBackslash KeyZ');
put('LR', 'Digit2 KeyW KeyS KeyX');
put('LM', 'Digit3 KeyE KeyD KeyC');
put('LI', 'Digit4 Digit5 KeyR KeyT KeyF KeyG KeyV KeyB');
put('RI', 'Digit6 Digit7 KeyY KeyU KeyH KeyJ KeyN KeyM');
put('RM', 'Digit8 KeyI KeyK Comma');
put('RR', 'Digit9 KeyO KeyL Period');
put('RP', 'Digit0 Minus Equal Backspace KeyP BracketLeft BracketRight Backslash Semicolon Quote Enter Slash IntlRo ShiftRight');
put('TH', 'Space');

// ---------- remembered choices (this device) ----------
const LS_LAYOUT = 'skilltrainers.kb.layout';
const LS_FINGERS = 'skilltrainers.kb.fingers';
const read = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* fine */ } };

let mine = read(LS_FINGERS, {});
export const fingerOf = code => mine[code] || STD[code] || 'TH';
export function cycleFinger(code) {
  const i = ORDER.indexOf(fingerOf(code));
  const next = ORDER[(i + 1) % (ORDER.length - 1)]; // thumbs only for space
  if (next === STD[code]) delete mine[code]; else mine[code] = next;
  write(LS_FINGERS, mine);
  return fingerOf(code);
}
export const isChanged = code => code in mine;
export function resetFingers() { mine = {}; write(LS_FINGERS, mine); }

/** The layout to use: your pick, else a guess (browser's keyboard info, then language). */
export function currentLayout() {
  const saved = read(LS_LAYOUT, null);
  if (saved && LAYOUTS[saved]) return saved;
  const lang = (navigator.language || '').toLowerCase();
  if (lang === 'pt-br') return 'abnt2';
  if (lang.startsWith('pt')) return 'pt';
  if (lang.startsWith('de')) return 'de';
  if (lang.startsWith('fr')) return 'fr';
  if (lang === 'en-gb') return 'uk';
  return 'us';
}
export const setLayout = id => write(LS_LAYOUT, id);

/** Ask the browser (Chrome/Edge only) which layout is plugged in. Resolves an id or null. */
export async function detectLayout() {
  try {
    if (!navigator.keyboard || !navigator.keyboard.getLayoutMap) return null;
    const m = await navigator.keyboard.getLayoutMap();
    const g = c => m.get(c);
    if (g('KeyQ') === 'a') return 'fr';
    if (g('KeyY') === 'z') return 'de';
    if (g('KeyS') === 'o') return 'dvorak';
    if (g('KeyE') === 'f') return 'colemak';
    if (g('Semicolon') === 'ç') return g('IntlRo') || g('Backquote') === "'" ? 'abnt2' : 'pt';
    if (g('Backslash') === '#') return 'uk';
    return 'us';
  } catch { return null; }
}

/** Which physical key types this character on a layout ('a' → 'KeyA'). */
export function codeFor(layoutId, ch) {
  const L = LAYOUTS[layoutId] || LAYOUTS.us;
  if (ch === ' ') return 'Space';
  const rc = rowCodes(L.geo);
  const c = ch.toLowerCase();
  for (const r of ['H', 'T', 'B', 'N']) {
    const i = L[r].indexOf(c);
    if (i >= 0) return rc[r][i];
  }
  return null;
}

// ---------- drawing ----------
// Every row adds up to 15 key-widths; flex-grow = width keeps them in proportion.
function rowsFor(L) {
  const rc = rowCodes(L.geo);
  const keys = (r) => rc[r].map((code, i) => ({ code, label: L[r][i], w: 1 }));
  const iso = L.geo !== 'ansi';
  return [
    [...keys('N'), { code: 'Backspace', label: '⌫', w: 2 }],
    [{ code: 'Tab', label: 'tab', w: 1.5 }, ...keys('T'), iso ? { code: 'Enter', label: '', w: 1.5, cls: 'enter-top' } : null].filter(Boolean),
    [{ code: 'CapsLock', label: 'caps', w: 1.75 }, ...keys('H'), iso ? { code: 'Enter', label: '⏎', w: 1.25, cls: 'enter-bot' } : { code: 'Enter', label: '⏎', w: 2.25 }],
    [{ code: 'ShiftLeft', label: 'shift', w: iso ? 1.25 : 2.25 }, ...keys('B'), { code: 'ShiftRight', label: 'shift', w: L.geo === 'abnt2' ? 1.75 : 2.75 }],
    [{ gap: true, w: 3.75 }, { code: 'Space', label: '', w: 6.25 }, { gap: true, w: 5 }],
  ];
}

/**
 * Draw a keyboard into el. opts: { layout, show: Set of codes to light up (null = all keys coloured),
 * small, editable (tap a key to change its finger), onChange }
 * Returns { light(codes:Set) } to change which keys are lit without redrawing.
 */
export function drawKeyboard(el, opts = {}) {
  const L = LAYOUTS[opts.layout] || LAYOUTS.us;
  el.classList.add('kb');
  el.classList.toggle('small', !!opts.small);
  el.classList.toggle('editable', !!opts.editable);
  el.innerHTML = rowsFor(L).map(row => `<div class="kb-row">${row.map(k => k.gap
    ? `<span class="kb-gap" style="flex-grow:${k.w}"></span>`
    : `<button type="button" class="kb-key f-${fingerOf(k.code)} ${k.cls || ''}${isChanged(k.code) ? ' changed' : ''}" data-code="${k.code}" style="flex-grow:${k.w}" ${opts.editable ? '' : 'tabindex="-1"'} title="${FINGERS[fingerOf(k.code)]}">${esc(k.label)}</button>`).join('')}</div>`).join('');

  const api = {
    light(codes) {
      el.querySelectorAll('.kb-key').forEach(b => b.classList.toggle('lit', !!codes && codes.has(b.dataset.code)));
      el.classList.toggle('focus', !!codes && codes.size > 0);
    },
  };
  if (opts.editable) {
    el.onclick = e => {
      const b = e.target.closest('.kb-key');
      if (!b || b.dataset.code === 'Space') return;
      const f = cycleFinger(b.dataset.code);
      el.querySelectorAll(`[data-code="${b.dataset.code}"]`).forEach(x => {
        x.className = x.className.replace(/f-\w\w/, 'f-' + f);
        x.classList.toggle('changed', isChanged(b.dataset.code));
        x.title = FINGERS[f];
      });
      opts.onChange && opts.onChange(b.dataset.code, f);
    };
  }
  if (opts.show) api.light(opts.show);
  return api;
}

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/** The legend: one swatch per finger. */
export function legendHtml() {
  return `<div class="kb-legend">${['LP', 'LR', 'LM', 'LI', 'TH', 'RI', 'RM', 'RR', 'RP'].map(f =>
    `<span><i class="f-${f}"></i>${FINGERS[f]}</span>`).join('')}</div>`;
}
