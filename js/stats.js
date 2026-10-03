// Small number helpers shared by the play screen and History.
// Taps under MIN_MS are faster than a human reaction can be — almost always an
// accidental or anticipated tap — so they never count toward averages or bests.
export const MIN_MS = 80;

export const valid = times => (Array.isArray(times) ? times : []).filter(t => typeof t === 'number' && t >= MIN_MS);

export const mean = a => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);

const DAY = 24 * 60 * 60 * 1000;

/** Per-session numbers, oldest first. Sessions with no counted taps are left out. */
export function sessionRows(sessions) {
  return sessions
    .map(s => {
      const v = valid(s.times);
      return v.length ? { ...s, valid: v, avg: mean(v), best: Math.min(...v) } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.startedAt - b.startedAt);
}

/** Rolling mean of the last `n` session averages, one value per row. */
export function rolling(rows, n = 5) {
  return rows.map((_, i) => mean(rows.slice(Math.max(0, i - n + 1), i + 1).map(r => r.avg)));
}

export function summary(rows, now = Date.now()) {
  const all = rows.flatMap(r => r.valid);
  const inRange = (from, to) => rows.filter(r => r.startedAt >= from && r.startedAt < to).flatMap(r => r.valid);
  return {
    sessions: rows.length,
    taps: all.length,
    best: all.length ? Math.min(...all) : null,
    last7: mean(inRange(now - 7 * DAY, now + DAY)),
    prev7: mean(inRange(now - 14 * DAY, now - 7 * DAY)),
  };
}
