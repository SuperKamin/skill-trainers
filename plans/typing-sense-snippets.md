# Plan: "makes sense" toggle + code snippets

Status: **stage A done + live (08/10)**; stage B not started. (Leo's ideas + picks, 08/10.) Built one stage at a time, like `typing-monkeytype.md`.
Read first: `README.md`, `trainers/typing-engine.js`, `trainers/typing.js`, `trainers/typing-source.js`, `trainers/packs/`.

## Stage A ✅: "makes sense" toggle (all four packs)
A switch in the settings row, next to punctuation / numbers: **makes sense**. On = the text follows the
language's logic instead of being random words. Off = today's random words (stays the default).
Works in **time** and **words** (and their custom / no-end versions). Not in quote (already makes sense) or zen.

- **How:** grammar templates with slots, per pack: `packs/<pack>-sense.js` exporting `sentence()` → one sentence
  (or one line of code). `typing-source.js` calls it when the switch is on, and keeps going sentence after sentence.
  Each sentence is our own made-up text, varied by random slot choices. No copied text.
- **English:** patterns like *[someone] [verb] [object] [place/time]*, *[question]*, *[someone] [verb] that [clause]*.
  Plain, everyday, sensible ("my brother found an old book under the table"). Tagged word lists: nouns
  (person/thing/place), verbs (with past / -s forms), adjectives, places, times. Nothing dark or weird.
- **Português:** the same idea with **agreement**: gender + number for articles and adjectives (a casa nova /
  os carros novos), verb person (eu corro / ele corre / nós corremos). Nouns tagged m/f; verbs with the forms
  used. Accents kept. Keep the patterns small, so everything comes out correct.
- **GDScript:** valid lines that make sense together: `var speed := 200.0`, `@onready var timer := $Timer`,
  `func _ready() -> void:`, `if is_on_floor():`, `velocity.y = jump_velocity`, `health -= damage`,
  `emit_signal("died")`, `print("hello")`. With the switch on and **no snippets engine yet**, lines are
  joined with spaces (one long line). After stage B, they can use real new lines.
- **mcfunction:** commands that would really work: `execute as @a at @s run tp @s ~ ~1 ~`,
  `scoreboard players add @s points 1`, `give @p minecraft:diamond 3`, `effect give @a minecraft:speed 10 1`,
  `tellraw @a {"text":"hi"}`. Selectors, coordinates, items and numbers come from small valid lists.
- **Punctuation / numbers switches:** as built (08/10): punctuation **off** = all lowercase, no marks (same as the
  random words); punctuation **on** = capitals, full stops, commas, questions and the odd !. Numbers on = digits in
  count slots ("3 old books"), off = number words.
- **Sense, not just grammar:** each verb carries the things and places that fit it, each kind of thing its own
  describing words, and counts only where they fit (no "12 kitchens in the library").
- **Bests / usual / History:** "makes sense" is part of the kind of test (`s: true` on the run, in `testKey`
  and the History group), so it's only compared with itself.
- **Done when:** each pack produces 50 sentences/lines in a row that a native speaker / Godot / Minecraft would
  accept. Check Portuguese agreement by reading a batch. Tested in time + words, PC + phone.

## Stage B: code snippets (the "quote" test for GDScript and mcfunction)
For code packs, the **quote** kind becomes **snippet**: a real little piece of code, short / medium / long
(no "thicc" unless we write some). Written for this app (our own code, so no licence issue). Who/what it is shows
at the end, like a quote's source (e.g. "Player jump, GDScript").

- **New lines:** the hidden input becomes a `<textarea>`. **Enter = new line** (a typed character like any
  other, compared with `\n` in the snippet). The word model treats a new line like a space (it ends a word);
  the screen draws real lines. Enter still restarts on the result screen; Shift+Enter still ends zen / no-end tests.
- **Indentation, with a switch (Leo's pick: both):**
  - **Auto (default):** after Enter, the next line's indentation is filled in by itself (not typed, not timed,
    not counted in wpm or accuracy), like a code editor.
  - **Type it yourself:** you type the Tab (GDScript uses tabs) and it counts like any other key.
    Tab currently restarts the test: with this switch on, Tab inside a snippet types a tab instead
    (restart moves to Esc / the button). Show indentation visibly (faint marks), so you can see what to type.
- **All editing keys must keep working** (Ctrl+Backspace, arrows, Shift-select…; that was the stage 1 must-list),
  now also across lines (↑ ↓ can come along for free from the textarea).
- **Snippets to write:** GDScript ~12 (movement, jump, timer, signal, health/damage, spawning, a small state
  machine, an input handler…); mcfunction ~10 (a timer with scoreboards, a kill counter, a launch pad, a
  give-on-join, a countdown, a tellraw welcome…). Grouped by length like quotes.
- **Stats:** a new line counts as one character (like a space). Burst etc. unchanged.
- **Done when:** a GDScript snippet can be typed both ways (auto + typed indentation) and an mcfunction snippet
  in full, with every editing key, on PC; on phone it at least works (Enter key on the phone keyboard).

## Order
A, then B (Leo: "both, one after another"). A needs no engine change; B is the riskier one (textarea + new lines).
Each stage: test here, push, Leo tries it, then the next.
