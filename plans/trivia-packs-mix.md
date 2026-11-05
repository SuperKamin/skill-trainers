# Plan: Trivia, packs + Mix

Status: **stage 1 done + live (05/11).** Leo's picks, 05/11. Build one stage at a time, like `typing-monkeytype.md`.
Read first: `README.md`, `research/trivia.md`, `trainers/index.js`, `trainers/typing.js` (how a trainer mounts), `js/store.js` (sessions), `trainers/packs/` (one file per pack).

## Leo's decisions (05/11)
- The site is **just for him** (his skills, his pace).
- Trivia is for getting better at **general knowledge**, with topic **packs** and a **Mix** mode that pools the packs he ticks and shuffles their questions.
- **Answering:** he **types first**. If he's stuck, a button shows **4 choices**. Getting it from the choices counts too, as a lighter learning moment, and is marked as such.
- **First four packs:** General knowledge · Geography · Science · Minecraft.
- **Later, a separate plan:** the niche-answers mode (Krillion-like mechanic, our own name and look).

## Principles (from the research; built into everything)
- **A miss opens a story, never a red X.** After every answer, show the right answer plus **one short line**: why it's true, or a hook to something he knows.
- **Recall first.** Choices are only a fallback.
- **Forgiving matching.** Lowercase; drop accents; drop leading the / o / a / os / as; aliases (en + pt). Typos: 1 letter off for 5–8 letters, 2 for longer, none for short words; a tie = no match. Always show **"counted as: …"**, plus a small "I was right" button for when matching fails.
- **Play any length**, like the other trainers. There are no rounds you must finish; a calm "that's 20, stopping is a good call" now and then.
- **No points, streaks or guilt.** The feedback names concrete things ("Geography: 7 of 10 from memory").

## Stage 1 ✅: the trainer + Mix + Minecraft pack (62 questions)
- New trainer `trainers/trivia.js` (+ `trivia-engine.js` for matching), added to `trainers/index.js`.
- **Mix screen:** pack chips to tick (remembered per device), then Start. Packs not built yet show as "coming".
- **Question screen:**
  - the question, a text box, **Enter** = answer, and a **"show choices"** button with 4 choices (tap or 1–4);
  - **how sure?** (Leo's yes, 05/11): after he presses Enter (or picks a choice), three buttons **sure / maybe / no idea** (keys 1–3), then the answer shows. **The answer time stops when the answer is given** (Enter or choice), not at the sure-tap. Sure-but-wrong is shown as a twist ("ooh, that's a surprise one"), never as a bigger fail.
  - after the answer: right / not quite, "counted as", the answer, and the one-line story. **Enter / tap** = next.
- **Pack format:** `trainers/packs/trivia-<id>.js` exporting `{ id, title:{en,pt}, licence, credit, questions:[{ id, q:{en,pt}, a:{en,pt}, aliases:[], wrong:[3], note:{en,pt} }] }`. Each `id` stays stable forever; history depends on it.
- **Minecraft pack, written by us:** ~60 questions (mobs, blocks, crafting, redstone, biomes, versions, history of the game), English + Português.
- Results are saved as a session like the other trainers (per question: pack, id, from-memory / from-choices / missed, how sure, answer time).

## After stage 1: Leo's first play (05/11) ✅
- Questions say what kind of answer they want ("In which structure…"), since he answered "the end" to "Where do you find elytra?".
- A right answer is a clear win: gold check, "Got it · from memory", gold answer, a small pop (still motion-safe); "You were sure, and you were right" when that's true. No points.
- **Technical Minecraft** is its own pack (redstone, commands, datapacks, how the game runs); he mixes packs when he wants.
- **Levels**: every question is Easy / Medium / Hard; a Levels filter on the Mix screen (remembered; at least one stays on). Harder questions added: Minecraft 72 (21/29/22), Technical 30 (5/14/11). New packs must give every question a level.

## Stage 2: Geography + Science (English + Português)
- `tools/build-trivia.mjs`, run once on this PC, **not in the browser**. It queries Wikidata (CC0) and writes the pack files.
  - Geography: capitals, continents, flags (as text), longest rivers, highest mountains, Brazilian states.
  - Science: element symbols and numbers, planets and moons, body, animals.
  - Aliases come from Wikidata's en + pt labels. A short `note` comes from a fact template ("Canberra was built as a compromise between Sydney and Melbourne" style is hand-added only where we know it's true; otherwise a plain fact line).
- **Language switch** on the Mix screen: English / Português (a pack without pt stays English).
- Pogo reads a sample of each pack and fixes anything odd.

## Stage 3: General knowledge
- A curated slice of **Open Trivia DB** (CC BY-SA 4.0), English only: ~300 questions, free-answer friendly ones only (e.g. not "which of these…").
- It goes in its own file, `trivia-general.js`, marked **CC BY-SA 4.0** with credit to Open Trivia DB. The credit is also shown in the app (pack info).

## Stage 4: Coming back + History
- **Coming back:** missed and from-choices questions return after ~1 day, ~3 days, ~1 week, **reworded where the pack has a second wording**. A question is **kept** after 3 right answers from memory on 3 different days. Mix leans a little toward due questions (about 1 in 4).
- **History:** per pack, questions seen / kept / due; this week vs last; the misses that came back and were then got right. Shown as "here's what moved".
- This is new data on Leo's Firebase account (per-question memory). Build it in the main conversation after Leo says yes directly.

## Open, Leo's call (ask when we reach it)
- Stage 4: the **monthly outside check** (questions never used in training, to measure real growth): yes or later?
- More packs after these four: music, history, D&D, Brazil, Godot…
