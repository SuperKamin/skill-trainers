# Finger charts: which finger types which key

Research for the typing trainer (test, letter-pair drill, clean run). Written 2026-10-08. Read with `research/typing.md`: there we found that **using the same finger for the same key every time** predicts speed better than "proper" touch typing does (Feit et al. 2016). The chart should be framed around that.

---

## 1. The short version

- Each key has a "usual" finger. The coloured keyboard pictures show the standard choice: each finger covers one column, and the little fingers take everything on the edges.
- The standard is a good default, but it is not a law. Fast typists differ. What fast typists share is that **each key always goes to the same finger**, whichever finger that is.
- So the chart is a **suggestion to settle on**. If you already hit B with your right hand every time and it feels good, keep it. Switching only pays off if a key keeps bouncing between fingers.
- Your PC keyboard is almost certainly **ABNT2 (Brazil)**: Ç sits right of L, the accent keys sit right of P and right of Ç, and there is an extra key (`\ |`) left of Z.
- The chart helps most **at the start and on the keys you miss**. After that it should step back, because looking at a picture of the keyboard is still not looking at your text.
- On a phone this doesn't apply. Thumbs work differently, and there is no standard map for them.

---

## 2. Finger map (standard + variations)

The map is defined by **physical position** (`KeyboardEvent.code`), not by character. That way one map works for every layout: on AZERTY, the key labelled A sits where Q is on QWERTY, so it is the left little finger.

Fingers: **LP** left pinky, **LR** left ring, **LM** left middle, **LI** left index, **RI** right index, **RM** right middle, **RR** right ring, **RP** right pinky, **TH** thumbs.

Home row: LP `KeyA`, LR `KeyS`, LM `KeyD`, LI `KeyF` | RI `KeyJ`, RM `KeyK`, RR `KeyL`, RP `Semicolon`. `KeyF` and `KeyJ` have the bumps.

### Standard assignment (column method: each finger goes straight up and down its slanted column)

| Row | LP | LR | LM | LI | RI | RM | RR | RP |
|---|---|---|---|---|---|---|---|---|
| Number | `Backquote` `Digit1` | `Digit2` | `Digit3` | `Digit4` `Digit5` | `Digit6` `Digit7` | `Digit8` | `Digit9` | `Digit0` `Minus` `Equal` `Backspace` |
| Top | `Tab` `KeyQ` | `KeyW` | `KeyE` | `KeyR` `KeyT` | `KeyY` `KeyU` | `KeyI` | `KeyO` | `KeyP` `BracketLeft` `BracketRight` `Backslash` (ANSI) |
| Home | `CapsLock` `KeyA` | `KeyS` | `KeyD` | `KeyF` `KeyG` | `KeyH` `KeyJ` | `KeyK` | `KeyL` | `Semicolon` `Quote` `Backslash` (ISO, left of Enter) `Enter` |
| Bottom | `ShiftLeft` `IntlBackslash` (ISO, left of Z) `KeyZ` | `KeyX` | `KeyC` | `KeyV` `KeyB` | `KeyN` `KeyM` | `Comma` | `Period` | `Slash` `IntlRo` (ABNT2 `/?`) `ShiftRight` |
| Space | TH: either thumb. Most people use one thumb, usually the right. Some trainers say to use the thumb of the hand that did *not* type the last letter. |

Shift rule (standard): hold Shift with the little finger of the **other** hand from the one typing the letter.

### Variations you will see in charts

