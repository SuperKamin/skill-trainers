# Trivia / general knowledge: research (05/11)

Leo's ask: get better at **general knowledge**; topic **packs** + a mode that **mixes chosen packs**; a **niche-answer mode** (rarer right answers count for more, an idea taken from the game Krillion); good research on what actually makes people good at this; and things **beyond the game** that make him better.

Strength marks: **strong** (many studies) · **moderate** (a few good ones) · **weak** · **anecdote** (what players say).

## 1. Is it just memory? No, it's two things
- **Breadth: how much you have ever met.** It grows only from *new input*: reading, listening, rabbit holes.
  - Reading predicts knowledge even after ability is accounted for (Stanovich & Cunningham 1993). **Moderate.**
  - What you already know is a hook for new facts (Recht & Leslie 1988, the baseball study; Witherby & Carpenter 2022, "rich get richer"). **Strong.** New facts stick best when they hang off Minecraft, Godot, D&D, music.
  - When you're curious, the answer sticks better, and so do things shown nearby (Gruber, Gelman & Ranganath 2014). **Moderate–strong.**
- **Keeping: how much of it you can still pull out.**
  - **Pulling it out beats re-reading** (testing effect; Roediger & Karpicke 2006; Dunlosky et al. 2013). **Strong.**
  - **Spread over days** beats cramming (Cepeda et al. 2006, 2008). **Strong.**
  - **Successive relearning:** get it right once, then again on later days (Rawson & Dunlosky 2011, 2022). **Strong.**
  - **Sure but wrong sticks best when corrected** (hypercorrection; Butterfield & Metcalfe 2001; Metcalfe 2017). **Strong.** It works through *surprise*, so the moment should feel like "huh, really?", not a red X.
  - **Guessing first helps, even a wrong guess**, if the answer comes right after (Kornell, Hays & Bjork 2009; Grimaldi & Karpicke 2012). **Moderate–strong.**
  - **Producing beats recognising** (generation effect; Slamecka & Graf 1978). **Strong.** Typed or spoken answers beat multiple choice.
  - **Asking "why"** and linking the fact to something you know helps (Dunlosky 2013). **Moderate.**
  - Mixing topics (interleaving): for loose facts the evidence is **weak**. It's fine for variety, but don't expect much from it.
- Drilling a fixed question set only improves *keeping*. Breadth needs new material.

## 2. How top quiz players train (all anecdote; no studies found)
- **Quizbowl:** players read old question packets, put the clues they missed on flashcards (Anki), and review them regularly. They go from easy sets to harder ones.
- **Ken Jennings:** years of quizbowl, plus broad reading, plus a month of flashcards on common categories, plus mock games.
- **James Holzhauer:** read **children's non-fiction**: clear, checked, an easy way into dull subjects. Pop culture and news were harder to cover that way.
- The pattern every player shares is three things together: **wide easy exposure → cards with spaced recall for misses → lots of play**. Nobody relies on drilling alone.

## 3. Beyond the game (habits away from the app)
- **Listening counts as much as reading** for non-fiction: same understanding now and two weeks later (Rogowsky, Calhoun & Tallal 2016). **Moderate.** For Leo, podcasts and audiobooks are a real main route, not a second-best. A kid- or teen-level science or history podcast is the audio version of Holzhauer's method.
- **Chase a surprising miss** for 5 minutes. Curiosity, the guess-first effect and hypercorrection all add up here. **Moderate** (inferred from those studies).
- **Rabbit holes** while curious: side facts stick too (Gruber). That they build general knowledge is **anecdote**.
- **Tell it to someone** (dad, Nate): learning to teach and explaining out loud help (Fiorella & Mayer 2013/14). **Moderate.**
- **Hook facts to his interests:** redstone → logic gates → George Boole; D&D monsters → Greek myth; Godot → the history of game engines. **Strong in principle.**
- This becomes a new step in the recipe for *every* trainer: **things to do away from the app**.

## 4. Modes, methods, principles (suggested)
**Leo's own modes:**
- **Packs + Mix:** tick the packs you want; questions get pooled and shuffled.
- **Niche answers:** an open category, a closed list of valid answers, each with a rarity; rarer valid answers count for more.

**From the research:**
1. **Guess first:** say or type a guess, tap *sure / maybe / no idea*, then get the answer plus one short story or hook. A sure-but-wrong answer is shown as a twist.
2. **Coming back:** missed facts return, reworded, after ~1 day, ~3 days and ~1 week. A fact counts as *kept* after three right answers on three different days.
3. **Clue ladder:** clues go from hard to easy; answer as soon as you know. You almost always get there by the end, so growth shows as getting it on an earlier clue.
4. Later: **Rabbit hole chain** (each answer opens a nearby topic, starting from his interests) and **Tell it back** (explain one fact out loud in 30 s).

Pogo's thought: Guess first and Coming back could be *how every pack plays*, not separate screens.

**Methods (tips he carries anywhere):** guess out loud before you look · say how sure you are · ask why, once · hook it to something you know · chase one surprise for 5 minutes · tell one thing to someone today.

**Principles (built into every mode):**
- A miss opens a story, never a red X.
- Recall (typed or spoken) over multiple choice where possible.
- A fact counts only when it comes back on another day, in other words.
- The pool keeps getting new material.
- No streaks or guilt.

