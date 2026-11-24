// Survivor — branchement Firebase (comptes + base de données).
// Ce fichier fournit à app.js la même interface que la version Claude
// (window.claude.use('db' | 'user' | 'assets')), puis charge app.js.

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signInWithRedirect,
  createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail,
  signOut, updateProfile, deleteUser, reauthenticateWithPopup, reauthenticateWithCredential, EmailAuthProvider, setPersistence, browserLocalPersistence, connectAuthEmulator
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {
  getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager, doc, collection, onSnapshot, setDoc, deleteDoc, getDoc, getDocs,
  query, where, writeBatch, connectFirestoreEmulator
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const cfg = window.SURVIVOR_FIREBASE || {};
const ADMINS = (window.SURVIVOR_ADMINS || []).map(e => String(e).toLowerCase());
const appEl = document.getElementById('app');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const LOGO = '<img class="login-logo" src="img/survivor.png" alt="Survivor">';

if (!cfg.apiKey || /COLLE-ICI/.test(cfg.apiKey)) {
  appEl.innerHTML = `<div class="login">${LOGO}<div class="login-card"><b>Configuration manquante.</b><p>Ouvre le fichier <code>firebase-config.js</code> et colle la configuration de ton projet Firebase (voir LISEZ-MOI.md, étape 2).</p></div></div>`;
  throw new Error('Firebase non configuré');
}

const fbApp = initializeApp(cfg);
const auth = getAuth(fbApp);
// Cache local (IndexedDB) : les visites suivantes s'affichent tout de suite, puis se mettent à jour
let fs;
// Sur iPhone/Safari, la connexion « en continu » de Firebase se bloque parfois : on passe en mode classique (long polling)
const WEBKIT = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) || /^((?!chrome|chromium|android|crios|fxios|edg).)*safari/i.test(navigator.userAgent);
try { fs = initializeFirestore(fbApp, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }), ...(WEBKIT ? { experimentalForceLongPolling: true } : {}) }); }
catch (e) { console.warn('cache local indisponible', e); fs = getFirestore(fbApp); }
setPersistence(auth, browserLocalPersistence).catch(() => {});
if (cfg.useEmulator) { connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true }); connectFirestoreEmulator(fs, '127.0.0.1', 8080); }

/* ------------------------------------------------------------------ login */
const FR_ERR = {
  'auth/invalid-email': 'Adresse e-mail invalide.',
  'auth/missing-password': 'Entre un mot de passe.',
  'auth/weak-password': 'Mot de passe trop court (6 caractères minimum).',
  'auth/email-already-in-use': 'Un compte existe déjà avec cet e-mail. Connecte-toi.',
  'auth/invalid-credential': 'E-mail ou mot de passe incorrect.',
  'auth/wrong-password': 'E-mail ou mot de passe incorrect.',
  'auth/user-not-found': 'Aucun compte avec cet e-mail.',
  'auth/too-many-requests': 'Trop de tentatives. Réessaie dans quelques minutes.',
  'auth/popup-closed-by-user': 'Connexion annulée.',
  'auth/network-request-failed': 'Pas de connexion internet.'
};
const frErr = e => FR_ERR[e && e.code] || 'Une erreur est survenue. Réessaie.';