- **6 on the number row.** In most current web tutor charts, the right index takes 6 and 7. Wikipedia describes an older method, "taught since the 1960s", where the left index takes 5 and 6, the right index takes 7 and 8, RM takes 9, RR takes 0, and RP takes the rest. A third method mixes the two. Because the rows are staggered, 6 sits almost exactly halfway between T and Y, so both are reasonable. **Default: right index. Let Leo flip it.**
- **Number-row shift.** The older method moves each number one key to the right of the column method (LP 1–2, LR 3, LM 4, LI 5–6, RI 7–8, RM 9, RR 0). Charts that look "off by one" are using this method.
- **B.** The standard is left index. Many self-taught typists hit B with the right index, because it is closer to the right hand on a staggered board. Feit et al. found the right hand roams a lot in everyday typists, so this is common and fine if it is consistent.
- **Keys right of P / right of L.** The right pinky takes all of them in every standard chart. On ABNT2 that is a lot: `´` `[` `ç` `~` `]` `/?`, plus Enter and Backspace. Some typists use RR for `Slash`/`IntlRo` or reach `[` with RR. A small adjustable option ("this key: which finger?") covers it.
- **Bottom-left "angle mod."** The Colemak community and ergonomic guides suggest shifting the left hand's bottom row by one key, so the ring takes Z, the middle takes X, and the index takes C and V. B moves to the index from one key further over. It is a minority choice, worth knowing about only.
- **ISO extra key left of Z (`IntlBackslash`).** LP in every chart. On ABNT2 it is `\ |`.

---

## 3. Layouts as data

### Physical geometry (for rendering)

Each row is listed left to right as `code` → unshifted character. Widths are in key units (1u = one letter key). Rows are offset by the Tab, Caps and Shift widths, which gives the stagger.

| Row | ANSI (US) | ISO (UK, PT, DE, FR, ABNT2) |
|---|---|---|
| Number | `Backquote` + 12 keys + Backspace 2u | same |
| Top | Tab 1.5u + 12 keys + `Backslash` 1.5u | Tab 1.5u + 12 keys, then the top half of the tall Enter |
| Home | Caps 1.75u + 11 keys + Enter 2.25u (flat, one row) | Caps 1.75u + 11 keys + `Backslash` (1u, left of Enter) + bottom half of the tall Enter. Enter is an upside-down "L" spanning the top and home rows |
| Bottom | ShiftLeft 2.25u + 10 keys + ShiftRight 2.75u | ShiftLeft **1.25u** + `IntlBackslash` (1u) + 10 keys + ShiftRight 2.75u |
| ABNT2 only | — | Bottom row: ShiftLeft 1.25u + `IntlBackslash` + 10 keys + **`IntlRo` (`/?`, 1u)** + ShiftRight **1.75u** |

Stagger offsets from the left edge: number row 0, top row 1.5u, home row 1.75u, bottom row 2.25u (ANSI). On ISO the bottom row's letters start at the same 2.25u, because ShiftLeft 1.25u + IntlBackslash 1u = 2.25u.

Note: the US `Backslash` key (end of the top row) and the ISO `Backslash` key (left of Enter, home row) have the **same `code`** in different places. Render it according to the geometry (ANSI or ISO) that was picked.

### Rows per layout (unshifted; `†` = dead key)

Codes per row, in order (the same for every layout):

- **N** (number): `Backquote Digit1 Digit2 Digit3 Digit4 Digit5 Digit6 Digit7 Digit8 Digit9 Digit0 Minus Equal`
- **T** (top): `KeyQ KeyW KeyE KeyR KeyT KeyY KeyU KeyI KeyO KeyP BracketLeft BracketRight` (+ `Backslash` on ANSI)
- **H** (home): `KeyA KeyS KeyD KeyF KeyG KeyH KeyJ KeyK KeyL Semicolon Quote` (+ `Backslash` on ISO)
- **B** (bottom): (`IntlBackslash` on ISO) `KeyZ KeyX KeyC KeyV KeyB KeyN KeyM Comma Period Slash` (+ `IntlRo` on ABNT2)

