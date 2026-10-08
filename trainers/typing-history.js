// Typing History: speed over time, accuracy, and the keys that cost you the most.
// Phone and PC are shown separately — different keyboards, different skills.

const dayFmt = new Intl.DateTimeFormat(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
const shortDay = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' });
const timeFmt = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' });
const DAY = 864e5;
const mean = a => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
const MODE = { test: 'Test', pairs: 'Pairs', clean: 'Clean', learn: 'Learn' };
const PACK_NAME = { en: 'English', pt: 'Português', gd: 'GDScript', mcf: 'mcfunction' };

let shownDevice = null; // remembered while the page is open
let shownGroup = null;  // which kind of test the graph shows

/** Tests are graphed per group: kind (time / words / zen) + pack + switches. Lengths share a graph. */
const groupKey = r => (r.kind === 'zen' ? 'zen|-|00' : `${r.kind || 'time'}|${r.pack || 'en'}|${r.p ? 1 : 0}${r.n ? 1 : 0}`);
function groupLabel(key) {
  const [kind, pack, f] = key.split('|');
  return [kind === 'time' ? 'Time' : kind === 'words' ? 'Words' : 'Zen', kind === 'zen' ? '' : PACK_NAME[pack] || pack,
    f[0] === '1' ? 'punctuation' : '', f[1] === '1' ? 'numbers' : ''].filter(Boolean).join(' · ');
}

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
    const allTests = mine.filter(r => (r.m || 'test') === 'test');
    const groups = [...new Set(allTests.map(groupKey))];
    if (!groups.includes(shownGroup)) shownGroup = allTests.length ? groupKey(allTests[allTests.length - 1]) : null;
    const tests = allTests.filter(r => groupKey(r) === shownGroup);
    const unit = (shownGroup || '').startsWith('words') ? 'words' : 's';
    const now = Date.now();
    const last7 = mean(tests.filter(r => r.at >= now - 7 * DAY).map(r => r.wpm));
    const prev7 = mean(tests.filter(r => r.at >= now - 14 * DAY && r.at < now - 7 * DAY).map(r => r.wpm));
    const best = tests.length ? Math.max(...tests.map(r => r.wpm)) : null;
    const accAvg = mean(tests.slice(-10).map(r => r.acc));
    const consAvg = mean(tests.filter(r => r.cons != null).slice(-10).map(r => r.cons));
    const bestBy = [...new Set(tests.map(r => r.len).filter(Boolean))].sort((a, b) => a - b)
      .map(l => ({ l, w: Math.max(...tests.filter(r => r.len === l).map(r => r.wpm)) }));
    const wk = weakKeys(mine.slice(-30));
    const byErr = [...wk].sort((a, b) => b.err - a.err).filter(x => x.err > 0).slice(0, 6);
    const bySlow = [...wk].filter(x => x.ms).sort((a, b) => b.ms - a.ms).slice(0, 6);
    const fmt = v => (v == null ? '–' : Math.round(v));

    el.innerHTML = `
      ${devices.length > 1 ? `<div class="ty-devs">${devices.map(d =>
        `<button type="button" class="chip${d === shownDevice ? ' on' : ''}" data-dev="${d}">${d === 'pc' ? 'PC' : 'Phone'}</button>`).join('')}</div>` : ''}
      ${groups.length > 1 ? `<label class="ty-group">Graph: <select data-group>${groups.map(g => `<option value="${g}"${g === shownGroup ? ' selected' : ''}>${groupLabel(g)}</option>`).join('')}</select></label>` : ''}
      ${tests.length ? `<section class="card chart-card"><div class="chart" data-chart role="img" aria-label="Words per minute per test"></div></section>` : ''}
      <section class="tiles">
        <div class="tile"><span class="label">Best</span><b>${fmt(best)}<small> wpm</small></b></div>
        <div class="tile"><span class="label">Accuracy</span><b>${accAvg == null ? '–' : Math.round(accAvg * 100) + '%'}</b></div>
        ${consAvg != null ? `<div class="tile"><span class="label">Consistency</span><b>${Math.round(consAvg)}%</b></div>` : ''}
        <div class="tile"><span class="label">Tests</span><b>${tests.length}</b></div>
      </section>
      ${bestBy.length > 1 ? `<p class="week">Best by length: ${bestBy.map(b => `${b.l} ${unit} <b>${Math.round(b.w)}</b>`).join(' · ')}</p>` : ''}
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
              <span>${(r.m || 'test') === 'test' && r.kind === 'zen' ? 'Zen' : MODE[r.m || 'test'] || r.m}${r.pack && r.pack !== 'en' ? `<small>${PACK_NAME[r.pack] || r.pack}</small>` : ''}</span>
              <span class="num">${r.m === 'clean' ? (r.words || 0) + ' w' : r.kind === 'words' ? r.len + ' w' : r.len ? r.len + ' s' : ''}</span>
              <span class="num">${Math.round(r.wpm)}</span>
              <span class="num">${Math.round(r.acc * 100)}%</span>
            </li>`).join('')}
        </ol>
      </section>
      <p class="fine">${source} WPM counts correct characters only (5 characters = 1 word). The graph shows one kind of Test at a time (pick it above the graph); Pairs and Clean runs are practice and only appear in the list.</p>`;

    el.querySelectorAll('[data-dev]').forEach(b => b.addEventListener('click', () => { shownDevice = b.dataset.dev; draw(); }));
    el.querySelector('[data-group]')?.addEventListener('change', e => { shownGroup = e.target.value; draw(); });
    const box = el.querySelector('[data-chart]');
    if (box) drawChart(box, chart(tests, box.clientWidth || 340));
  };
  draw();
  return draw;
}

const MODE_LONG = { test: 'test', pairs: 'Weak pairs', clean: 'Clean run', learn: 'Learn the keys' };
const runLabel = r => (r.kind === 'zen' ? 'zen' : r.kind === 'words' ? `${r.len} words` : `${r.len} s ${MODE_LONG[r.m || 'test']}`)
  + (r.pack && r.pack !== 'en' ? ` · ${PACK_NAME[r.pack] || r.pack}` : '') + (r.p ? ' · punctuation' : '') + (r.n ? ' · numbers' : '');

/** History: one dot per Test run. Hover/tap a dot for how that run went. */
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
  rows.forEach((r, i) => out.push(`<circle class="avg" cx="${x(r.at).toFixed(1)}" cy="${y(v[i]).toFixed(1)}" r="${rad}"/>`));
  out.push('</svg>');
  const pts = rows.map((r, i) => ({
    x: x(r.at), y: y(v[i]),
    html: tipHtml(`${dayFmt.format(r.at)} · ${timeFmt.format(r.at)}`, [
      ['wpm', 'wpm', Math.round(r.wpm)],
      ['raw', 'raw', r.raw != null ? Math.round(r.raw) : null],
      ['acc', 'accuracy', Math.round(r.acc * 100) + '%'],
      ['cons', 'consistency', r.cons != null ? r.cons + '%' : null],
    ], runLabel(r)),
  }));
  return { html: out.join(''), W, top: m.t, bottom: H - m.b, pts };
}

/** One run, second by second: wpm (bright line), raw (faint line), and a red × on seconds with mistakes.
 *  Hover/tap a second for errors, wpm, raw and burst at that moment. */
export function runChart(run, W) {
  const sec = run.sec;
  if (!sec || !sec.wpm || sec.wpm.length < 2) return null;
  const N = sec.wpm.length;
  const H = W < 520 ? 170 : 210;
  const m = { l: 40, r: 12, t: 24, b: 24 };
  const iw = W - m.l - m.r, ih = H - m.t - m.b;
  const top = Math.max(...sec.wpm, ...sec.raw, 10);
  const step = top > 120 ? 40 : top > 60 ? 20 : 10;
  const y1 = Math.ceil(top / step) * step;
  const y = v => m.t + ih - (Math.min(v, y1) / y1) * ih;
  const x = i => m.l + (N === 1 ? iw / 2 : (i / (N - 1)) * iw);
  const out = [`<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">`,
    `<text class="ax-cap" x="${m.l}" y="13">wpm · each second</text>`];
  for (let v = 0; v <= y1; v += step) {
    const yy = y(v).toFixed(1);
    out.push(`<line class="grid" x1="${m.l}" x2="${W - m.r}" y1="${yy}" y2="${yy}"/>`, `<text class="ax" x="${m.l - 6}" y="${yy}" dy="0.32em" text-anchor="end">${v}</text>`);
  }
  const every = N > 40 ? 10 : N > 16 ? 5 : N > 8 ? 2 : 1;
  for (let i = 0; i < N; i++) {
    if ((i + 1) % every) continue;
    out.push(`<text class="ax" x="${x(i).toFixed(1)}" y="${H - 6}" text-anchor="middle">${i + 1}</text>`);
  }
  const line = a => a.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  out.push(`<polyline class="raw" points="${line(sec.raw)}"/>`, `<polyline class="trend" points="${line(sec.wpm)}"/>`);
  sec.err.forEach((e, i) => {
    if (!e) return;
    const cx = x(i), cy = y(sec.raw[i]) - 9, r = e > 2 ? 4.5 : 3.5;
    out.push(`<path class="errm" d="M${(cx - r).toFixed(1)},${(cy - r).toFixed(1)}L${(cx + r).toFixed(1)},${(cy + r).toFixed(1)}M${(cx + r).toFixed(1)},${(cy - r).toFixed(1)}L${(cx - r).toFixed(1)},${(cy + r).toFixed(1)}"/>`);
  });
  out.push('</svg>');
  const pts = sec.wpm.map((v, i) => ({
    x: x(i), y: y(v),
    html: tipHtml(`${i + 1}`, [
      ['err', 'errors', sec.err[i] || 0],
      ['wpm', 'wpm', v],
      ['raw', 'raw', sec.raw[i]],
      ['burst', 'burst', sec.burst ? sec.burst[i] : null],
    ]),
  }));
  return { html: out.join(''), W, top: m.t, bottom: H - m.b, pts };
}

