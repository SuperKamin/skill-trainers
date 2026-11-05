// Trivia memory: "Coming back" + "kept" (plan stage 4, research/trivia.md: successive relearning + spacing).
// Built from the answers already saved in sessions: no extra data is stored. Each answer has
// { pack, id, ok, via ('typed' | 'choices' | 'dunno'), sure, ms, lang, at }.
//
// Rules (Leo's plan, 05/11):
//  - A question you missed (wrong, from the choices, or "no idea") comes back about 1 day later.
//  - Each time it's right from memory on a new day it waits longer: 3 days, then 7 days.
//  - Right from memory on 3 different days = kept. A miss after that starts it over (calmly).
//  - Questions right from memory the first time are "known" and don't come back on their own.

const DAY = 24 * 60 * 60 * 1000;
const GAPS = [1, 3, 7];      // days until it comes back, after 0 / 1 / 2 right days
const KEEP = 3;              // right from memory on this many different days = kept

export const dayKey = t => { const d = new Date(t); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); };
const startOfDay = t => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
const good = a => a.ok && a.via === 'typed';

/** One question's record, updated by one answer. Returns what changed ('kept' | 'missed' | 'step' | 'known' | ''). */
export function apply(mem, a) {
  if (!a || !a.pack || !a.id) return '';
  const key = a.pack + '/' + a.id;
  const at = a.at || 0;
  const r = mem.get(key) || { key, pack: a.pack, id: a.id, seen: 0, missed: false, days: [], due: 0, kept: false, keptAt: 0, last: 0 };
  mem.set(key, r);
  r.seen++; r.last = Math.max(r.last, at);
  if (!good(a)) {
    r.missed = true; r.days = []; r.kept = false; r.keptAt = 0;
    r.due = startOfDay(at) + GAPS[0] * DAY;
    return 'missed';
  }
  if (!r.missed) return r.seen === 1 ? 'known' : '';
  if (r.kept) return '';
  const day = dayKey(at);
  if (!r.days.includes(day)) r.days.push(day);
  if (r.days.length >= KEEP) { r.kept = true; r.keptAt = at; r.due = 0; return 'kept'; }
  r.due = startOfDay(at) + GAPS[r.days.length] * DAY;
  return 'step';
}

/** Memory from past sessions (oldest answer first). */
export function buildMemory(sessions) {
  const all = sessions.flatMap(s => (s.answers || []).filter(a => a && a.pack && a.id)
    .map(a => ({ ...a, at: a.at || s.startedAt || 0 })));
  all.sort((x, y) => x.at - y.at);
  const mem = new Map();
  for (const a of all) apply(mem, a);
  return mem;
}

export const isDue = (r, now = Date.now()) => r.missed && !r.kept && r.due && r.due <= now;
export const dueList = (mem, now = Date.now()) => [...mem.values()].filter(r => isDue(r, now)).sort((a, b) => a.due - b.due);
export const rightDays = r => r.days.length;
export { KEEP };
