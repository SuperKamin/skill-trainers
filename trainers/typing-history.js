// Typing History: speed over time, accuracy, and the keys that cost you the most.
// Phone and PC are shown separately — different keyboards, different skills.

const dayFmt = new Intl.DateTimeFormat(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
const shortDay = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' });
const timeFmt = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' });
const DAY = 864e5;
const mean = a => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
const MODE = { test: 'Test', pairs: 'Pairs', clean: 'Clean' };

let shownDevice = null; // remembered while the page is open

/** Every run, oldest first, with its session's device. */
export function allRuns(sessions) {
  return sessions
    .flatMap(s => (Array.isArray(s.runs) ? s.runs : []).map(r => ({ ...r, device: s.device || 'pc', at: r.at || s.startedAt })))
    .sort((a, b) => a.at - b.at);
}

/** Keys that cost the most over these runs: mistake rate first, then time per key. */
export function weakKeys(runs, min = 8) {
  const sum = {};
  for (const r of runs) for (const [k, v] of Object.entries(r.keys || {})) {
    const s = sum[k] || (sum[k] = [0, 0, 0, 0]);
    for (let i = 0; i < 4; i++) s[i] += v[i] || 0;
  }
  return Object.entries(sum)
    .filter(([k, s]) => /^[a-z]$/.test(k) && s[0] >= min)
    .map(([k, s]) => ({ k, n: s[0], err: s[1] / s[0], ms: s[3] ? s[2] / s[3] : null }));
}

export function renderTypingHistory(el, sessions, source) {
  const runs = allRuns(sessions);
  if (!runs.length) {
    el.innerHTML = `
      <p class="empty">Nothing here yet. Do a typing test and it shows up here.</p>
      <p class="fine">${source}</p>`;
    return () => {};
  }
  const devices = ['pc', 'phone'].filter(d => runs.some(r => r.device === d));
  if (!devices.includes(shownDevice)) {
    shownDevice = devices.length === 1 ? devices[0] : runs[runs.length - 1].device;
  }

  const draw = () => {
    const mine = runs.filter(r => r.device === shownDevice);
    const tests = mine.filter(r => (r.m || 'test') === 'test');
    const now = Date.now();
    const last7 = mean(tests.filter(r => r.at >= now - 7 * DAY).map(r => r.wpm));
    const prev7 = mean(tests.filter(r => r.at >= now - 14 * DAY && r.at < now - 7 * DAY).map(r => r.wpm));
    const best = tests.length ? Math.max(...tests.map(r => r.wpm)) : null;
    const accAvg = mean(tests.slice(-10).map(r => r.acc));
    const wk = weakKeys(mine.slice(-30));
    const byErr = [...wk].sort((a, b) => b.err - a.err).filter(x => x.err > 0).slice(0, 6);
    const bySlow = [...wk].filter(x => x.ms).sort((a, b) => b.ms - a.ms).slice(0, 6);
    const fmt = v => (v == null ? '–' : Math.round(v));

    el.innerHTML = `
      ${devices.length > 1 ? `<div class="ty-devs">${devices.map(d =>
        `<button type="button" class="chip${d === shownDevice ? ' on' : ''}" data-dev="${d}">${d === 'pc' ? 'PC' : 'Phone'}</button>`).join('')}</div>` : ''}
      ${tests.length ? `<section class="card chart-card"><div class="chart" data-chart role="img" aria-label="Words per minute per test"></div></section>` : ''}
      <section class="tiles">
        <div class="tile"><span class="label">Best</span><b>${fmt(best)}<small> wpm</small></b></div>
        <div class="tile"><span class="label">Accuracy</span><b>${accAvg == null ? '–' : Math.round(accAvg * 100) + '%'}</b></div>
        <div class="tile"><span class="label">Tests</span><b>${tests.length}</b></div>
      </section>
      <p class="week">Last 7 days: <b>${fmt(last7)} wpm</b> · week before: <b>${fmt(prev7)} wpm</b>${devices.length > 1 ? ` · on ${shownDevice === 'pc' ? 'PC' : 'phone'}` : ''}</p>

      ${byErr.length || bySlow.length ? `
      <h2 class="sub">Keys that cost you</h2>
      <div class="ty-weak">
        ${byErr.length ? `<div><span class="label">Most mistakes</span><p>${byErr.map(x => `<kbd>${x.k}</kbd><small>${Math.round(x.err * 100)}%</small>`).join(' ')}</p></div>` : ''}
        ${bySlow.length ? `<div><span class="label">Slowest</span><p>${bySlow.map(x => `<kbd>${x.k}</kbd><small>${Math.round(x.ms)} ms</small>`).join(' ')}</p></div>` : ''}
      </div>
      <p class="fine">From your last ${Math.min(30, mine.length)} runs on this device. Time is how long after the key before it.</p>` : ''}

      <section class="sessions">
        <div class="sess-row sess-head label"><span>When</span><span>Mode</span><span>Len</span><span>WPM</span><span>Acc</span></div>
        <ol>
          ${mine.slice().reverse().slice(0, 50).map(r => `
            <li class="sess-row">
              <span class="when">${dayFmt.format(r.at)}<small>${timeFmt.format(r.at)}</small></span>
              <span>${MODE[r.m || 'test'] || r.m}</span>
              <span class="num">${r.m === 'clean' ? (r.words || 0) + ' w' : r.len ? r.len + ' s' : ''}</span>
              <span class="num">${Math.round(r.wpm)}</span>
              <span class="num">${Math.round(r.acc * 100)}%</span>
            </li>`).join('')}
        </ol>
      </section>
      <p class="fine">${source} WPM counts correct characters only (5 characters = 1 word). The graph shows Test runs; Pairs and Clean runs are practice and only appear in the list.</p>`;

    el.querySelectorAll('[data-dev]').forEach(b => b.addEventListener('click', () => { shownDevice = b.dataset.dev; draw(); }));
    const box = el.querySelector('[data-chart]');
    if (box) box.innerHTML = chart(tests, box.clientWidth || 340);
  };
  draw();
  return draw;
}

function chart(rows, W) {
  const H = W < 520 ? 200 : 250;
  const m = { l: 40, r: 12, t: 24, b: 26 };
  const iw = W - m.l - m.r, ih = H - m.t - m.b;
  const v = rows.map(r => r.wpm);
  const step = 10;
  const y0 = Math.max(0, Math.floor((Math.min(...v) - 5) / step) * step);
  const y1 = Math.ceil((Math.max(...v) + 5) / step) * step;
  const y = val => m.t + ih - ((val - y0) / (y1 - y0)) * ih;
  let t0 = rows[0].at, t1 = rows[rows.length - 1].at;
  if (t1 - t0 < 3600e3) { t0 -= 12 * 3600e3; t1 += 12 * 3600e3; } else { const p = (t1 - t0) * 0.04; t0 -= p; t1 += p; }
  const x = t => m.l + ((t - t0) / (t1 - t0)) * iw;
  const out = [`<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">`,
    `<text class="ax-cap" x="${m.l}" y="13">wpm · faster ↑</text>`];
  const every = (y1 - y0) / step > 6 ? step * 2 : step;
  for (let val = y0; val <= y1; val += every) {
    const yy = y(val).toFixed(1);
    out.push(`<line class="grid" x1="${m.l}" x2="${W - m.r}" y1="${yy}" y2="${yy}"/>`, `<text class="ax" x="${m.l - 6}" y="${yy}" dy="0.32em" text-anchor="end">${val}</text>`);
  }
  const n = W < 520 ? 3 : 5, f = t1 - t0 < 26 * 3600e3 ? timeFmt : shortDay;
  for (let i = 0; i < n; i++) {
    const t = t0 + ((i + 0.5) / n) * (t1 - t0);
    out.push(`<text class="ax" x="${x(t).toFixed(1)}" y="${H - 7}" text-anchor="middle">${f.format(t)}</text>`);
  }
  if (rows.length >= 2) {
    const trend = rows.map((_, i) => mean(v.slice(Math.max(0, i - 4), i + 1)));
    out.push(`<polyline class="trend" points="${rows.map((r, i) => `${x(r.at).toFixed(1)},${y(trend[i]).toFixed(1)}`).join(' ')}"/>`);
  }
  const rad = rows.length > 80 ? 2.6 : 3.6;
  rows.forEach((r, i) => out.push(`<circle class="avg" cx="${x(r.at).toFixed(1)}" cy="${y(v[i]).toFixed(1)}" r="${rad}"><title>${dayFmt.format(r.at)} ${timeFmt.format(r.at)} · ${Math.round(r.wpm)} wpm · ${Math.round(r.acc * 100)}% · ${r.len} s</title></circle>`));
  out.push('</svg>');
  return out.join('');
}
