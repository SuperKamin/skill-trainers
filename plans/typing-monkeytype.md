# Plan: make Typing feel like Monkeytype

Status: **all 4 stages done + live (08/10)**. Next is Leo playing it and saying what's off. Picked 08/10. Written so a fresh session can build it without the conversation.
Read first: `README.md` (trainer recipe + interface), `research/typing.md`, `trainers/typing-engine.js`, `trainers/typing.js`.

## Goal
The Typing trainer should *feel* like monkeytype.com while it's being played: the caret, the flowing lines, the clear
mistakes, the quiet focus, and a results screen worth looking at. The trainer's own ideas stay (Weak pairs, Clean run,
Learn the keys, finger keyboard, "compared only with your own usual", PC/phone kept apart).

## Already there (keep, don't rebuild)
Test 15/30/60 s · WPM, raw, accuracy, fixes · Tab/Enter restarts · trickiest keys · finger keyboard + layouts ·
history in Firestore (`users/{uid}/sessions`), offline-first, signed-out runs uploaded at sign-in.

## What was picked (all of it is in scope)

### A. While typing
1. **Smooth caret**: a thin caret that glides (CSS transform transition, ~80–100 ms) between letters, not a highlighted box.
   Blinks only while idle, before the first key.
2. **3 lines that scroll**: show exactly 3 lines of words. Finishing line 2 slides the text up one line. No scrollbar.
   Text is generated ahead as needed (the engine already has `more()`).
3. **Focus mode**: on the first key, everything except the words + a tiny live counter (time left or words left, WPM)
   fades out (header, mode picker, keyboard button, tips). It comes back on finish, on mouse move, or on Esc.
