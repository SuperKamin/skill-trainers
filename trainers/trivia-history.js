// Trivia History: what moved this week, kept / coming back / learning, per pack, the surprises, every session.
// "Here's what moved", told plainly: no points, no streaks (plans/trivia-packs-mix.md, stage 4).
import { PACKS, packById } from './packs/trivia-index.js';
import { buildMemory, dueList, rightDays, KEEP } from './trivia-memory.js';

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const dayFmt = new Intl.DateTimeFormat(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
const timeFmt = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' });

export function renderTriviaHistory(el, sessions, source) {
  const list = sessions.filter(s => (s.answers || []).length).sort((a, b) => a.startedAt - b.startedAt);
  const all = list.flatMap(s => s.answers.filter(a => a && a.pack));
  if (!all.length) {
    el.innerHTML = `<p class="empty">Nothing here yet. Answer a few questions and they show up here.</p><p class="fine">${source}</p>`;
    return () => {};
  }
  const memory = all.filter(a => a.ok && a.via === 'typed').length;
  const fromChoices = all.filter(a => a.ok && a.via === 'choices').length;

  // Coming back + kept, from the same answers.
  const mem = buildMemory(list);
  const recs = [...mem.values()].filter(r => packById(r.pack));
  const kept = recs.filter(r => r.kept).sort((a, b) => b.keptAt - a.keptAt);
  const learning = recs.filter(r => r.missed && !r.kept);
  const due = dueList(mem).filter(r => packById(r.pack));
  const qOf = r => { const p = packById(r.pack); return p && p.questions.find(x => x.id === r.id); };
  const lastLang = new Map(all.map(a => [a.pack + '/' + a.id, a.lang === 'pt' ? 'pt' : 'en']));

  // This week vs the week before (last 7 days / the 7 before), from memory.
  const now = Date.now(), WEEK = 7 * 24 * 60 * 60 * 1000;
  const inRange = (a, from, to) => { const t = a.at || 0; return t > now - from && t <= now - to; };
  const wk = all.filter(a => inRange(a, WEEK, 0)), prev = all.filter(a => inRange(a, 2 * WEEK, WEEK));
  const memOf = xs => xs.filter(a => a.ok && a.via === 'typed').length;
  const keptWeek = kept.filter(r => r.keptAt > now - WEEK).length;
  const weekLine = wk.length || prev.length
    ? `<p class="week">Last 7 days: <b>${memOf(wk)}</b> of ${wk.length} from memory${keptWeek ? `, <b>${keptWeek}</b> newly kept` : ''} · week before: <b>${memOf(prev)}</b> of ${prev.length}</p>`
    : '';
  const item = r => { const q = qOf(r); if (!q) return ''; const l = lastLang.get(r.key) || 'en';
    return `<li><span>${esc(q.q[l])}</span><b>${esc(q.a[l])}</b></li>`; };

  const perPack = PACKS.filter(p => !p.coming).map(p => {
    const mine = all.filter(a => a.pack === p.id);
    if (!mine.length) return '';
    const ids = new Set(mine.map(a => a.id));
    const mem = mine.filter(a => a.ok && a.via === 'typed').length;
    return `<li><b>${esc(p.title.en)}</b><span>${ids.size} of ${p.questions.length} seen · ${mem} of ${mine.length} from memory</span></li>`;
  }).join('');

  // Surprises: sure but wrong (the ones that stick best). Newest first, each question once.
  const shown = new Set();
  const surprises = all.slice().reverse().filter(a => {
    const k = a.pack + '/' + a.id;
    if (a.ok || a.sure !== 'sure' || shown.has(k)) return false;
    shown.add(k); return true;
  }).slice(0, 8).map(a => {
    const p = packById(a.pack), q = p && p.questions.find(x => x.id === a.id);
    if (!q) return '';
    const l = a.lang === 'pt' ? 'pt' : 'en';
    return `<li><span>${esc(q.q[l])}</span><b>${esc(q.a[l])}</b></li>`;
  }).join('');

  el.innerHTML = `
    <section class="tiles">
      <div class="tile"><span class="label">Answered</span><b>${all.length}</b></div>
      <div class="tile"><span class="label">From memory</span><b>${memory}</b></div>
      <div class="tile"><span class="label">With choices</span><b>${fromChoices}</b></div>
    </section>
    <section class="tiles">
      <div class="tile"><span class="label">Kept</span><b>${kept.length}</b></div>
      <div class="tile"><span class="label">Learning</span><b>${learning.length}</b></div>
      <div class="tile"><span class="label">Back today</span><b>${due.length}</b></div>
    </section>
    ${weekLine}
    <p class="fine">A missed question comes back the next day, then after 3 days, then a week. Right from memory on ${KEEP} different days = kept.</p>
    <ul class="tv-hist">${perPack}</ul>
    ${kept.length ? `<h2 class="tv-hist-h label">Kept (newest first)</h2><ul class="tv-hist tv-surprise">${kept.slice(0, 8).map(item).join('')}</ul>` : ''}
    ${learning.length ? `<h2 class="tv-hist-h label">Learning</h2><ul class="tv-hist">${learning.sort((a, b) => rightDays(b) - rightDays(a)).slice(0, 8).map(r => {
      const q = qOf(r); if (!q) return ''; const l = lastLang.get(r.key) || 'en';
      return `<li><b>${esc(q.q[l])}</b><span>${rightDays(r)} of ${KEEP} days · ${esc(q.a[l])}</span></li>`; }).join('')}</ul>` : ''}
    ${surprises ? `<h2 class="tv-hist-h label">Surprises (you were sure)</h2><ul class="tv-hist tv-surprise">${surprises}</ul>` : ''}
    <section class="sessions">
      <div class="sess-row sess-head label"><span>When</span><span>Device</span><span>Asked</span><span>Memory</span><span>Choices</span></div>
      <ol>
        ${list.slice().reverse().map(s => {
          const a = s.answers.filter(x => x && x.pack);
          return `
          <li class="sess-row">
            <span class="when">${dayFmt.format(s.startedAt)}<small>${timeFmt.format(s.startedAt)}</small></span>
            <span>${s.device === 'phone' ? 'phone' : 'PC'}</span>
            <span class="num">${a.length}</span>
            <span class="num">${a.filter(x => x.ok && x.via === 'typed').length}</span>
            <span class="num">${a.filter(x => x.ok && x.via === 'choices').length}</span>
          </li>`;
        }).join('')}
      </ol>
    </section>
    <p class="fine">${source}</p>`;
  return () => {};
}
