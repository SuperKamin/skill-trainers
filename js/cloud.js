// Firebase: Google sign-in + Firestore. Only loaded when firebase-config.js is filled in.
// Data lives at users/{uid}/sessions/{sessionId}.
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js';
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult,
  onAuthStateChanged, signOut as fbSignOut,
} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js';
import {
  initializeFirestore, getFirestore, persistentLocalCache, persistentMultipleTabManager,
  doc, setDoc, collection, getDocs, writeBatch, Timestamp,
} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';

const toMillis = v =>
  v && typeof v.toMillis === 'function' ? v.toMillis() : typeof v === 'number' ? v : Date.parse(v) || 0;

/** Firestore shape of one session. */
const toDoc = s => ({
  trainer: s.trainer,
  mode: s.mode || 'test',
  startedAt: Timestamp.fromMillis(s.startedAt),
  updatedAt: Timestamp.fromMillis(s.updatedAt || s.startedAt),
  device: s.device,
  times: s.times || [],
  early: s.early || 0,
  answers: s.answers || [],
  heard: s.heard || 0,
});

export function connect(config, onUser) {
  const app = initializeApp(config);
  const auth = getAuth(app);
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  let db;
  try {
    db = initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) });
  } catch {
    db = getFirestore(app);
  }

  // Finishes a redirect sign-in if one was started; harmless otherwise.
  getRedirectResult(auth).catch(err => console.warn('redirect sign-in:', err && err.code));
  onAuthStateChanged(auth, user => onUser(user));

  const sessionsCol = uid => collection(db, 'users', uid, 'sessions');

  return {
    async signIn() {
      try {
        await signInWithPopup(auth, provider);
      } catch (err) {
        const code = err && err.code;
        if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment') {
          await signInWithRedirect(auth, provider);
          return;
        }
        if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return;
        throw err;
      }
    },

    signOut: () => fbSignOut(auth),

    /** Write one session (set + merge). Resolves when the server has it; queued offline. */
    save: (uid, s) => setDoc(doc(sessionsCol(uid), s.id), toDoc(s), { merge: true }),

    async saveMany(uid, list) {
      for (let i = 0; i < list.length; i += 400) {
        const batch = writeBatch(db);
        for (const s of list.slice(i, i + 400)) batch.set(doc(sessionsCol(uid), s.id), toDoc(s), { merge: true });
        await batch.commit();
      }
    },

    async list(uid) {
      const snap = await getDocs(sessionsCol(uid));
      return snap.docs.map(d => {
        const x = d.data();
        return {
          id: d.id,
          trainer: x.trainer,
          mode: x.mode || 'test',
          startedAt: toMillis(x.startedAt),
          updatedAt: toMillis(x.updatedAt),
          device: x.device || 'pc',
          times: Array.isArray(x.times) ? x.times : [],
          early: x.early || 0,
          answers: Array.isArray(x.answers) ? x.answers : [],
          heard: x.heard || 0,
        };
      });
    },
  };
}
