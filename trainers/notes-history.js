// Notes History: where you are (unlocks), how it's moving (accuracy + answer time per test
// session), and which notes you mix up (the grid Twin notes is built from).
import { NAMES, ORDER, WINDOW, NEED_ACC, NEED_MS, progress, confusion, sessionRows } from './notes-logic.js';

const dayFmt = new Intl.DateTimeFormat(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
const shortDay = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' });
const timeFmt = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' });
const pct = v => (v == null ? '–' : Math.round(v * 100) + '%');
const sec = v => (v == null ? '–' : (v / 1000).toFixed(1) + ' s');
const MODE = { test: 'Test', easy: 'Easy', twin: 'Twin', listen: 'Listen' };

export function renderNotesHistory(el, sessions, source) {
  const rows = sessionRows(sessions);
  const tests = rows.filter(r => r.mode === 'test' && !r.practice);
  const p = progress(sessions);
  const pe = progress(sessions, 'easy');
  const easyPlayed = rows.some(r => r.mode === 'easy');

  if (!rows.length) {
    el.innerHTML = `
      <p class="empty">Nothing here yet. Play a little of Notes and it shows up here.</p>
      <p class="fine">${source}</p>`;
    return () => {};
  }

  const g = confusion(sessions);
  const heard = NAMES.filter(n => NAMES.some(m => g[n][m] > 0));
  const unlockLine = p.next
    ? `Next note: <b>${p.next}</b>. It unlocks at ${Math.round(NEED_ACC * 100)}% right and under ${NEED_MS / 1000} s over your last ${WINDOW} test answers. Right now: <b>${pct(p.acc)}</b> · <b>${sec(p.med)}</b> (${p.window} of ${WINDOW} answers).`
    : 'All seven notes are unlocked.';

  el.innerHTML = `
    <section class="nt-unlocks" aria-label="Notes unlocked">
      ${ORDER.map((n, i) => `<span class="${i < p.count ? 'on' : ''}">${n}</span>`).join('')}
    </section>
    <p class="week">${unlockLine}</p>
    ${easyPlayed ? `<p class="week">Easy: <b>${pe.unlocked.join(' ')}</b>${pe.next ? ` · next is ${pe.next} at 8 of the last 10 right` : ' · all seven'}.</p>` : ''}

    ${tests.length ? `
    <section class="card chart-card">
      <div class="chart" data-acc role="img" aria-label="Percent right per test session"></div>
    </section>
    <section class="card chart-card" style="margin-top:0.8rem">
      <div class="chart" data-ms role="img" aria-label="Median answer time per test session, faster is higher"></div>
    </section>` : ''}

    ${heard.length ? `
    <h2 class="sub">What you mix up</h2>
    <div class="grid-wrap">
      <table class="conf">
        <thead><tr><th class="label">played ↓ · you said →</th>${NAMES.map(n => `<th>${n}</th>`).join('')}</tr></thead>
        <tbody>
          ${heard.map(n => {
            const tot = NAMES.reduce((s, m) => s + g[n][m], 0) || 1;
            return `<tr><th>${n}</th>${NAMES.map(m => {
              const v = g[n][m], share = v / tot;
              const cls = !v ? '' : m === n ? 'hit' : 'miss';
              return `<td class="${cls}" style="--a:${(0.15 + share * 0.85).toFixed(2)}">${v || ''}</td>`;
            }).join('')}</tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
    <p class="fine">Each row is a note that played; the numbers are what you answered. Yellow off the diagonal is a mix-up, and Twin notes starts on your biggest one.</p>` : ''}

    <section class="sessions">
      <div class="sess-row sess-head label"><span>When</span><span>Mode</span><span>Notes</span><span>Right</span><span>Time</span></div>
      <ol>
        ${rows.slice().reverse().map(r => `
          <li class="sess-row">
            <span class="when">${dayFmt.format(r.startedAt)}<small>${timeFmt.format(r.startedAt)} · ${r.device === 'phone' ? 'phone' : 'PC'}</small></span>
            <span>${MODE[r.mode] || r.mode}</span>
            <span class="num">${r.n}</span>
            <span class="num">${r.mode === 'listen' ? '' : r.practice ? 'practice' : pct(r.acc)}</span>
            <span class="num">${r.mode === 'listen' || r.practice ? '' : sec(r.med)}</span>
          </li>`).join('')}
      </ol>
    </section>
    <p class="fine">${source} Time is the middle answer time: fast and right usually means you're hearing it, not counting.</p>`;

  const accBox = el.querySelector('[data-acc]');
  const msBox = el.querySelector('[data-ms]');
  const draw = () => {
    if (accBox) accBox.innerHTML = lineChart(tests, r => r.acc * 100, accBox.clientWidth || 340,
      { cap: '% right ↑', lo: 0, hi: 100, fmt: v => v + '%' });
    if (msBox) msBox.innerHTML = lineChart(tests, r => r.med / 1000, msBox.clientWidth || 340,
      { cap: 'answer time · faster ↑', invert: true, fmt: v => v + ' s', step: 0.5 });
  };
  draw();
  return draw;
}

function lineChart(rows, val, W, { cap, lo, hi, invert = false, fmt, step }) {
  const H = W < 520 ? 170 : 210;
  const m = { l: 44, r: 12, t: 24, b: 26 };
  const iw = W - m.l - m.r, ih = H - m.t - m.b;
  const vals = rows.map(val);
  let y0 = lo ?? Math.max(0, Math.floor(Math.min(...vals) / step) * step - step);
  let y1 = hi ?? Math.ceil(Math.max(...vals) / step) * step + step;
  if (y1 - y0 < 1e-9) y1 = y0 + 1;
  const st = step ?? 25;
  const y = v => invert ? m.t + ((v - y0) / (y1 - y0)) * ih : m.t + ih - ((v - y0) / (y1 - y0)) * ih;

  let t0 = rows[0].startedAt, t1 = rows[rows.length - 1].startedAt;
  if (t1 - t0 < 3600e3) { t0 -= 12 * 3600e3; t1 += 12 * 3600e3; } else { const p = (t1 - t0) * 0.04; t0 -= p; t1 += p; }
  const x = t => m.l + ((t - t0) / (t1 - t0)) * iw;

  const out = [`<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">`,
    `<text class="ax-cap" x="${m.l}" y="13">${cap}</text>`];
  for (let v = y0; v <= y1 + 1e-9; v += st) {
    const yy = y(v).toFixed(1), label = Math.round(v * 10) / 10;
    out.push(`<line class="grid" x1="${m.l}" x2="${W - m.r}" y1="${yy}" y2="${yy}"/>`);
    out.push(`<text class="ax" x="${m.l - 6}" y="${yy}" dy="0.32em" text-anchor="end">${fmt(label)}</text>`);
  }
  const n = W < 520 ? 3 : 5, f = t1 - t0 < 26 * 3600e3 ? timeFmt : shortDay;
  for (let i = 0; i < n; i++) {
    const t = t0 + ((i + 0.5) / n) * (t1 - t0);
    out.push(`<text class="ax" x="${x(t).toFixed(1)}" y="${H - 7}" text-anchor="middle">${f.format(t)}</text>`);
  }
  if (rows.length >= 2) {
    out.push(`<polyline class="trend" points="${rows.map((r, i) => `${x(r.startedAt).toFixed(1)},${y(vals[i]).toFixed(1)}`).join(' ')}"/>`);
  }
  rows.forEach((r, i) => out.push(`<circle class="avg" cx="${x(r.startedAt).toFixed(1)}" cy="${y(vals[i]).toFixed(1)}" r="3.8"><title>${dayFmt.format(r.startedAt)} · ${pct(r.acc)} right · ${sec(r.med)} · ${r.n} notes</title></circle>`));
  out.push('</svg>');
  return out.join('');
}