function showLogin(mode = 'home', msg = '') {
  const G = '<svg viewBox="0 0 24 24" width="22" height="22"><path fill="currentColor" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3zM12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22zM6.4 14c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V7.4H3.1a10 10 0 0 0 0 9.2L6.4 14zM12 6c1.5 0 2.8.5 3.8 1.5l2.8-2.8A10 10 0 0 0 3.1 7.4L6.4 10C7.2 7.7 9.4 6 12 6z"/></svg>';
  const M = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>';
  let body;
  if (mode === 'home') {
    body = `<button class="btn pop full lg-btn" data-l="google">${G} SE CONNECTER AVEC GOOGLE</button>
      <button class="btn line full lg-btn" data-l="email">${M} CONTINUER AVEC UN E-MAIL</button>`;
  } else {
    const signup = mode === 'signup';
    body = `<form class="login-form" data-l="${signup ? 'doSignup' : 'doLogin'}">
      ${signup ? '<input class="in w" id="lg-name" placeholder="Ton pseudo" maxlength="24" autocomplete="nickname">' : ''}
      <input class="in w" id="lg-mail" type="email" placeholder="E-mail" autocomplete="email">
      <input class="in w" id="lg-pass" type="password" placeholder="Mot de passe" autocomplete="${signup ? 'new-password' : 'current-password'}">
      <button class="btn pop full" type="submit">${signup ? 'CRÉER MON COMPTE' : 'SE CONNECTER'}</button>
    </form>
    <div class="login-links">
      ${signup ? '<button data-l="login">J\'ai déjà un compte</button>' : '<button data-l="signup">Créer un compte</button><button data-l="reset">Mot de passe oublié ?</button>'}
      <button data-l="home">← Retour</button>
    </div>`;
  }
  const html = `<div class="login">${LOGO}<div class="login-sub">${esc(loginIntro)}</div>${msg ? `<div class="login-msg">${esc(msg)}</div>` : ''}${body}</div>`;
  if (started === 'guest') {
    let ov = document.getElementById('login-ov');
    if (!ov) { ov = document.createElement('div'); ov.id = 'login-ov'; document.body.appendChild(ov); document.body.classList.add('noscroll'); }
    ov.innerHTML = `${loginMandatory ? '' : '<button class="login-x" data-l="close" aria-label="Fermer">✕</button>'}${html}`;
  } else appEl.innerHTML = html;
}
let loginIntro = 'Le dernier en vie remporte la ligue.', loginMandatory = false;
// Appelé par le site quand un visiteur non connecté veut jouer
window.survivorLogin = (intro, mandatory) => {
  loginIntro = intro || 'Connecte-toi pour jouer.'; loginMandatory = !!mandatory;
  showLogin('home');
};

document.addEventListener('click', async e => {
  const b = e.target.closest('[data-l]'); if (!b || b.tagName === 'FORM') return;
  const a = b.dataset.l;
  if (a === 'close') { const ov = document.getElementById('login-ov'); if (ov) ov.remove(); document.body.classList.remove('noscroll'); try { sessionStorage.removeItem('survivor-after-login'); } catch (e) {} return; }
  if (a === 'home' || a === 'email' || a === 'login') return showLogin(a === 'home' ? 'home' : 'login');
  if (a === 'signup') return showLogin('signup');
  if (a === 'reset') {
    const mail = (document.getElementById('lg-mail') || {}).value;
    if (!mail) return showLogin('login', 'Entre ton e-mail puis touche « Mot de passe oublié ».');
    try { await sendPasswordResetEmail(auth, mail.trim()); showLogin('login', 'E-mail de réinitialisation envoyé.'); }
    catch (err) { showLogin('login', frErr(err)); }
  }
  if (a === 'google') {
    const p = new GoogleAuthProvider();
    try { await signInWithPopup(auth, p); }
    catch (err) {
      if (err && (err.code === 'auth/popup-blocked' || err.code === 'auth/operation-not-supported-in-this-environment')) signInWithRedirect(auth, p);
      else showLogin('home', frErr(err));
    }
  }
});
document.addEventListener('submit', async e => {
  const f = e.target.closest('form[data-l]'); if (!f) return;
  e.preventDefault();
  const mail = document.getElementById('lg-mail').value.trim(), pass = document.getElementById('lg-pass').value;
  try {
    if (f.dataset.l === 'doSignup') {
      const name = (document.getElementById('lg-name').value || '').trim();
      if (name.length < 2) return showLogin('signup', 'Choisis un pseudo (2 caractères minimum).');
      pendingPseudo = name;
      try { sessionStorage.setItem('survivor-pseudo', name); } catch (e) {}
      const cred = await createUserWithEmailAndPassword(auth, mail, pass);
      await updateProfile(cred.user, { displayName: name }).catch(() => {});
    } else {
      await signInWithEmailAndPassword(auth, mail, pass);
    }
  } catch (err) { showLogin(f.dataset.l === 'doSignup' ? 'signup' : 'login', frErr(err)); }
});
let pendingPseudo = (() => { try { return sessionStorage.getItem('survivor-pseudo'); } catch (e) { return null; } })();

window.survivorLogout = () => signOut(auth).then(() => location.reload());

