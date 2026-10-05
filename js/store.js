// Where play sessions are kept.
// Signed in  → Firestore, users/{uid}/sessions/{sessionId}.
// Signed out → localStorage on this device; uploaded automatically at the next sign-in, then cleared here.
// A session = from opening the Play view until leaving it (or 5+ minutes without a tap).
import { firebaseConfig } from '../firebase-config.js';

const LS_KEY = 'skilltrainers.sessions.v1';
const IDLE_MS = 5 * 60 * 1000;
const SAVE_DELAY = 1000;

let cloud = null;      // the cloud.js API, once connected
let user = null;       // Firebase user, when signed in
let current = null;    // the session being played right now
let saveTimer = 0;
let state = { configured: false, ready: false, user: null, error: '' };
const listeners = new Set();

// ---------- small helpers ----------
function emit(patch) {
  state = { ...state, ...patch };
  listeners.forEach(fn => fn(state));
}
export function onState(fn) { listeners.add(fn); fn(state); return () => listeners.delete(fn); }
export const getState = () => state;

export function isConfigured(cfg = firebaseConfig) {
  if (!cfg || typeof cfg !== 'object') return false;
  return ['apiKey', 'authDomain', 'projectId', 'appId'].every(
    k => typeof cfg[k] === 'string' && cfg[k].trim() && !/PASTE_|YOUR_|<|>/.test(cfg[k]),
  );
}

export function deviceGuess() {
  try {
    if (matchMedia('(pointer: coarse)').matches) return 'phone';
  } catch { /* old browser */ }
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) ? 'phone' : 'pc';
}

const newId = () =>
  (globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function')
    ? globalThis.crypto.randomUUID()
    : Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);

// localStorage can throw (private mode, blocked storage) — every access is wrapped.
function readLocal() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    const obj = raw ? JSON.parse(raw) : {};
    return obj && typeof obj === 'object' ? obj : {};
  } catch { return {}; }
}
function writeLocalMap(map) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(map)); } catch { /* storage full or blocked */ }
}
function saveLocal(s) {
  const map = readLocal();
  map[s.id] = { ...s, times: [...s.times] };
  writeLocalMap(map);
}

const worthSaving = s => s && (s.times.length > 0 || s.early > 0 || (s.answers || []).length > 0 || s.heard > 0);
const userView = u => u && {
  uid: u.uid,
  firstName: (u.displayName || u.email || '').split(/[\s@]/)[0],
  photo: u.photoURL || '',
};

// ---------- cloud connection ----------
export async function init() {
  if (!isConfigured()) { emit({ configured: false, ready: true }); return; }
  emit({ configured: true });
  try {
    const mod = await import('./cloud.js');
    cloud = mod.connect(firebaseConfig, handleUser);
  } catch (err) {
    // Offline before the Firebase code was ever cached, or a bad config: run local-only.
    console.warn('Firebase unavailable, using this device only:', err);
    cloud = null;
    emit({ ready: true, error: 'offline' });
  }
}

function handleUser(u) {
  if (u) {
    if (current && !user) saveLocal(current); // make sure the session so far is included in the upload
    user = u;
    emit({ ready: true, user: userView(u), error: '' });
    uploadLocal(u.uid);
    if (worthSaving(current)) scheduleSave();
  } else {
    user = null;
    emit({ ready: true, user: null });
  }
}

/** Move sessions kept on this device into the account, then clear them here. */
async function uploadLocal(uid) {
  const snapshot = readLocal();
  const list = Object.values(snapshot);
  if (!list.length || !cloud) return;
  try {
    await cloud.saveMany(uid, list);
    const now = readLocal();
    for (const s of list) {
      // Only remove what was uploaded unchanged (a sign-out mid-upload could have added taps).
      if (now[s.id] && now[s.id].updatedAt === s.updatedAt) delete now[s.id];
    }
    writeLocalMap(now);
  } catch (err) {
    console.warn('Upload of device sessions will retry at next sign-in:', err);
  }
}

export async function signIn() {
  if (!cloud) return;
  try {
    emit({ error: '' });
    await cloud.signIn();
  } catch (err) {
    const code = (err && err.code) || '';
    emit({ error: code === 'auth/unauthorized-domain' ? 'domain' : code === 'auth/network-request-failed' ? 'offline' : 'signin' });
    console.warn('sign-in:', err);
  }
}

export async function signOut() {
  if (!cloud) return;
  flushNow();
  try { await cloud.signOut(); } catch (err) { console.warn('sign-out:', err); }
}

// ---------- sessions ----------
export function beginSession(trainer, mode = 'test') {
  if (current) endSession();
  const now = Date.now();
  current = { id: newId(), trainer, mode, startedAt: now, updatedAt: now, device: deviceGuess(), times: [], early: 0, answers: [], heard: 0 };
}

export function record(result) {
  if (!current) return;
  const now = Date.now();
  if (now - current.updatedAt > IDLE_MS) {
    flushNow();
    const { trainer, mode } = current;
    current = null;
    beginSession(trainer, mode);
  }
  if (result && result.early) current.early += 1;
  else if (result && result.answer) current.answers.push(result.answer);
  else if (result && result.heard) current.heard += 1;
  else if (result && typeof result.ms === 'number' && isFinite(result.ms)) current.times.push(Math.round(result.ms));
  else return;
  current.updatedAt = now;
  scheduleSave();
}

function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(flushNow, SAVE_DELAY);
}

export function flushNow() {
  clearTimeout(saveTimer);
  saveTimer = 0;
  if (!worthSaving(current)) return;
  const s = { ...current, times: [...current.times], answers: [...current.answers] };
  if (user && cloud) {
    // Not awaited: offline, Firestore queues it and the promise resolves later.
    cloud.save(user.uid, s).catch(err => {
      console.warn('Cloud save failed, keeping it on this device for now:', err);
      saveLocal(s);
    });
  } else {
    saveLocal(s);
  }
}

export function endSession() {
  flushNow();
  current = null;
}

/** All sessions for one trainer: account + anything still on this device + the one being played. */
export async function listSessions(trainer) {
  const byId = new Map();
  if (user && cloud) {
    try {
      for (const s of await cloud.list(user.uid)) byId.set(s.id, s);
    } catch (err) {
      console.warn('Could not read history from the account:', err);
    }
  }
  for (const s of Object.values(readLocal())) {
    const prev = byId.get(s.id);
    if (!prev || (s.updatedAt || 0) > (prev.updatedAt || 0)) byId.set(s.id, s);
  }
  if (worthSaving(current)) byId.set(current.id, { ...current, times: [...current.times], answers: [...current.answers] });
  return [...byId.values()].filter(s => s.trainer === trainer && typeof s.startedAt === 'number');
}

// Save whatever is pending when the page is hidden or closed.
addEventListener('pagehide', flushNow);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flushNow(); });
