import { rerender } from './router.js';
import { state, updateProfile } from './state.js';
import { pullFromFirestore, pushPendingToFirestore } from './firestore.js';

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBYyPtd13Jnh0yvq3fnyT8LU--0PoGlu7U",
  authDomain: "fitnessapp-95c80.firebaseapp.com",
  projectId: "fitnessapp-95c80",
  storageBucket: "fitnessapp-95c80.firebasestorage.app",
  messagingSenderId: "984869445600",
  appId: "1:984869445600:web:8ce7d74716ceaeb1dad585",
};

export let currentUser = null;
export let db = null;

export function initAuth() {
  try {
    firebase.initializeApp(FIREBASE_CONFIG);
    db = firebase.firestore();
    firebase.auth().onAuthStateChanged(async user => {
      currentUser = user;
      updateAuthUI();
      if (user) {
        await pullFromFirestore(db, user.uid);
        await pushPendingToFirestore(db, user.uid);
      }
      rerender();
    });
  } catch (e) {
    console.warn('Firebase unavailable — local-only mode', e);
    rerender();
  }
}

export function signIn() {
  if (!db) return;
  firebase.auth().signInWithPopup(new firebase.auth.GoogleAuthProvider());
}

export function signOut() {
  firebase.auth().signOut();
}

function updateAuthUI() {
  const btn = document.getElementById('auth-btn');
  const indicator = document.getElementById('sync-indicator');
  if (!btn) return;
  if (currentUser) {
    const name = (currentUser.displayName || currentUser.email || '').split(' ')[0];
    btn.textContent = `Sign Out (${name})`;
    btn.onclick = signOut;
    if (indicator) indicator.style.display = 'flex';
  } else {
    btn.textContent = '☁ Sign In';
    btn.onclick = signIn;
    if (indicator) indicator.style.display = 'none';
  }
}

export function setSyncDot(ok) {
  const dot = document.getElementById('sync-dot');
  if (dot) dot.style.background = ok ? '#22c55e' : '#ef4444';
}
