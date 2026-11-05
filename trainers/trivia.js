// Trivia trainer: general knowledge, in packs. Plan: plans/trivia-packs-mix.md · Research: research/trivia.md
// Modes: mix: tick the packs you want, questions come mixed.
// Flow per question (Leo's picks, 05/11):
//   type an answer (Enter); stuck → "show choices" (4); or "no idea".
//   → "how sure?" (sure / maybe / no idea). The answer time stops when the answer is given,
//     not at this tap.
//   → the answer, what it counted as, and one short line about it. A miss opens a story, never a red X;
//     sure-but-wrong is a twist (those stick best).
// Principles: recall first (choices only as a fallback); forgiving matching; play any length; no points.

import { PACKS, packById } from './packs/trivia-index.js';
import { check, choices as makeChoices, makeDeck } from './trivia-engine.js';

const TIP = 'Tip: guess out loud before you look, even if it\'s a wild one.';
const LS_PACKS = 'trivia.packs', LS_LANG = 'trivia.lang';
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const load = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode: fine */ } };

const SURE = [
  { id: 'sure', label: 'Sure' },
  { id: 'maybe', label: 'Maybe' },
  { id: 'none', label: 'No idea' },
];

export default {
  id: 'trivia',
  name: 'Trivia',
  blurb: 'General knowledge in packs. Type it, or pick if you\'re stuck.',
  modes: [
    { id: 'mix', name: 'Mix', blurb: 'Tick the packs you want. Questions come mixed.' },
  ],
  tip: TIP,

  mount(el, onResult, ctx = {}) {
    const setStatus = ctx.setStatus || (() => {});
    const past = ctx.sessions || [];
    const seen = new Set(past.flatMap(s => (s.answers || []).filter(a => a && a.pack && a.id).map(a => a.pack + '/' + a.id)));

    let picked = load(LS_PACKS, ['minecraft']).filter(id => packById(id));
    if (!picked.length) picked = ['minecraft'];
    let lang = load(LS_LANG, 'en') === 'pt' ? 'pt' : 'en';

    el.innerHTML = `<div class="tv" data-state="setup"><div class="tv-in-wrap" data-body></div></div>`;
    const root = el.querySelector('.tv');
    const body = el.querySelector('[data-body]');

    let state = 'setup';
    let deck = [], at = 0, cur = null;      // cur: { pack, q }
    let t0 = 0, given = null, pending = null;
    let answered = 0;

    // ---------- setup (Mix screen) ----------
    function drawSetup() {
      state = 'setup'; root.dataset.state = state;
      const chips = PACKS.map(p => p.coming
        ? `<button type="button" class="chip tv-soon" disabled>${esc(p.title[lang])} <small>coming</small></button>`
        : `<button type="button" class="chip${picked.includes(p.id) ? ' on' : ''}" data-pack="${p.id}" aria-pressed="${picked.includes(p.id)}">${esc(p.title[lang])} <small>${p.questions.length}</small></button>`).join('');
      body.innerHTML = `
        <div class="tv-setup">
          <h2 class="tv-h">Mix</h2>
          <span class="label">Packs</span>
          <div class="tv-chips">${chips}</div>
          <span class="label">Language</span>
          <div class="tv-chips">
            <button type="button" class="chip${lang === 'en' ? ' on' : ''}" data-lang="en" aria-pressed="${lang === 'en'}">English</button>
            <button type="button" class="chip${lang === 'pt' ? ' on' : ''}" data-lang="pt" aria-pressed="${lang === 'pt'}">Português</button>
          </div>
          <p class="fine">Answers count in either language.</p>
          <button type="button" class="btn go tv-start" data-start ${picked.length ? '' : 'disabled'}>Start</button>
          <p class="tv-tip">${TIP}</p>
        </div>`;
      body.querySelectorAll('[data-pack]').forEach(b => b.addEventListener('click', () => {
        const id = b.dataset.pack;
        picked = picked.includes(id) ? picked.filter(x => x !== id) : [...picked, id];
        save(LS_PACKS, picked);
        drawSetup();
      }));
      body.querySelectorAll('[data-lang]').forEach(b => b.addEventListener('click', () => {
        lang = b.dataset.lang; save(LS_LANG, lang); drawSetup();
      }));
      body.querySelector('[data-start]').addEventListener('click', start);
      body.querySelector('[data-start]').focus({ preventScroll: true });
    }

    function start() {
      const packs = picked.map(packById).filter(Boolean);
      if (!packs.length) return;
      deck = makeDeck(packs, seen); at = 0;
      ask();
    }

    // ---------- one question ----------
    function ask() {
      if (at >= deck.length) { deck = makeDeck(picked.map(packById).filter(Boolean), new Set()); at = 0; }
      cur = deck[at++];
      given = null;
      state = 'ask'; root.dataset.state = state;
      const q = cur.q;
      body.innerHTML = `
        <div class="tv-card">
          <span class="label tv-pack">${esc(cur.pack.title[lang])}</span>
          <p class="tv-q">${esc(q.q[lang])}</p>
          <form class="tv-form" data-form autocomplete="off">
            <input class="tv-input" data-input type="text" autocomplete="off" autocapitalize="off" autocorrect="off"
              spellcheck="false" enterkeyhint="done" placeholder="Type your answer" aria-label="Your answer">
            <button type="submit" class="btn go">Answer</button>
          </form>
          <p class="tv-nudge fine" data-nudge></p>
          <div class="tv-choices" data-choices hidden></div>
          <div class="tv-row" data-row>
            <button type="button" class="ghost" data-show>Show choices</button>
            <button type="button" class="ghost" data-dunno>No idea</button>
          </div>
        </div>`;
      const input = body.querySelector('[data-input]');
      body.querySelector('[data-form]').addEventListener('submit', e => {
        e.preventDefault();
        if (!input.value.trim()) {
          body.querySelector('[data-nudge]').textContent = 'Any guess is fine. Or show choices if nothing comes.';
          input.focus();
          return;
        }
        answer('typed', input.value);
      });
      body.querySelector('[data-show]').addEventListener('click', showChoices);
      body.querySelector('[data-dunno]').addEventListener('click', () => answer('dunno', ''));
      input.focus({ preventScroll: true });
      t0 = performance.now();
    }

    function showChoices() {
      if (state !== 'ask') return;
      state = 'choices'; root.dataset.state = state;
      const box = body.querySelector('[data-choices]');
      body.querySelector('[data-form]').hidden = true;
      body.querySelector('[data-nudge]').textContent = '';
      body.querySelector('[data-show]').hidden = true;
      const opts = makeChoices(cur.q, lang);
      box.innerHTML = opts.map((o, i) =>
        `<button type="button" class="tv-choice" data-choice="${esc(o)}"><kbd>${i + 1}</kbd><span>${esc(o)}</span></button>`).join('');
      box.hidden = false;
      box.querySelectorAll('[data-choice]').forEach(b => b.addEventListener('click', () => answer('choices', b.dataset.choice)));
      box.querySelector('button').focus({ preventScroll: true });
    }

    // The answer is given: the clock stops here (Leo, 05/11), before "how sure?".
    function answer(via, text) {
      if (state !== 'ask' && state !== 'choices') return;
      const ms = Math.round(performance.now() - t0);
      let ok = false, counted = '';
      if (via === 'typed') { const r = check(cur.q, text); ok = r.ok; counted = r.ok && !r.exact ? r.counted : ''; }
      if (via === 'choices') ok = text === (lang === 'pt' ? cur.q.a.pt : cur.q.a.en);
      given = { via, text: text.trim(), ok, counted, ms };
      if (via === 'dunno') return reveal('none');
      askSure();
    }

    function askSure() {
      state = 'sure'; root.dataset.state = state;
      body.innerHTML = `
        <div class="tv-card">
          <span class="label tv-pack">${esc(cur.pack.title[lang])}</span>
          <p class="tv-q">${esc(cur.q.q[lang])}</p>
          <p class="tv-given">${given.via === 'choices' ? 'You picked' : 'You said'}: <b>${esc(given.text)}</b></p>
          <span class="label">How sure?</span>
          <div class="tv-sure" tabindex="-1" data-surebox>${SURE.map((s, i) =>
            `<button type="button" class="tv-sure-b" data-sure="${s.id}"><kbd>${i + 1}</kbd>${s.label}</button>`).join('')}</div>
        </div>`;
      body.querySelectorAll('[data-sure]').forEach(b => b.addEventListener('click', () => reveal(b.dataset.sure)));
      // Focus the row, not a button: the Enter that gave the answer must not also pick "Sure".
      body.querySelector('[data-surebox]').focus({ preventScroll: true });
    }

    function reveal(sure) {
      state = 'reveal'; root.dataset.state = state;
      const q = cur.q;
      const right = q.a[lang];
      pending = {
        pack: cur.pack.id, id: q.id, ok: given.ok, via: given.via, sure, ms: given.ms, lang,
        at: Date.now(),
      };
      answered++;
      setStatus(answered + ' answered');
      let head;
      if (given.ok && given.via === 'typed') head = 'From memory.';
      else if (given.ok) head = 'Right, from the choices.';
      else if (given.via === 'dunno') head = 'Here it is.';
      else if (sure === 'sure') head = 'Ooh, a surprise one. These are the ones that stick.';
      else head = 'Not this time. Here it is.';
      const pause = answered % 20 === 0 ? `<p class="fine tv-pause">That's ${answered}. Stopping here is a good call too.</p>` : '';
      body.innerHTML = `
        <div class="tv-card tv-reveal${given.ok ? ' ok' : ''}">
          <span class="label tv-pack">${esc(cur.pack.title[lang])}</span>
          <p class="tv-q small">${esc(q.q[lang])}</p>
          <p class="tv-head">${esc(head)}</p>
          ${given.via !== 'dunno' && !given.ok ? `<p class="tv-given">You ${given.via === 'choices' ? 'picked' : 'said'}: <s>${esc(given.text)}</s></p>` : ''}
          <p class="tv-answer">${esc(right)}</p>
          ${given.counted ? `<p class="fine">Counted as: ${esc(given.counted)}</p>` : ''}
          <p class="tv-note">${esc(q.note[lang])}</p>
          ${pause}
          <div class="tv-row">
            ${given.via === 'typed' && !given.ok ? '<button type="button" class="ghost" data-fix>I was right</button>' : ''}
            <button type="button" class="btn go" data-next>Next</button>
          </div>
        </div>`;
      const fix = body.querySelector('[data-fix]');
      if (fix) fix.addEventListener('click', () => {
        pending.ok = true; pending.fixed = true;
        fix.replaceWith(Object.assign(document.createElement('span'), { className: 'fine', textContent: 'Okay, counted as right.' }));
        body.querySelector('[data-next]').focus({ preventScroll: true });
      });
      body.querySelector('[data-next]').addEventListener('click', next);
      body.querySelector('[data-next]').focus({ preventScroll: true });
    }

    function flushPending() {
      if (!pending) return;
      onResult({ answer: pending });
      pending = null;
    }

    function next() {
      if (state !== 'reveal') return;
      flushPending();
      ask();
    }

    // ---------- keys: 1–4 for choices, 1–3 for "how sure?" ----------
    function onKey(e) {
      if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
      const n = Number(e.key);
      if (state === 'choices' && n >= 1 && n <= 4) {
        const b = body.querySelectorAll('[data-choice]')[n - 1];
        if (b) { e.preventDefault(); b.click(); }
      } else if (state === 'sure' && n >= 1 && n <= 3) {
        e.preventDefault();
        reveal(SURE[n - 1].id);
      }
    }
    document.addEventListener('keydown', onKey);

    setStatus('0 answered');
    drawSetup();

    return function unmount() {
      flushPending();
      document.removeEventListener('keydown', onKey);
      el.innerHTML = '';
    };
  },
};
