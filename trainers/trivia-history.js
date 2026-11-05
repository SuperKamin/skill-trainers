// Trivia History (stage 1, simple): plain numbers per pack, the surprises, every session.
// Stage 4 adds "kept" / "coming back" (plans/trivia-packs-mix.md).
import { PACKS, packById } from './packs/trivia-index.js';

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
    <ul class="tv-hist">${perPack}</ul>
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
