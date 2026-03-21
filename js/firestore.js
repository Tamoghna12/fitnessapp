import { state, saveState } from './state.js';
import { setSyncDot } from './auth.js';

export async function pullFromFirestore(db, uid) {
  try {
    const [profileSnap, programsSnap, logsSnap, suggestionsSnap] = await Promise.all([
      db.collection('users').doc(uid).get(),
      db.collection('users').doc(uid).collection('programs').get(),
      db.collection('users').doc(uid).collection('logs').get(),
      db.collection('users').doc(uid).collection('suggestions').get(),
    ]);

    // Profile — cloud wins if newer
    if (profileSnap.exists) {
      const cloud = profileSnap.data();
      if (!state.profile.updatedAt || cloud.updatedAt > state.profile.updatedAt) {
        state.profile = cloud;
      }
    }
    // Programs — most recent wins per id
    programsSnap.forEach(doc => {
      const cloud = doc.data();
      const local = state.programs[doc.id];
      if (!local || cloud.updatedAt > local.updatedAt) {
        state.programs[doc.id] = cloud;
      }
    });
    // Logs — immutable, just fill in missing ones
    logsSnap.forEach(doc => {
      if (!state.logs[doc.id]) state.logs[doc.id] = doc.data();
    });
    // Suggestions — cloud wins
    suggestionsSnap.forEach(doc => {
      state.suggestions[doc.id] = doc.data();
    });

    saveState();
    setSyncDot(true);
  } catch (e) {
    console.warn('Firestore pull failed', e);
    setSyncDot(false);
  }
}

export async function pushPendingToFirestore(db, uid) {
  try {
    const batch = db.batch();
    const userRef = db.collection('users').doc(uid);

    batch.set(userRef, state.profile, { merge: true });

    for (const prog of Object.values(state.programs)) {
      batch.set(userRef.collection('programs').doc(prog.id), prog);
    }
    for (const log of Object.values(state.logs)) {
      batch.set(userRef.collection('logs').doc(log.id), log);
    }
    for (const sug of Object.values(state.suggestions)) {
      batch.set(userRef.collection('suggestions').doc(sug.id), sug);
    }

    await batch.commit();
    setSyncDot(true);
  } catch (e) {
    console.warn('Firestore push failed', e);
    setSyncDot(false);
  }
}

export async function pushDoc(db, uid, collection, doc) {
  if (!db || !uid) return;
  try {
    await db.collection('users').doc(uid).collection(collection).doc(doc.id).set(doc);
    setSyncDot(true);
  } catch (e) {
    setSyncDot(false);
  }
}
