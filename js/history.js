// History view: progress graph, a few plain numbers, and every session, newest first.
import { MIN_MS, sessionRows, rolling, summary } from './stats.js';

const fmtMs = v => (v == null ? '–' : Math.round(v) + ' ms');
const dayFmt = new Intl.DateTimeFormat(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
const shortDay = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' });
const timeFmt = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' });

/**
 * Draw the History page into `el`. Returns a redraw function (for resizes).
 * `source` is a short plain line about where the data comes from.
 */
export function renderHistory(el, trainer, sessions, source) {
  const rows = sessionRows(sessions);
  const sum = summary(rows);

  if (!rows.length) {
    el.innerHTML = `
      <p class="empty">Nothing here yet. Play a few taps of ${trainer.name} and they show up here.</p>
      <p class="fine">${source}</p>`;
    return () => {};
  }

  el.innerHTML = `
    <section class="card chart-card">
      <div class="chart" role="img" aria-label="Session averages over time. Higher on the graph means faster."></div>
      <div class="legend">
        <span><i class="lg-avg"></i>session average</span>
        <span><i class="lg-best"></i>session best</span>
        <span><i class="lg-trend"></i>trend (last 5 sessions)</span>
      </div>
    </section>

    <section class="tiles">
      <div class="tile"><span class="label">Best ever</span><b>${fmtMs(sum.best)}</b></div>
      <div class="tile"><span class="label">Sessions</span><b>${sum.sessions}</b></div>
      <div class="tile"><span class="label">Taps</span><b>${sum.taps}</b></div>
    </section>
    <p class="week">Last 7 days: <b>${fmtMs(sum.last7)}</b> · week before: <b>${fmtMs(sum.prev7)}</b></p>

    <section class="sessions">
      <div class="sess-row sess-head label"><span>When</span><span>Device</span><span>Taps</span><span>Avg</span><span>Best</span></div>
      <ol>
        ${rows.slice().reverse().map(r => `
          <li class="sess-row">
            <span class="when">${dayFmt.format(r.startedAt)}<small>${timeFmt.format(r.startedAt)}</small></span>
            <span>${r.device === 'phone' ? 'phone' : 'PC'}</span>
            <span class="num">${r.valid.length}</span>
            <span class="num">${Math.round(r.avg)}</span>
            <span class="num">${r.best}</span>
          </li>`).join('')}
      </ol>
    </section>
    <p class="fine">${source} Taps under ${MIN_MS} ms are left out of every number: that is quicker than a reaction can be, so it was almost surely an accidental tap.</p>`;

  const box = el.querySelector('.chart');
  const draw = () => { box.innerHTML = chartSvg(rows, box.clientWidth || 340); };
  draw();
  return draw;
}

function niceStep(span) {
  for (const s of [5, 10, 20, 25, 50, 100, 200, 250, 500, 1000]) if (span / s <= 4) return s;
  return 1000;
}

function chartSvg(rows, W) {
  const H = W < 520 ? 230 : 290;
  const m = { l: 42, r: 12, t: 26, b: 28 };
  const iw = W - m.l - m.r, ih = H - m.t - m.b;

  // y: milliseconds, inverted so that faster (smaller) is higher.
  let lo = Math.min(...rows.map(r => r.best));
  let hi = Math.max(...rows.map(r => r.avg));
  if (hi - lo < 40) { const c = (hi + lo) / 2; lo = c - 20; hi = c + 20; }
  const pad = (hi - lo) * 0.08;
  const step = niceStep(hi - lo + 2 * pad);
  const y0 = Math.max(0, Math.floor((lo - pad) / step) * step);
  const y1 = Math.ceil((hi + pad) / step) * step;
  const y = v => m.t + ((v - y0) / (y1 - y0)) * ih;

  // x: real time.
  let t0 = rows[0].startedAt, t1 = rows[rows.length - 1].startedAt;
  if (t1 - t0 < 60 * 60 * 1000) { t0 -= 12 * 3600e3; t1 += 12 * 3600e3; }
  else { const p = (t1 - t0) * 0.04; t0 -= p; t1 += p; }
  const x = t => m.l + ((t - t0) / (t1 - t0)) * iw;

  const out = [];
  out.push(`<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">`);
  out.push(`<text class="ax-cap" x="${m.l}" y="13">ms · faster ↑</text>`);

  for (let v = y0; v <= y1 + 0.001; v += step) {
    const yy = y(v).toFixed(1);
    out.push(`<line class="grid" x1="${m.l}" x2="${W - m.r}" y1="${yy}" y2="${yy}"/>`);
    out.push(`<text class="ax" x="${m.l - 6}" y="${yy}" dy="0.32em" text-anchor="end">${v}</text>`);
  }

  const nTicks = W < 520 ? 3 : 5;
  const fmt = t1 - t0 < 26 * 3600e3 ? timeFmt : shortDay;
  for (let i = 0; i < nTicks; i++) {
    const t = t0 + ((i + 0.5) / nTicks) * (t1 - t0);
    out.push(`<text class="ax" x="${x(t).toFixed(1)}" y="${H - 8}" text-anchor="middle">${fmt.format(t)}</text>`);
  }

  const r = rows.length > 80 ? 2.6 : 3.8;
  for (const row of rows) {
    const xx = x(row.startedAt).toFixed(1);
    out.push(`<line class="span" x1="${xx}" x2="${xx}" y1="${y(row.avg).toFixed(1)}" y2="${y(row.best).toFixed(1)}"/>`);
    out.push(`<circle class="best" cx="${xx}" cy="${y(row.best).toFixed(1)}" r="${(r * 0.75).toFixed(1)}"/>`);
    out.push(`<circle class="avg" cx="${xx}" cy="${y(row.avg).toFixed(1)}" r="${r}"><title>${dayFmt.format(row.startedAt)} ${timeFmt.format(row.startedAt)} · avg ${Math.round(row.avg)} ms · best ${row.best} ms · ${row.valid.length} taps</title></circle>`);
  }

  if (rows.length >= 2) {
    const trend = rolling(rows, 5);
    const pts = rows.map((row, i) => `${x(row.startedAt).toFixed(1)},${y(trend[i]).toFixed(1)}`).join(' ');
    out.push(`<polyline class="trend" points="${pts}"/>`);
  }

  out.push('</svg>');
  return out.join('');
}
