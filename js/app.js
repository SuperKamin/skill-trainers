// The app: three views switched by the hash.
//   #/                 Home    — trainers + sign-in
//   #/play/<id>        Play    — one trainer, full screen
//   #/history/<id>     History — graph + every session
import * as store from './store.js';
import { renderHistory } from './history.js';
import { trainers, byId } from '../trainers/index.js';

const $ = id => document.getElementById(id);
const views = { home: $('home'), play: $('play'), history: $('history') };

let unmountTrainer = null;   // cleanup for the trainer on screen
let redrawHistory = null;    // redraw for the history graph (resizes)
let lastView = 'home';
let historyToken = 0;        // ignores a slow history load if the view changed meanwhile

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function show(name) {
  for (const [key, el] of Object.entries(views)) el.hidden = key !== name;
  document.body.classList.toggle('playing', name === 'play');
}

function leavePlay() {
  if (unmountTrainer) {
    unmountTrainer();
    unmountTrainer = null;
    store.endSession();
  }
}

// ---------- Home ----------
function renderHome() {
  $('trainer-list').innerHTML = trainers.map(t => `
    <li class="trainer">
      <a class="play" href="#/play/${t.id}"><h2>${esc(t.name)}</h2><p>${esc(t.blurb)}</p></a>
      <a class="hist" href="#/history/${t.id}" aria-label="${esc(t.name)} history">History</a>
    </li>`).join('');
  renderAccount(store.getState());
}

function renderAccount(st) {
  const acct = $('account');
  const gentle = $('gentle');
  if (st.user) {
    const u = st.user;
    const face = u.photo
      ? `<img src="${esc(u.photo)}" alt="" referrerpolicy="no-referrer">`
      : `<span class="initial">${esc((u.firstName || '?').slice(0, 1).toUpperCase())}</span>`;
    acct.innerHTML = `
      <details class="acct">
        <summary>${face}<span>${esc(u.firstName)}</span></summary>
        <div class="menu"><button type="button" id="signout">Sign out</button></div>
      </details>`;
    $('signout').addEventListener('click', () => store.signOut());
    gentle.innerHTML = '';
    return;
  }
  acct.innerHTML = '';
  if (!st.configured) { gentle.innerHTML = '<p class="fine">Your runs are kept on this device.</p>'; return; }
  if (!st.ready) { gentle.innerHTML = ''; return; }
  const note = {
    domain: 'Sign-in is not switched on for this web address yet.',
    offline: 'No connection right now. Your runs are kept on this device until you sign in.',
    signin: 'Sign-in did not go through. You can try again.',
  }[st.error] || '';
  gentle.innerHTML = `
    <p>Sign in to keep your history on every device.</p>
    <button type="button" class="btn go" id="signin">Sign in with Google</button>
    ${note ? `<p class="fine">${note}</p>` : ''}`;
  $('signin').addEventListener('click', () => store.signIn());
}

// ---------- Play ----------
function renderPlay(trainer) {
  $('play-name').textContent = trainer.name;
  $('play-status').textContent = '0 taps';
  $('play-history').href = `#/history/${trainer.id}`;
  store.beginSession(trainer.id);
  unmountTrainer = trainer.mount($('play-stage'), result => store.record(result), {
    setStatus: text => { $('play-status').textContent = text; },
  });
}

// ---------- History ----------
async function renderHistoryView(trainer) {
  const token = ++historyToken;
  $('history-name').textContent = trainer.name;
  $('history-play').href = `#/play/${trainer.id}`;
  $('history-back').href = lastView === 'play' ? `#/play/${trainer.id}` : '#/';
  const body = $('history-body');
  body.innerHTML = '<p class="fine">Loading…</p>';
  const sessions = await store.listSessions(trainer.id);
  if (token !== historyToken) return;
  const st = store.getState();
  const source = st.user
    ? `Saved to your account (${esc(st.user.firstName)}), on every device you sign in on.`
    : 'Kept on this device only. Sign in on Home to keep it everywhere.';
  redrawHistory = renderHistory(body, trainer, sessions, source);
}

// ---------- routing ----------
function route() {
  const [, view, id] = (location.hash || '#/').split('/');
  const trainer = id ? byId(decodeURIComponent(id)) : null;

  leavePlay();
  redrawHistory = null;

  if (view === 'play' && trainer) {
    show('play');
    renderPlay(trainer);
    lastView = 'play';
  } else if (view === 'history' && trainer) {
    show('history');
    renderHistoryView(trainer);
    lastView = 'history';
  } else {
    show('home');
    renderHome();
    lastView = 'home';
  }
  scrollTo(0, 0);
}

let resizeTimer = 0;
addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => redrawHistory && redrawHistory(), 150);
});
addEventListener('hashchange', route);

store.onState(st => {
  if (!views.home.hidden) renderAccount(st);
  // Signing in or out changes which history is shown.
  if (!views.history.hidden) {
    const [, , id] = location.hash.split('/');
    const t = id && byId(decodeURIComponent(id));
    if (t) renderHistoryView(t);
  }
});

route();
store.init();

if ('serviceWorker' in navigator) {
  addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(err => console.warn('offline cache:', err));
  });
}