4. **Mistakes shown clearly (Monkeytype's word model)**:
   - letters not typed yet: grey · right: bright · wrong: red
   - **extra letters** (typed past the end of a word) are inserted and shown in dark red
   - **space always jumps to the next word**. A word left wrong or unfinished gets a red underline, and its missed letters count as "missed"
   - backspace can go back into the previous word **only if that word is wrong** (Monkeytype's rule)
   - ⚠ This changes the engine from "compare the whole string by position" to "per-word". Must still work with **phone
     keyboards** (composition/autocorrect: the hidden-input diff in `typing-engine.js`). Keep `keys`/`pairs` timing
     stats working: Weak pairs depends on them.
5. **Text-box editing keys (must have, the player's must-list, 08/10)**. This goes past Monkeytype, which mostly blocks these:
   - **Ctrl+Backspace** deletes the word before the caret · **Delete** erases forward · plain Backspace as usual
   - **← →** move the caret one letter · **Ctrl+← →** jump a word
   - **Shift+← →** and **Ctrl+Shift+← →** select; the selection is drawn in the typing box
   - With a selection: Backspace/Delete erase it, and **typing replaces it**
   - **Typing in the middle inserts** (pushes the rest right), like a normal text box. It does not overwrite.
   - The caret can go **anywhere already typed**, into correct words too (no Monkeytype lock)
   - Home/End and Ctrl+A coming along for free is fine.
   - Implementation hint: the hidden `<input>` is already a real text box and does all of this natively (PC and phone).
     Let it be the single source of truth: render from `input.value` + `selectionStart/End`, align typed word *i*
     with target word *i* (split on spaces). That gives Monkeytype's "space jumps to next word / unfinished word = missed"
     for free. A space at the very start or right after another space is ignored (no empty words).
     Don't `preventDefault` these keys; only Tab/Enter (restart) and Esc stay special.
   - Stats: **timing** (`keys`, `pairs`, per-second WPM) only counts keys added at the end of the text in order;
     any edit before the end counts as a **fix**. Accuracy/char counts come from the final text vs the target, plus
     wrong keystrokes as now.
   - The caret (A1) and the selection must be drawn at the input's real caret position after every key, mouse click
     included (or block mouse clicks in the box, and keep keyboard-only).

### B. Results screen (after Test, and wherever it fits for the other modes)
1. **Speed graph**: WPM per second (and raw, fainter), with small red marks on seconds that had errors. Same chart
   style as the History page.
2. **Consistency %**: Monkeytype's formula: based on the coefficient of variation of the per-second raw WPM
   (`100 * (1 - tanh(cv))` style, kept 0–100). Show it next to accuracy.
3. **Letter breakdown**: correct / wrong / extra / missed (like Monkeytype's "characters 210/3/1/0").
4. **New personal best**: a small calm "new best for 30 s 🎉" when beaten. Best is per **mode + length + word pack +
   options + device** (PC vs phone). It only ever adds; never show "you were slower than your best".
   Save the new fields (per-second series, consistency, char counts, options) into the session doc.

### C. Tests and options
1. **Word-count mode**: 10 / 25 / 50 / 100 words, next to the existing time mode. (Quotes: optional, later.)
2. **Punctuation & numbers**: two toggles. Punctuation adds capitals at sentence starts, commas, periods, ?, !, quotes,
   the odd apostrophe; numbers mixes in some numbers. Same idea as Monkeytype.
3. **Portuguese words**: a Portuguese common-words list (with accents: ç, ã, é, ê, ó, á, õ…), switchable with English.
   Accents must be checked as the real character (ABNT2 dead keys make one composed char). Weak pairs should keep
   working per language (pairs are language-specific; store language on the session).
4. **Zen / free typing**: no words given, no timer. Type anything; Shift+Enter (or a button on phone) ends it. Shows
   WPM + the speed graph. There is no "wrong" in zen.
5. **Code word packs** (the player's own idea): type code tokens, like Monkeytype's `code_*` languages.
   - Start with **GDScript** and **mcfunction** (Minecraft commands). Monkeytype has code packs but **no mcfunction**,
     so that one is ours.
   - v1 = word packs (tokens/short bits like `func`, `@onready`, `var`, `_ready()`, `execute as @a run`, `scoreboard
     players add`, `~ ~1 ~`), with symbols kept as typed.
   - Make packs **easy to add**: one file per pack (e.g. `trainers/packs/gdscript.js`), a registry, the picker reads it.
   - Licence: Monkeytype is GPL-3.0 and this repo is public. **Write our own lists** (keywords and built-ins are
     public facts) rather than copying theirs. If anything is copied, credit it and check the licence first.
   - Later option (not now): real multi-line snippets with indentation.

### D. Feel
1. **Key sounds**: a click on each key, off by default, with 3–4 sounds to pick (e.g. click, thock, typewriter, soft
   beep). Make them with Web Audio (see `notes-audio.js`), no big files. Very low latency; a different/softer sound on
   a wrong key is optional. Volume slider.
   Not picked: themes, the full Monkeytype look, hard-mode switches. Keep the app's own look. (Monospace text in the
   typing box is still fine if it helps the caret.)

## Where settings live
One small settings row/sheet in Typing: mode (time/words/zen) · length · pack (English / Português / GDScript /
mcfunction) · punctuation · numbers · sound. Remember the choices on the device (localStorage, wrapped in try/catch).

## Which modes get what
- Engine changes (A1–A4, sounds) apply to **every** typing mode, since they all use `typing-engine.js`.
- Learn the keys keeps its own lit-key behaviour; check that the caret and the 3 lines don't fight the finger keyboard.
- Clean run: "ends at the first wrong key" stays; decide whether an extra letter counts as wrong (yes).
- Phone: everything must work at phone width; focus mode and caret too; the finger keyboard stays hidden on phone.

## Suggested build order (each stage shippable on its own)
1. ✅ **Engine + look** (08/10): per-word model, extra/missed letters, editing keys (A5), caret + selection, 3 lines, focus mode.
   *(the risky part: phone input + editing keys)* Test every key in A5 on PC before pushing.
2. ✅ **Results** (08/10): per-second series, graph, consistency, letter breakdown, personal best, new session fields + History.
3. ✅ **Content** (08/10): word-count + zen modes, punctuation/numbers, Portuguese list, pack registry + GDScript + mcfunction.
4. ✅ **Sounds** (08/10).

## Done when
- On PC (Chrome/Vivaldi, ABNT2) and on the phone: a 30 s test, a 25-word test and a zen run all work, look right, save,
  and show in History; old sessions still show.
- Weak pairs, Clean run and Learn the keys still work.
- Pushed to `main` (= live), service-worker cache bumped so the app picks it up, `README.md` + `WHERE-WE-ARE.md` updated.
- The player tries it and says what feels off. That's the real test.
