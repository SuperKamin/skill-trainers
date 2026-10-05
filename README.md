# Skill Trainers

Quick mini-games for training a skill. The first one is **Reaction**: wait for the screen to turn yellow, then tap. Play for as long as you like. It is a small web app you can install (on iPhone: Share, then Add to Home Screen). It is plain static files with no build step, so it runs on GitHub Pages.

History is kept on the device. When you sign in with Google, it goes to Firebase so the same history shows up on every device. Anything played while signed out is uploaded the next time you sign in.

## Files

```
index.html             the app: Home, Play and History views (#/, #/play/<id>, #/history/<id>)
styles.css             look and feel (the v1 Reaction Trainer palette and fonts)
firebase-config.js     the Firebase web config (placeholders = local-only mode)
js/app.js              switches views, shows sign-in state
js/store.js            sessions: saves to the account, or to this device when signed out
js/cloud.js            Firebase sign-in + Firestore (loaded only when the config is filled in)
js/stats.js            averages, bests, trend, 7-day numbers
js/history.js          the History page and its graph (hand-drawn SVG)
trainers/index.js      the list of trainers shown on Home
trainers/reaction.js   the Reaction trainer
sw.js                  offline cache (bump CACHE when files change)
manifest.webmanifest   install info; icon-*.png, apple-touch-icon.png are the icons
firestore.rules        database rules to paste into the Firebase console
tools/make_icons.py    redraws the icons (python tools/make_icons.py, needs Pillow)
```

## Adding a trainer

1. Create `trainers/<id>.js`, exporting a default object:
   ```js
   export default {
     id: 'aim',                      // used in URLs and saved with each session
     name: 'Aim',
     blurb: 'One short line for Home.',
     mount(el, onResult, ctx) {     // draw into el; return a function that cleans up
       // call onResult({ ms }) for a measured try, onResult({ early: true }) for a too-soon one
       // ctx.setStatus('12 taps') updates the small line at the top
       return () => { el.innerHTML = ''; };
     },
   };
   ```
2. Import it in `trainers/index.js` and add it to the `trainers` list.
3. Add its file to `SHELL` in `sw.js`, and bump `CACHE`.

## How the numbers work

- A **session** runs from opening a trainer until leaving it, or until 5 minutes pass without a tap.
- **Taps under 80 ms are left out** of every average and best. That is quicker than a human reaction can be, so it was almost surely an accidental or guessed tap. They are still saved in the raw `times` list.
- On the History graph, **higher means faster**. Each dot is one session's average, the ring is that session's best, and the yellow line is the average of the last 5 sessions.

## Data

On the device: `localStorage` key `skilltrainers.sessions.v1`.
In the account: `users/{uid}/sessions/{sessionId}` = `{ trainer, startedAt, updatedAt, device: "phone" | "pc", times: [ms…], early }`.

## Testing locally

```
python -m http.server 8000
```
Then open http://localhost:8000/. For Google sign-in to work there, `localhost` has to be in Firebase's Authorized domains (it is by default).

## How a trainer is made (the recipe, from Leo — 04/10)
1. **Research first** (`research/<trainer>.md`): what actually makes people better, what's real vs just getting good at the test.
2. **Test mode**: practice by doing that also measures growth.
3. **Practice modes**: drills from the research that target specific struggles or show the skill from another angle.
4. Keep three kinds of things apart:
   - **modes** — screens you play (`modes: [...]`)
   - **methods** — tips you carry into any practice (`tip`, e.g. "hum it, then sing down to C")
   - **principles** — built into every mode, not a mode of their own (e.g. Notes' "no crutch": octave, sound and loudness change so only the real skill gives the answer)
