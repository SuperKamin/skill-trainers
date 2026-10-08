# Skill Trainers

Quick practice games for skills, on phone and PC. Live at **https://superkamin.github.io/skill-trainers/** (installable: Add to Home Screen on the phone, Install in the PC browser).

Plain static files, no build step, hosted on GitHub Pages: **pushing to `main` is deploying.** History is kept on the device; signed in with Google it goes to Firebase, so the same history shows on every device. Anything played signed out is uploaded at the next sign-in.

## Trainers

| Trainer | Modes | Research |
|---|---|---|
| **Reaction** | one mode (the test) | `research/reaction.md` (6 practice modes suggested, none built yet) |
| **Notes** (name a note against C) | Test · Easy · Twin notes · Listen | `research/notes.md` |
| **Typing** | Test · Weak pairs · Clean run · Learn the keys | `research/typing.md`, `research/fingers.md` |
| *Memory* (next candidate) | — | `research/memory.md` (recommends "Number Climb" first) |

## How a trainer is made (the recipe, from Leo — 04/10)
1. **Research first** (`research/<trainer>.md`): what actually makes people better, and what's real improvement vs just getting good at the test.
2. **Test mode**: practice by doing that also measures growth.
3. **Practice modes**: drills from the research that target specific struggles or show the skill from another angle.
4. Keep three kinds of things apart:
   - **modes**: screens you play (`modes: [...]`)
   - **methods**: tips you carry into any practice (shown on screen, e.g. "hum it, then sing down to C", "same finger for the same key")
   - **principles**: built into every mode, not a mode of their own (e.g. Notes' "no crutch": octave, sound and loudness change; Typing: PC and phone kept apart, only compared with your own usual)
5. An **easy ramp** is fine when the test is too steep (Notes Easy). Crutches are allowed there on purpose, as long as the Test stays the honest measure.
6. Leo plays it, then says what's missing. Build the next thing from that.

Tone rules for everything: no points, streaks, badges or guilt; no empty praise. Feedback names a concrete thing ("th: 120 → 95 ms").

## Files

```
index.html               the app: Home, Play, History (#/, #/play/<id>[/<mode>], #/history/<id>)
styles.css               look and feel (tokens at the top; finger colours near the end)
firebase-config.js       Firebase web config (public by design; placeholders = local-only mode)
firestore.rules          database rules (pasted in the Firebase console): each person only sees their own data
js/app.js                routing, Home (trainers + modes), sign-in state, mounts trainers
js/store.js              sessions: account when signed in, this device when not; upload at sign-in
js/cloud.js              Firebase sign-in (Google) + Firestore
js/stats.js, js/history.js   Reaction's numbers and History page
trainers/index.js        the list of trainers on Home
trainers/reaction.js     Reaction
trainers/notes*.js       Notes: game, audio (Web Audio synth), logic (unlocks, mix-ups), history
trainers/typing*.js      Typing: trainer, engine (input + measuring), words, history
trainers/keyboard.js     finger keyboard: 8 layouts (ABNT2, US, UK, PT, DE, FR, Dvorak, Colemak), finger map, editable chart
sw.js                    offline cache: the app's own files are network-first (updates show on next open)
manifest.webmanifest     install info; icon-*.png, apple-touch-icon.png (tools/make_icons.py redraws them)
research/                the research behind each trainer
```

## Adding a trainer

`trainers/<id>.js` exports a default object, then gets imported in `trainers/index.js`, and its files go in `SHELL` in `sw.js`.

```js
export default {
  id: 'memory', name: 'Memory', blurb: 'One short line for Home.',
  modes: [{ id: 'test', name: 'Test', blurb: '…' }],   // optional; the first is the test mode
  mount(el, onResult, ctx) {
    // ctx: { mode, sessions (this trainer's past sessions), device: 'pc'|'phone', setStatus(text) }
    // onResult(...) saves into the current session:
    //   { ms } / { early: true }  → Reaction-style taps (times[], early)
    //   { answer: {...} }         → one answer (answers[])
    //   { heard: x }              → a listened item (heard count)
    //   { run: {...} }            → one whole run (runs[])
    return () => { el.innerHTML = ''; };   // cleanup
  },
};
// optional: trainer.renderHistory = (el, sessions, source) => redrawFn   (its own History page)
```

## Data

Device: `localStorage` key `skilltrainers.sessions.v1` (plus small per-device settings: `skilltrainers.typing.len`, `skilltrainers.kb.*`).
Account: `users/{uid}/sessions/{sessionId}` = `{ trainer, mode, startedAt, updatedAt, device, times, early, answers, heard, runs }`.

- Reaction: `times` (ms; taps under 80 ms never count), `early`.
- Notes: `answers` = `{ t: played, a: answered, ok, ms, o: octave, tb: timbre, p?: practice }`. Unlocks are worked out from the answers, never stored.
- Typing: `runs` = `{ m: mode, at, len?, wpm, raw, acc, chars, correct, fixes, wordsClean, keys, pairs, focus?, words? }`; `keys`/`pairs` = `[times, mistakes, ms total, timed count]`.
- Typing engine (`typing-engine.js`): the hidden `<input>` is the source of truth, so all text-box keys work (Ctrl+Backspace, Delete, arrows, Ctrl/Shift+arrows, typing over a selection, inserting mid-text); the screen just draws its text, caret and selection. Monkeytype-style words: typed word *i* lines up with target word *i*; space jumps on; extra letters shown, unfinished/wrong words underlined, missing letters marked. Timing (`keys`, `pairs`) only counts keys added at the end; any edit further back is a fix. Focus mode (`body.ty-focus`) fades everything but the words + counter while typing; mouse move brings it back. Plan for the rest: `plans/typing-monkeytype.md`.

## Testing locally

```
python -m http.server 8766
```
Then open http://localhost:8766/. Unregister the service worker in the browser if you see old files.
