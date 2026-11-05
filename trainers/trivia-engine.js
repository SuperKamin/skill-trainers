// Trivia engine: forgiving answer matching + question picking. No DOM here.
// Matching (research/trivia.md §6): lowercase, no accents, no leading article,
// aliases in both languages, small typos allowed on longer words, ties = no match.

const ARTICLES = /^(the|a|an|o|a|os|as|um|uma)\s+/;

export function norm(s) {
  return String(s || '')
    .normalize('NFD').replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[’'`´]/g, '')
    .replace(/[^\p{L}\p{N}@#+.\-\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[.,\-]+$/, '')         // "Creeper." = "Creeper"
    .replace(ARTICLES, '')
    .replace(/^\.(?=\p{L})/u, '');   // ".mcfunction" = "mcfunction"
}

/** Optimal string alignment distance (Damerau–Levenshtein with adjacent swaps), capped. */
export function distance(a, b, cap = 3) {
  if (Math.abs(a.length - b.length) > cap) return cap + 1;
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    let rowMin = Infinity;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, d[i - 2][j - 2] + 1);
      d[i][j] = v;
      if (v < rowMin) rowMin = v;
    }
    if (rowMin > cap) return cap + 1;
  }
  return d[a.length][b.length];
}

// How many typos a word of this length may have: none for short ones (and numbers).
const allowed = s => (/^[\d\s.,\-+@#]+$/.test(s) ? 0 : s.length >= 9 ? 2 : s.length >= 5 ? 1 : 0);

/** Every accepted form of a question's answer: [{ shown, key }]. */
export function accepted(q) {
  const out = [];
  const add = (shown, raw = shown) => { const key = norm(raw); if (key && !out.some(o => o.key === key)) out.push({ shown, key }); };
  add(q.a.en); add(q.a.pt);
  for (const al of q.aliases || []) add(al);
  return out;
}

/**
 * Check a typed answer. Returns { ok, exact, counted } where `counted` is what it was taken as
 * (shown when it differs from what was typed, e.g. a typo or an alias).
 */
export function check(q, typed) {
  const t = norm(typed);
  if (!t) return { ok: false };
  const forms = accepted(q);
  const hit = forms.find(f => f.key === t);
  if (hit) return { ok: true, exact: true, counted: hit.shown };
  let best = null, bestD = Infinity;
  for (const f of forms) {
    const max = allowed(f.key);
    if (!max) continue;
    const dd = distance(t, f.key, max);
    if (dd <= max && dd < bestD) { best = f; bestD = dd; }
  }
  if (!best) return { ok: false };
  // A tie with a wrong answer is no match: if it's as close to a wrong choice, it isn't a typo.
  const wrongKeys = [...(q.wrong.en || []), ...(q.wrong.pt || [])].map(norm);
  if (wrongKeys.some(w => distance(t, w, bestD) <= bestD)) return { ok: false };
  return { ok: true, exact: false, counted: best.shown };
}

/** The 4 choices for "show choices", shuffled: the answer + 3 wrong, in the chosen language. */
export function choices(q, lang) {
  const right = lang === 'pt' ? q.a.pt : q.a.en;
  return shuffle([right, ...(q.wrong[lang] || q.wrong.en)]);
}

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * The order questions come in: never-seen ones first (shuffled), then the rest (shuffled).
 * `seen` = Set of "pack/id" already answered in past sessions; `levels` = which levels to include.
 */
export function makeDeck(packs, seen, levels = [1, 2, 3]) {
  const all = packs.flatMap(p => p.questions.filter(q => levels.includes(q.level || 2)).map(q => ({ pack: p, q, key: p.id + '/' + q.id })));
  const fresh = shuffle(all.filter(x => !seen.has(x.key)));
  const old = shuffle(all.filter(x => seen.has(x.key)));
  return [...fresh, ...old];
}
