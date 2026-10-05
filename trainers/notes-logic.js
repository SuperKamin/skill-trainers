// Notes trainer: the music facts and the numbers, shared by the game and its History.
// Research behind every choice here: research/notes.md

export const NAMES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
export const SEMI = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

// Unlock order follows how strongly each note belongs to the key of C (Krumhansl):
// home, then the rest of the C chord, then the other scale notes.
export const ORDER = ['C', 'E', 'G', 'D', 'A', 'F', 'B'];
export const START = 3;
// Easy (Leo, 04/10): start with the two notes that feel most different, then the C chord, then the rest.
export const EASY_ORDER = ['C', 'G', 'E', 'D', 'A', 'F', 'B'];

// A new note unlocks at >= 85% right over the last 30 test answers
// AND a median answer time under 2.5 s (right but slow usually means counting, not hearing).
export const WINDOW = 30;
export const NEED_ACC = 0.85;
export const NEED_MS = 2500;

// Unlock rules per mode. Easy: 8 of the last 10 right, no time limit.
export const RULES = {
  test: { order: ORDER, start: START, window: WINDOW, acc: NEED_ACC, ms: NEED_MS },
  easy: { order: EASY_ORDER, start: 2, window: 10, acc: 0.8, ms: Infinity },
};

// Neighbour pairs: the ones people mix up most.
export const PAIRS = [['E', 'F'], ['B', 'C'], ['D', 'E'], ['A', 'B'], ['F', 'G'], ['G', 'A'], ['C', 'D']];

export const median = a => {
  if (!a.length) return null;
  const s = [...a].sort((x, y) => x - y), m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

const byTime = sessions => [...sessions].sort((a, b) => a.startedAt - b.startedAt);
// Answers marked p (played after "Hear them all" in the Test) are practice: they never count.
const answersOf = (sessions, mode) =>
  byTime(sessions).filter(s => (s.mode || 'test') === mode)
    .flatMap(s => Array.isArray(s.answers) ? s.answers : []).filter(a => !a.p);

/**
 * Walk every test answer in order and work out how many notes are unlocked now.
 * Returns { count, unlocked: [...names], window: answers since the last unlock, acc, med }.
 */
export function progress(sessions, mode = 'test') {
  const R = RULES[mode] || RULES.test;
  let count = R.start, win = [];
  for (const a of answersOf(sessions, mode)) {
    win.push(a);
    if (count < R.order.length && win.length >= R.window) {
      const last = win.slice(-R.window);
      const acc = last.filter(x => x.ok).length / last.length;
      const med = median(last.map(x => x.ms));
      if (acc >= R.acc && med <= R.ms) { count += 1; win = []; }
    }
  }
  const last = win.slice(-R.window);
  return {
    count,
    unlocked: R.order.slice(0, count),
    next: R.order[count] || null,
    window: last.length,
    acc: last.length ? last.filter(x => x.ok).length / last.length : null,
    med: median(last.map(x => x.ms)),
  };
}

/** Confusion counts from test + twin answers: grid[played][answered]. */
export function confusion(sessions) {
  const grid = {};
  for (const n of NAMES) { grid[n] = {}; for (const m of NAMES) grid[n][m] = 0; }
  for (const mode of ['test', 'easy', 'twin']) {
    for (const a of answersOf(sessions, mode)) if (grid[a.t] && a.a in grid[a.t]) grid[a.t][a.a] += 1;
  }
  return grid;
}

/** The neighbour pair mixed up most often (both directions), among notes he has heard in tests. */
export function worstPair(sessions, unlocked) {
  const g = confusion(sessions);
  let best = null, score = 0;
  for (const [x, y] of PAIRS) {
    const s = g[x][y] + g[y][x];
    if (s > score) { score = s; best = [x, y]; }
  }
  if (best) return best;
  // No mix-ups yet: the hardest neighbour pair he can already reach.
  return PAIRS.find(([x, y]) => unlocked.includes(x) && unlocked.includes(y)) || ['E', 'F'];
}

/** Per-session numbers for History, oldest first. */
export function sessionRows(sessions) {
  return byTime(sessions).map(s => {
    const ans = Array.isArray(s.answers) ? s.answers : [];
    const mode = s.mode || 'test';
    if (mode === 'listen') return s.heard ? { ...s, mode, n: s.heard } : null;
    if (!ans.length) return null;
    const counted = ans.filter(a => !a.p);
    if (!counted.length) return { ...s, mode, n: ans.length, practice: true, acc: null, med: null };
    return {
      ...s, mode, n: counted.length,
      acc: counted.filter(a => a.ok).length / counted.length,
      med: median(counted.map(a => a.ms)),
    };
  }).filter(Boolean);
}