// Supprime le compte : paris, profil, puis le compte de connexion lui-même
window.survivorDeleteAccount = async () => {
  const u = auth.currentUser; if (!u) return;
  // Firebase exige une connexion récente pour supprimer un compte : on redemande l'identité si besoin
  const last = Date.parse(u.metadata && u.metadata.lastSignInTime) || 0;
  if (Date.now() - last > 4 * 60 * 1000) {
    const google = (u.providerData || []).some(p => p.providerId === 'google.com');
    if (google) await reauthenticateWithPopup(u, new GoogleAuthProvider());
    else {
      const pwd = window.prompt('Par sécurité, entre ton mot de passe pour supprimer ton compte :');
      if (!pwd) { const e = new Error('annulé'); e.code = 'cancelled'; throw e; }
      await reauthenticateWithCredential(u, EmailAuthProvider.credential(u.email, pwd));
    }
  }
  const mine = await getDocs(query(collection(fs, 'picks'), where('uid', '==', u.uid)));
  const batch = writeBatch(fs); mine.forEach(d => batch.delete(d.ref)); await batch.commit();
  await deleteDoc(doc(fs, 'players', u.uid));
  started = 'deleted';
  await deleteUser(u);
  location.reload();
};

/* -------------------------------------------------------------- adapters */
let me = null;
const snapDoc = d => ({ id: d.id, exists: d.exists(), data: () => d.data(), metadata: d.metadata });
const mapErr = e => ({ code: e && e.code === 'permission-denied' ? 'permission-denied' : (e && e.code) || 'unavailable', message: e && e.message });
const split = p => String(p).split('/');
const pickId = (lid, rk, uid) => `${lid}__${rk}__${uid}`;

async function writePicks(uid, picks) {
  const batch = writeBatch(fs); let n = 0;
  for (const [lid, rounds] of Object.entries(picks || {})) {
    for (const [rk, pk] of Object.entries(rounds || {})) {
      if (!pk) continue;
      batch.set(doc(fs, 'picks', pickId(lid, rk, uid)), { uid, league: lid, round: rk, m: pk.m || null, p: pk.p, m2: pk.m2 || null, p2: pk.p2 || null, j: !!(pk.j && pk.m2), at: pk.at || new Date().toISOString() });
      n++;
    }
  }
  if (n) await batch.commit();
}

function docRef(path) {
  const [col, id] = split(path);
  const ref = doc(fs, col, id);
  const isPlayer = col === 'players';
  return {
    id, path,
    async get() { return snapDoc(await getDoc(ref)); },
    async set(data) {
      try {
        if (isPlayer) { const { picks, ...rest } = data || {}; await setDoc(ref, rest); await writePicks(id, picks); }
        else await setDoc(ref, data);
      } catch (e) { throw mapErr(e); }
    },
    async update(data) {
      try {
        if (isPlayer) { const { picks, ...rest } = data || {}; if (Object.keys(rest).length) await setDoc(ref, rest, { merge: true }); await writePicks(id, picks); }
        else await setDoc(ref, data, { merge: true });
      } catch (e) { throw mapErr(e); }
    },
    async delete() {
      try {
        if (isPlayer) {
          const mine = await getDocs(query(collection(fs, 'picks'), where('uid', '==', id)));
          const batch = writeBatch(fs); mine.forEach(d => batch.delete(d.ref)); await batch.commit();
        }
        await deleteDoc(ref);
      } catch (e) { throw mapErr(e); }
    },
    onSnapshot(next, err) { return onSnapshot(ref, d => next(snapDoc(d)), e => err && err(mapErr(e))); }
  };
}