function tipHtml(head, rows, foot) {
  return `<b class="tip-head">${head}</b>${rows.filter(r => r[2] != null)
    .map(([k, label, val]) => `<span class="tip-row"><i class="sw-${k}"></i>${label}: <b>${val}</b></span>`).join('')}${foot ? `<small>${foot}</small>` : ''}`;
}

/** Puts a chart in its box and adds the hover/tap box: a line at the nearest point + its numbers. */
export function drawChart(box, c) {
  if (!c) { box.innerHTML = ''; return; }
  box.innerHTML = c.html;
  box.classList.add('has-tip');
  const svg = box.querySelector('svg');
  const NS = 'http://www.w3.org/2000/svg';
  const guide = document.createElementNS(NS, 'line');
  guide.setAttribute('class', 'guide');
  guide.setAttribute('y1', c.top); guide.setAttribute('y2', c.bottom);
  const dot = document.createElementNS(NS, 'circle');
  dot.setAttribute('class', 'hover-dot'); dot.setAttribute('r', '5');
  svg.append(guide, dot);
  const tip = document.createElement('div');
  tip.className = 'chart-tip';
  box.appendChild(tip);
  const hide = () => box.classList.remove('tipping');
  const show = e => {
    const r = svg.getBoundingClientRect();
    const k = r.width / c.W;
    const sx = (e.clientX - r.left) / k;
    let best = c.pts[0];
    for (const p of c.pts) if (Math.abs(p.x - sx) < Math.abs(best.x - sx)) best = p;
    guide.setAttribute('x1', best.x); guide.setAttribute('x2', best.x);
    dot.setAttribute('cx', best.x); dot.setAttribute('cy', best.y);
    tip.innerHTML = best.html;
    box.classList.add('tipping');
    const px = best.x * k + (r.left - box.getBoundingClientRect().left);
    const w = tip.offsetWidth;
    tip.style.left = `${px + 14 + w > box.clientWidth ? Math.max(0, px - 14 - w) : px + 14}px`;
    tip.style.top = `${c.top * k}px`;
  };
  svg.addEventListener('pointermove', show);
  svg.addEventListener('pointerdown', show);
  svg.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') hide(); });
  // On the phone the box stays until you tap somewhere else.
  document.addEventListener('pointerdown', e => { if (!box.contains(e.target)) hide(); }, { capture: true });
}