**US QWERTY (ANSI)**
```
N: ` 1 2 3 4 5 6 7 8 9 0 - =
T: q w e r t y u i o p [ ] \
H: a s d f g h j k l ; '
B: z x c v b n m , . /
```

**ABNT2 — Brazil (ISO + IntlRo)**: Leo's probable keyboard.
```
N: ' 1 2 3 4 5 6 7 8 9 0 - =          (Shift+6 = ¨†)
T: q w e r t y u i o p ´† [           (´ key: Shift = `†; [ key: Shift = {)
H: a s d f g h j k l ç ~† ]           (~ key: Shift = ^†; ] sits in the ISO Backslash slot left of Enter; Shift = })
B: \ z x c v b n m , . ; /            (\ = IntlBackslash, left of Z, Shift = |; ; key Shift = :; / = IntlRo, Shift = ?, AltGr = °)
```
Where things are on ABNT2: **Ç** = `Semicolon` (right of L). **´ `** = `BracketLeft` (right of P), dead. **~ ^** = `Quote` (right of Ç), dead. **[ {** = `BracketRight`. **] }** = `Backslash` (left of Enter). **; :** = `Slash`. **/ ?** = `IntlRo`, the extra key left of a short right Shift. **\ |** = `IntlBackslash`, the extra key left of Z. **' "** = `Backquote`. All of these are right-pinky keys, except `\` and `'`, which are left pinky.

Typing an accented letter takes two strokes: the dead key, then the letter (`´` then `a` = á; `~` then `a` = ã). The trainer should treat "á" as two keystrokes with two fingers (RP, then LP).

**ISO QWERTY — UK**
```
N: ` 1 2 3 4 5 6 7 8 9 0 - =          (Shift+2 = ", Shift+3 = £)
T: q w e r t y u i o p [ ]
H: a s d f g h j k l ; ' #            (# in the Backslash slot; Shift+' = @)
B: \ z x c v b n m , . /              (\ = IntlBackslash)
```

**Portuguese (Portugal, ISO)**
```
N: \ 1 2 3 4 5 6 7 8 9 0 ' «
T: q w e r t y u i o p + ´†           (+ Shift = *; ´ Shift = `†)
H: a s d f g h j k l ç º ~†           (º Shift = ª; ~ Shift = ^†)
B: < z x c v b n m , . -
```

**German QWERTZ (ISO)**
```
N: ^† 1 2 3 4 5 6 7 8 9 0 ß ´†
T: q w e r t z u i o p ü +
H: a s d f g h j k l ö ä #
B: < y x c v b n m , . -
```

**French AZERTY (ISO)**: digits need Shift.
```
N: ² & é " ' ( - è _ ç à ) =
T: a z e r t y u i o p ^† $
H: q s d f g h j k l m ù *
B: < w x c v b n , ; : !
```

**Dvorak (US, ANSI)**
```
N: ` 1 2 3 4 5 6 7 8 9 0 [ ]
T: ' , . p y f g c r l / = \
H: a o e u i d h t n s -
B: ; q j k x b m w v z
```

**Colemak (US, ANSI)**: CapsLock is a second Backspace.
```
N: ` 1 2 3 4 5 6 7 8 9 0 - =
T: q w f p g j l u y ; [ ] \
H: a r s t d h n e i o '
B: z x c v b k m , . /
```

Dvorak and Colemak also exist on ISO boards: same letters, plus `IntlBackslash` (and on ABNT2 boards also `IntlRo`) holding whatever the national base layout put there.

Suggested data shape: `{ id, geometry: "ansi"|"iso"|"abnt2", rows: { N:[...], T:[...], H:[...], B:[...] } }`, plus one shared `fingerByCode` map from section 2. The finger colour comes from the `code`, and the label comes from the layout.

---

## 4. Detecting the layout in the browser

**`navigator.keyboard.getLayoutMap()`** returns a map from `code` to the character it produces, e.g. `layoutMap.get("KeyQ") === "a"` on AZERTY.
- Supported in Chromium only: Chrome/Edge desktop, Opera and Samsung Internet. **Not supported in Firefox or Safari, desktop or iOS.** MDN lists Chrome Android and Android WebView as supported, but on a phone it only reflects a physical keyboard, not the on-screen one.
- It needs HTTPS (secure context), can throw `SecurityError` (permissions policy, iframes), and is marked experimental. Feature-check it before use: `if (navigator.keyboard?.getLayoutMap)`.
- It does not tell you the physical geometry (ANSI vs ISO vs ABNT2) or the layout's name. You get characters only, so you still have to match them against the table above. Dead keys may come back as the bare accent or be missing, so match on letters and `ç`.

**Fallback: infer from keystrokes.** Every keydown carries `code` (physical position) and `key` (the character the current layout produced). A few ordinary letters are enough:

| Seen | Means |
|---|---|
| `code KeyQ` → `key "a"` | AZERTY |
| `code KeyY` → `"z"` | QWERTZ |
| `code KeyE` → `"f"` / `KeyS` → `"r"` | Colemak |
| `code KeyS` → `"o"` / `KeyQ` → `"'"` | Dvorak |
| `code Semicolon` → `"ç"` | ABNT2 or PT. Tell them apart with `Backquote` → `"'"` (ABNT2) vs `"\\"` (PT), or `Minus` → `"-"` (ABNT2) vs `"'"` (PT) |
| any `code IntlRo` keystroke | ABNT2 geometry |
| any `code IntlBackslash` keystroke | ISO geometry (ANSI boards have no such key) |
| `code Semicolon` → `";"`, `Quote` → `"'"` | US-style QWERTY (US or ANSI) |

Caveats: `key` changes with Shift and CapsLock, so lowercase it first. Dead keys report `key === "Dead"`. On phones, virtual keyboards usually send `key: "Unidentified"` / `keyCode 229` on keydown, so there is no layout information there; use `input` events.

**Recommendation.**
1. On load: if `getLayoutMap` exists, read it and match it against the layout table. Otherwise default by language: `navigator.language` starting with `pt-BR` → ABNT2, `pt-PT` → PT, `de` → QWERTZ, `fr` → AZERTY, otherwise US.
2. During the first test, check the guess silently against `code`/`key` pairs (the table above). If they disagree, switch, and show one quiet line: "Looks like ABNT2 — change".
3. Always show a **manual picker** with keyboard pictures, not names. Remember the choice (localStorage is fine), and let the user's choice override detection.
4. Geometry (ANSI/ISO/ABNT2) is a separate small toggle, auto-set the first time `IntlBackslash` or `IntlRo` is pressed.

---

## 5. Does showing it help?

**What the evidence says (thin, but consistent):**
- There is **no controlled study** comparing "tutor with on-screen keyboard/finger colours" against "without" on how well people learn. I didn't find one, and the Tsukuba group (2019) says this explicitly. Everything below is indirect.
- **Looking away from the text costs speed.** In Feit et al. (2016), self-taught typists spent about twice as long looking at their hands, and the fast typists were the ones who prepared upcoming keys without looking. An on-screen keyboard moves the glance from the hands to the screen. That is better than looking at the hands, but it is still not looking at the text. The Tsukuba group built their haptic finger cue because a visual next-key display "pulls attention off the text being edited".
- **The need to look fades naturally as skill grows.** In Jiang et al. (2022), learners on a new (randomised) keyboard needed less visual guidance and shorter gaze paths as they practised. A guide that matches this should also fade.
- **Guidance hypothesis (motor learning).** Salmoni et al. (1984) proposed that help given on every attempt can create dependence, so performance drops when the help is gone, and that lighter help can lead to better retention. The evidence is mixed: Wulf & Shea (2004) found little proof of real dependence. It is still a sensible default for any training aid: help early, then less.
- **Consistency matters more than the right finger** (Feit 2016, see `typing.md`). The chart's real job is to help Leo **pick one finger per key and stick to it**, especially for the keys his drill flags as weak.

**Recommendation for the trainer:**
1. **A static chart, off to the side, as a reference.** Show the whole keyboard coloured by finger in the picked layout, with a short line underneath: "Usual fingers. What matters most is using the same finger for the same key every time." It is not shown during the clean run.
2. **Next-key highlight: on at first, then it fades.** For a new user or a new layout, highlight the next key and its finger colour. Fade it based on how Leo does, not on a timer: once a key is typed correctly and quickly (say 3 times in a row under his median time), stop highlighting that key. Bring it back only for keys he hesitates on (longer than about 1.5× his median) or misses. The highlight should appear only after a short pause (~600 ms), so it only shows up when he is actually stuck. That way it helps when needed and stays out of the way otherwise.
3. **Tie it to the weak-pairs drill.** When the drill picks a pair like "ç + a", show just those two keys in colour. That is where the chart is most useful.
4. **Never during the test or the clean run.** Those measure him, so no help on screen.
5. **"My finger" override.** Let Leo click a key and set "I use this finger". The chart is then *his* map, and it fits the consistency finding. No grading, no "wrong finger" alerts. The app can't see his fingers anyway.
6. **A toggle he controls**, with the setting remembered. Default: highlight on for the first sessions, chart always one tap away.

**Phones / thumbs:** the finger chart doesn't apply. Thumb typing has no standard key-to-thumb map. People usually split the keyboard roughly down the middle and switch between one and two thumbs depending on how they hold the phone. Azenkot & Zhai (2012) found that two-thumb typing is fastest, and that taps land offset from the key centres in consistent ways depending on posture. Typing speed on phones depends mostly on autocorrect and looking at the keyboard, not on finger choice (Jiang et al. 2020/2022). Recommendation: **on touch devices, hide the finger chart.** At most, show "left thumb / right thumb" halves, and only if he asks.

---

## 6. Sources

- Feit, Weir, Oulasvirta, *How We Type: Movement Strategies and Performance in Everyday Typing*, CHI 2016. https://userinterfaces.aalto.fi/how-we-type/resources/HowWeType_CHI16.pdf (project page: https://userinterfaces.aalto.fi/how-we-type/)
- Jiang, Jokinen, Oulasvirta, Ren, *Learning to type with mobile keyboards: Findings with a randomized keyboard*, Computers in Human Behavior 126, 2022. https://acris.aalto.fi/ws/portalfiles/portal/67401379/ELEC_Jiang_etal_Learning_to_type_with_mobile_keyboards_Computers_in_Human_Behavior_2022.pdf
- Jiang et al., *How We Type: Eye and Finger Movement Strategies in Mobile Typing*, CHI 2020. https://userinterfaces.aalto.fi/how-we-type-mobile/
- Takakura et al. (Univ. of Tsukuba), touch-typing training with passive haptics (poster), OzCHI 2019. https://www.iplab.cs.tsukuba.ac.jp/paper/poster/takakura_ozchi2019.pdf
- Hasegawa & Hatakenaka, *Touch-Typing Detection Using Eyewear*, Sensors 2019. https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6539308/
- Salmoni, Schmidt, Walter, *Knowledge of results and motor learning* (guidance hypothesis), Psychological Bulletin 1984. Summarised with later mixed results in Wulf et al., Frontiers in Psychology 2010: https://www.frontiersin.org/articles/10.3389/fpsyg.2010.00190/full
- Azenkot & Zhai, *Touch behavior with different postures on soft smartphone keyboards*, MobileHCI 2012. https://dl.acm.org/doi/10.1145/2371574.2371612
- Wikipedia, *Touch typing* (digit-row methods), accessed 2026. https://en.wikipedia.org/wiki/Touch_typing
- MDN, *Keyboard: getLayoutMap()*, accessed 2026. https://developer.mozilla.org/docs/Web/API/Keyboard/getLayoutMap
- MDN, *KeyboardEvent.code* values. https://developer.mozilla.org/docs/Web/API/UI_Events/Keyboard_event_code_values
- kbdlayout.info, Windows layouts *Portuguese (Brazil ABNT2)* (KBDBR) and *Portuguese* (KBDPO). https://kbdlayout.info/kbdbr · https://kbdlayout.info/kbdpo
- sharktastica, *ABNT2 layout* (geometry: 1.75u right Shift, extra keys). https://sharktastica.co.uk/topics/keyboard-dictionary/rIT7huNT
- Colemak forum, discussion of the left-index/B and angle-mod assignment. https://forum.colemak.com/post/23050/