function collectionRef(path) {
  const col = path;
  return {
    path,
    doc: id => docRef(`${col}/${id || Math.random().toString(36).slice(2, 12)}`),
    onSnapshot(next, err) {
      if (col !== 'players') {
        let got = false;
        const fb = setTimeout(async () => { if (got) return; try { const s = await getDocs(collection(fs, col)); if (!got) next({ docs: s.docs.map(snapDoc), size: s.size, empty: s.empty, metadata: { fromCache: false, hasPendingWrites: false } }); } catch (e) {} }, 6000);
        const un = onSnapshot(collection(fs, col), s => { got = true; next({ docs: s.docs.map(snapDoc), size: s.size, empty: s.empty, metadata: s.metadata }); }, e => err && err(mapErr(e)));
        return () => { clearTimeout(fb); un(); };
      }
      // players + their picks (stored in their own documents so the server can enforce deadlines)
      let players = null, picks = null, meta = { fromCache: true, hasPendingWrites: false };
      const emit = () => {
        if (!players || !picks) return;
        const byUid = {};
        picks.forEach(d => { const x = d.data(); if (!x || !x.uid) return; ((byUid[x.uid] = byUid[x.uid] || {})[x.league] = byUid[x.uid][x.league] || {})[x.round] = { m: x.m, p: x.p, at: x.at, ...(x.j ? { m2: x.m2, p2: x.p2, j: true } : {}) }; });
        const docs = players.map(d => { const data = { ...d.data(), picks: byUid[d.id] || {} }; return { id: d.id, exists: true, data: () => data, metadata: d.metadata }; });
        next({ docs, size: docs.length, empty: !docs.length, metadata: meta });
      };
      const u1 = onSnapshot(collection(fs, 'players'), s => { players = s.docs; meta = s.metadata; emit(); }, e => err && err(mapErr(e)));
      const u2 = onSnapshot(collection(fs, 'picks'), s => { picks = s.docs; emit(); }, e => err && err(mapErr(e)));
      // Filet de sécurité : si le flux en direct tarde, on lit les données une fois
      const fb = setTimeout(async () => {
        try {
          if (!players) { const s = await getDocs(collection(fs, 'players')); if (!players) { players = s.docs; meta = { fromCache: false, hasPendingWrites: false }; } }
          if (!picks) { const s = await getDocs(collection(fs, 'picks')); if (!picks) picks = s.docs; }
          emit();
        } catch (e) {}
      }, 6000);
      return () => { clearTimeout(fb); u1(); u2(); };
    }
  };
}

const dbApi = { doc: docRef, collection: collectionRef };
const userApi = {
  id: async () => me && me.uid,
  me: async () => (me ? { id: me.uid, name: me.displayName || '', email: me.email || '' } : null),
  isOwner: () => !!(me && me.email && ADMINS.includes(me.email.toLowerCase())),
  canEdit: () => userApi.isOwner(),
  can: () => true,
  profiles: async ids => Object.fromEntries((ids || []).map(id => [id, { name: '' }]))
};
const assetsApi = {
  async upload(blob) {
    const url = await new Promise((res, rej) => {
      const img = new Image();
      img.onload = () => {
        const max = 640, s = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas'); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        res(c.toDataURL('image/jpeg', 0.78));
      };
      img.onerror = () => rej(new Error('image illisible'));
      img.src = URL.createObjectURL(blob);
    });
    return { id: url, url, sizeBytes: url.length, contentType: 'image/jpeg' };
  }
};

window.claude = { use: async name => (name === 'db' ? dbApi : name === 'user' ? userApi : name === 'assets' ? assetsApi : null) };

/* ------------------------------------------------------------------ start */
let started = false; // false | 'guest' | 'user'
const loadApp = () => { const s = document.createElement('script'); s.src = 'app.js' + (new URL(import.meta.url).search || ''); document.body.appendChild(s); };
async function ensurePlayer(u) {
  try {
    const ref = doc(fs, 'players', u.uid);
    const cur = await getDoc(ref);
    if (!cur.exists()) await setDoc(ref, { id: u.uid, pseudo: (pendingPseudo || u.displayName || (u.email || 'Joueur').split('@')[0]).slice(0, 24), leagues: {} });
    try { sessionStorage.removeItem('survivor-pseudo'); } catch (e) {}
  } catch (e) { console.warn(e); }
}
onAuthStateChanged(auth, async u => {
  if (!u) {
    if (started === 'user') return location.reload();
    if (started) return;
    // Visiteur non connecté : il voit le site, la connexion s'affiche quand il veut jouer
    started = 'guest'; loadApp(); return;
  }
  me = u;
  if (started === 'guest') {
    const ov = document.getElementById('login-ov'); if (ov) ov.innerHTML = '<div class="login"><div class="spin"></div></div>';
    await ensurePlayer(u); location.reload(); return;
  }
  if (started) return;
  started = 'user';
  loadApp();          // le site se charge pendant qu'on vérifie le profil du joueur
  ensurePlayer(u);
});
