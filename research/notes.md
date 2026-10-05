# Note-naming by ear (with a reference note) — research notes

## 1. The short version
- What you're training is **relative pitch**: hearing a note *in relation to* a home note. It's the skill most musicians actually use, and anyone can get better at it.
- **Perfect pitch** (naming a note with no reference) can be partly learned by some teens and adults, but it takes 30+ hours and most people only get part of the way. Don't promise it.
- **Hear notes as "jobs in a key", not as distances.** C feels like home, G feels stable, B wants to fall back to C. That feeling is faster than counting steps.
- **Start with a few notes that are far apart** (C, E, G), then add the in-between ones. The hard pairs are neighbours: **E/F** and **B/C**.
- **Sing it.** Humming the note back, or singing down to home, links your ear to your voice. Your voice-acting ear helps here.
- **Short and often beats long and rare.** A few minutes a day, plus sleep, is when the learning sets in.
- **Speed shows real skill.** If you're right but slow, you're probably counting. Fast and right means you actually hear it.

## 2. What the evidence says
- **Tonal context helps.** Notes are heard better inside a key than in isolation (Graves & Oxenham, 2017). Listeners rank notes in a stable order: tonic, then the rest of the tonic chord (E, G in C), then other scale notes (Krumhansl & Kessler, 1982). That order is a good unlock order. *Strong.*
- **Relative pitch is the useful skill.** Perfect-pitch owners can do *worse* in another key (Miyazaki, 1993; 2004). *Some.*
- **Perfect pitch in adults:** after 32 h of training, 1 in 6 people reached real perfect-pitch level and most improved only modestly (Wong et al., 2020). Other studies saw adults learn roughly 7–9 of 12 notes after 12–40 h (reviewed by Van Hedger et al.). *Strong that it is slow and varies a lot from person to person.*
- **How you set up practice changes whether you learn at all.** Mixing practice blocks with blocks of just *listening* (no answering) gave learning where nonstop practice didn't (Little, Cheng & Wright, 2019). Sleep helps pitch learning stick (Gaab et al., 2004). *Some.*
- **Notes in between break your memory of the reference.** Notes heard after the reference blur your memory of it (Deutsch, 1970), so replay it often. *Strong.*
- **Timbre matters.** Naming is most accurate for real piano tones and least for pure sine tones (Miyazaki, 1989). *Some (perfect-pitch listeners).*
- **Singing:** Kodály/solfège training improved pitch accuracy in classrooms, but listening practice alone doesn't automatically fix singing. *Some.*
- **Interval "reference songs"** (e.g. a song for each interval) are common in teaching. Little direct evidence, and recalling the song is slow. A temporary crutch at best. *Weak.*

## 3. Practice modes to build

**A. Test mode — "Where am I"** (measures growth)
- Plays a short C–E–G–C arpeggio ("this is C"), then 10 mystery notes. The reference plays again every 3 notes. After each answer, the correct note plays; on a miss, your pick plays too, so you hear both side by side.
- Start with **C, E, G**. Then add one note at a time: **D, A, F, B**. A new note unlocks at ≥85% accuracy over the last 30 tries *and* median response time under ~2.5 s.
- Measure accuracy, **median response time** and a **confusion grid** (played vs answered). Show it as a plain chart over time.
- Targets: the whole skill. *Strong.*

**B. Twin notes** (confusion pairs)
- Two buttons only, built from your worst pair in the confusion grid (often E/F, B/C, D/E or A/B). After the reference, one of the two plays, 20 quick tries.
- Targets: mixing up notes that sit next to each other. Growth shows as that cell of the grid fading. *Some* (standard discrimination training).

**C. Pull home** (the job of each note)
- After the mystery note, you choose what it does: rest (C), lean up, or lean down. Then the app resolves it by walking to C (B→C, F→E, D→C), so you hear the pull.
- Targets: counting instead of hearing. Growth shows as faster answers in Mode A. *Some* (scale-degree pedagogy, Krumhansl).

**D. Sing it first**
- Mystery note plays, you hum it and then sing down to C, then tap the answer. No mic needed; the app just waits 3 s.
- Targets: getting the note into your voice and memory. *Some.*

**E. Listen-only round** (~30 s)
- Reference, then labelled notes ("E… G… B…"), no answering. Do it between Mode A blocks.
- Targets: getting a feel for new notes before you're tested on them. *Some* (Little et al., 2019).

**F. No crutch** (stops the app becoming a trick)
- Same as A, but the mystery note jumps octave and timbre (piano / soft organ / plucked). Sometimes an extra note plays between the reference and the mystery note, so you can't just hold the reference in your head.
- Targets: an answer that only works in one octave or one sound. *Some.*

## 4. Sound design notes (Web Audio)
- **Timbre:** not pure sine. Use 3–6 harmonics with a quick attack and an exponential decay (piano-ish), or a triangle wave through a lowpass filter. Use 2–3 timbres in Mode F.
- **Length:** reference arpeggio notes about 350 ms; mystery note about 1 s with a 0.6 s fade; 0.5–0.8 s gap.
- **Range:** start with C4–B4 (middle C upward), where voices sit comfortably. Mode F adds C3–B5.
- **Reference:** C–E–G–C (or the single C) at a fixed loudness. Play it again every 3 notes and after any miss. Add a "play again" button (no penalty). Tune to A4 = 440 Hz, equal temperament: `f = 440 * 2**((midi-69)/12)`.
- Vary loudness ±3 dB so loudness never gives the answer away.

## 5. Sources
- Graves & Oxenham, *Familiar Tonal Context Improves Accuracy of Pitch Interval Perception*, 2017 — https://www.frontiersin.org/articles/10.3389/fpsyg.2017.01753
- Krumhansl & Kessler, *Tracing the dynamic changes in perceived tonal organization…*, 1982 (Psychological Review); Krumhansl & Shepard, 1979 — https://link.springer.com/article/10.1007/BF00937134
- Miyazaki, *Absolute pitch as an inability: identification of musical intervals in a tonal context*, 1993 — https://www.human.niigata-u.ac.jp/~psy/miyazaki/Papers/MP93.html
- Miyazaki, *Recognition of transposed melodies by absolute-pitch possessors*, 2004 — https://www.human.niigata-u.ac.jp/~psy/miyazaki/Papers/Miyazaki2004.pdf
- Miyazaki, *Absolute pitch identification: effects of timbre and pitch region*, 1989 — https://www.human.niigata-u.ac.jp/~psy/miyazaki/Papers/MP89.html
- Wong, Lui, Yip & Wong, *Absolute pitch can be learned by some adults*, PLOS ONE 2020 — https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6759182/
- Van Hedger et al. (adult pitch-naming learning review), Psychonomic Bulletin & Review 2024 — https://link.springer.com/article/10.3758/s13423-024-02620-2
- Little, Cheng & Wright, *Inducing musical-interval learning by combining task practice with periods of stimulus exposure alone*, 2019 — https://pmc.ncbi.nlm.nih.gov/articles/PMC6384134
- Gaab et al., sleep and pitch-memory consolidation, 2004 (cited in) — https://pmc.ncbi.nlm.nih.gov/articles/PMC5829807
- Deutsch, *Tones and numbers: specificity of interference in immediate memory*, Science 1970
- Morantz, Kodály/singing and pitch accuracy (dissertation), 2016 — https://getd.libs.uga.edu/pdfs/morantz_cara_a_201608_edd.pdf
