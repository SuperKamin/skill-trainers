// Notes trainer: the music facts and the numbers, shared by the game and its History.
// Research behind every choice here: research/notes.md

export const NAMES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
export const SEMI = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

// Unlock order follows how strongly each note belongs to the key of C (Krumhansl):
// home, then the rest of the C chord, then the other scale notes.
export const ORDER = ['C', 'E', 'G', 'D', 'A', 'F', 'B'];
export const START = 3;

// A new note unlocks at >= 85% right over the last 30 test answers
// AND a median answer time under 2.5 s (right but slow usually means counting, not hearing).
export const WINDOW = 30;
export const NEED_ACC = 0.85;
export const NEED_MS = 2500;

// Neighbour pairs: the ones people mix up most.
export const PAIRS = [['E', 'F'], ['B', 'C'], ['D', 'E'], ['A', 'B'], ['F', 'G'], ['G', 'A'], ['C', 'D']];

export const median = a => {
  if (!a.length) return null;
  const s = [...a].sort((x, y) => x - y), m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

const byTime = sessions => [...sessions].sort((a, b) => a.startedAt - b.startedAt);
const answersOf = (sessions, mode) =>
  byTime(sessions).filter(s => (s.mode || 'test') === mode).flatMap(s => Array.isArray(s.answers) ? s.answers : []);

/**
 * Walk every test answer in order and work out how many notes are unlocked now.
 * Returns { count, unlocked: [...names], window: answers since the last unlock, acc, med }.
 */
export function progress(sessions) {
  let count = START, win = [];
  for (const a of answersOf(sessions, 'test')) {
    win.push(a);
    if (count < ORDER.length && win.length >= WINDOW) {
      const last = win.slice(-WINDOW);
      const acc = last.filter(x => x.ok).length / last.length;
      const med = median(last.map(x => x.ms));
      if (acc >= NEED_ACC && med <= NEED_MS) { count += 1; win = []; }
    }
  }
  const last = win.slice(-WINDOW);
  return {
    count,
    unlocked: ORDER.slice(0, count),
    next: ORDER[count] || null,
    window: last.length,
    acc: last.length ? last.filter(x => x.ok).length / last.length : null,
    med: median(last.map(x => x.ms)),
  };
}

/** Confusion counts from test + twin answers: grid[played][answered]. */
export function confusion(sessions) {
  const grid = {};
  for (const n of NAMES) { grid[n] = {}; for (const m of NAMES) grid[n][m] = 0; }
  for (const mode of ['test', 'twin']) {
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
    return {
      ...s, mode, n: ans.length,
      acc: ans.filter(a => a.ok).length / ans.length,
      med: median(ans.map(a => a.ms)),
    };
  }).filter(Boolean);
}