**Open, Leo's call:** the niche mode is naturally scored. How should rarity show (points, depth, tiers)? The app's rule so far is "no points", but this is his design.

## 5. Real growth vs getting good at the app
- **Monthly outside check:** about 30 questions from a pool training never uses. Rising scores here = general knowledge growing.
- **Reworded, delayed checks** on kept facts.
- **Spillover:** compare categories he trains or listens about with ones he never touches. That also gives a rough baseline for what school and ordinary life add.
- Track by month, shown as "here's what moved".

## 6. Building it: niche answers and where questions come from
**How a solo app knows what's niche, without surveying 100 people:**
- Krillion does it with curated lists and rarity tiers, not a live vote (according to secondary guides).
- For us: **lists generated once, at build time**, from **Wikidata** (CC0 = free to use; English + Portuguese names and aliases included). Each answer's rarity comes from its **sitelink count** (how many language Wikipedias have the article). Optionally blend in Wikipedia page views, then hand-tune.
- Ship it as plain JSON, so scoring runs fully offline. CORS works on both APIs (checked), but they are only used by the build script.
- Game content (Minecraft mobs, etc.) needs hand-made lists, since Wikidata covers it badly.
- **Personal layer:** a bonus for a right answer you've never given before (from his history).
- At the end, show **every answer you missed**. That's the learning part.

**Matching typed answers:**
- lowercase, drop accents (São Tomé = sao tome), drop leading the / o / a / os / as;
- check an alias map (en + pt);
- typos: 1 letter off for 5–8-letter words, 2 for longer, never for short words; reject ties;
- always show what it counted as ("counted as: Taleggio").

**Question sources for packs:**

| Source | Licence | Use? |
|---|---|---|
| Wikidata-generated questions (capitals, elements…) | CC0 | **Yes, best.** en + pt |
| Open Trivia DB / OpenTriviaQA | CC BY-SA 4.0 | Yes, with credit; keep in separate pack files marked BY-SA. English only |
| The Trivia API | CC BY-NC 4.0 | Only while the app stays free; pt is paid |
| Quizbowl packet archives | no open licence | No (link out at most) |
| TV shows, Krillion, Sporcle | copyrighted | **No** |
| Our own / Leo's / dad's writing | ours | Yes. Best for games, music, Brazil |

No openly licensed **Portuguese** trivia set exists. Portuguese comes from Wikidata, our own writing, or our translations (BY-SA ones stay BY-SA).

**Not copied from Krillion:** the name, tier names, look or content. Only the general mechanic is used (open category + valid list + rarity).

## Sources
Learning science:
- Gruber et al. 2014 https://pmc.ncbi.nlm.nih.gov/articles/PMC4252494/
- Hambrick et al. 2007 https://link.springer.com/content/pdf/10.3758/BF03193451.pdf
- Roediger & Karpicke 2006 https://doi.org/10.1111/j.1467-9280.2006.01693.x
- Cepeda et al. 2006 https://doi.org/10.1037/0033-2909.132.3.354
- Cepeda et al. 2008 https://doi.org/10.1111/j.1467-9280.2008.02209.x
- Rawson & Dunlosky 2011 https://doi.org/10.1037/a0023956
- Rawson & Dunlosky 2022 https://doi.org/10.1177/09637214221100484
- Dunlosky et al. 2013 https://doi.org/10.1177/1529100612453266
- Metcalfe & Finn 2011 https://pmc.ncbi.nlm.nih.gov/articles/PMC3079415
- Kornell et al. 2009 https://pubmed.ncbi.nlm.nih.gov/19586265/
- Grimaldi & Karpicke 2012 https://learninglab.psych.purdue.edu/downloads/2012/2012_Grimaldi_Karpicke_MC.pdf
- Witherby & Carpenter 2022 https://doi.org/10.1037/xlm0000996
- Fiorella & Mayer 2013 https://doi.org/10.1016/j.cedpsych.2013.06.001
- Rogowsky et al. 2016 https://journals.sagepub.com/doi/10.1177/2158244016669550
- Stanovich & Cunningham 1993, Recht & Leslie 1988, Slamecka & Graf 1978 (journal citations)
- *Some DOIs cited from memory; check before quoting.*

Quiz players:
- QBWiki carding https://www.qbwiki.com/wiki/How_to_flashcard
- QBWiki packet study https://www.qbwiki.com/wiki/Packet_study
- Holzhauer https://publishersweekly.com/pw/by-topic/childrens/childrens-industry-news/article/79918-jeopardy-star-james-holzhauer-on-his-children-s-book-strategy.html
- Jennings https://ken-jennings.com/about

Building:
- Krillion guide https://aiidelist.com/blog/krillion-game-guide-how-to-play-rare-answers
- Wikimedia rate limits https://www.mediawiki.org/wiki/Wikimedia_APIs/Rate_limits
- Wikidata Query Service https://www.mediawiki.org/wiki/Wikidata_Query_Service/User_Manual
- Open Trivia DB https://opentdb.com/api_config.php
- The Trivia API https://the-trivia-api.com/
- QBWiki copyright https://qbwiki.com/wiki/Copyright
