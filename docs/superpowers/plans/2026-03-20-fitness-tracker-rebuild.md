# Fitness Tracker Rebuild Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the monolithic Iron Protocol app into a modular, adaptive fitness tracker with program builder, smart progression engine, and Firebase cloud sync.

**Architecture:** Vanilla JS ES modules loaded from `index.html` — no build step, deploys directly to GitHub Pages. Pure-function engine tested with Vitest. Render modules return HTML strings injected by the router.

**Tech Stack:** Vanilla JS (ES modules), Firebase Auth + Firestore (compat SDK via CDN), Vitest (dev-only testing), GitHub Pages

---

## File Map

| File | Responsibility |
|------|---------------|
| `index.html` | App shell, nav, CDN scripts, `<script type="module">` boot |
| `css/main.css` | All styles (extracted from current index.html) |
| `js/schema.js` | Factory functions for all entities (Profile, Program, WorkoutLog, etc.) |
| `js/state.js` | In-memory state, localStorage read/write, merge logic |
| `js/router.js` | Tab routing — maps tab name → render function, handles back stack |
| `js/auth.js` | Firebase Auth init, sign-in/out, auth state callbacks |
| `js/firestore.js` | Firestore push/pull per entity type, merge semantics |
| `js/engine.js` | Adaptive progression: compute signals, apply rules, generate suggestions |
| `js/data.js` | Built-in exercises, built-in program templates, Darebee workout import helpers |
| `js/onboarding.js` | First-launch 4-question flow, program recommendation logic |
| `js/render/today.js` | Today screen HTML |
| `js/render/workout.js` | Active workout screen HTML + set logging |
| `js/render/build.js` | Program builder (all 4 steps), exercise picker, slot editor modal |
| `js/render/train.js` | History list, weekly review UI, engine trigger |
| `js/render/me.js` | Profile screen, sign in/out UI |
| `darebee-data.js` | Existing — 105 Darebee workouts (keep as-is); loaded as non-module `<script>` tag in `index.html`, exposes `window.DAREBEE_WORKOUTS` global |
| `tests/engine.test.js` | Vitest unit tests for engine.js |
| `tests/schema.test.js` | Vitest unit tests for schema factories |
| `tests/data.test.js` | Vitest unit tests for Darebee import parsing |
| `package.json` | Dev-only — Vitest only, no build dependencies |
| `vitest.config.js` | Vitest config |

---

## Phase 1 — Foundation

### Task 1: Test harness + schema factories

**Files:**
- Create: `package.json`
- Create: `vitest.config.js`
- Create: `js/schema.js`
- Create: `tests/schema.test.js`

- [ ] Create `package.json`:
```json
{
  "name": "iron-protocol",
  "type": "module",
  "scripts": { "test": "vitest run", "test:watch": "vitest" },
  "devDependencies": { "vitest": "^1.6.0" }
}
```

- [ ] Run `npm install`

- [ ] Create `vitest.config.js`:
```js
import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { environment: 'node' } });
```

- [ ] Write failing tests in `tests/schema.test.js`:
```js
import { describe, it, expect } from 'vitest';
import { makeProfile, makeProgram, makeWorkoutLog, makeSetLog, makeExerciseSlot, makeProgressionSuggestion } from '../js/schema.js';

describe('makeProfile', () => {
  it('creates profile with required defaults', () => {
    const p = makeProfile();
    expect(p.level).toBe('beginner');
    expect(p.goals).toEqual([]);
    expect(p.equipment).toEqual([]);
    expect(p.daysPerWeek).toBe(3);
    expect(p.activeProgramId).toBeNull();
    expect(p.onboardingComplete).toBe(false);
  });
  it('merges overrides', () => {
    const p = makeProfile({ level: 'advanced', daysPerWeek: 5 });
    expect(p.level).toBe('advanced');
    expect(p.daysPerWeek).toBe(5);
  });
});

describe('makeExerciseSlot', () => {
  it('has correct defaults', () => {
    const s = makeExerciseSlot({ exerciseId: 'ex1' });
    expect(s.progressionRule).toBe('none');
    expect(s.progressionCadenceWeeks).toBe(1);
    expect(s.lastProgressedWeek).toBeNull();
    expect(s.consecutivePerformanceHoldWeeks).toBe(0);
    expect(s.targetLoadKg).toBeNull();
  });
});

describe('makeWorkoutLog', () => {
  it('is immutable shape — no edit fields', () => {
    const log = makeWorkoutLog({ programId: 'p1', workoutTemplateId: 't1' });
    expect(log.sets).toEqual([]);
    expect(log.sessionRating).toBeNull();
    expect(log.completedAt).toBeNull();
  });
});

describe('makeSetLog', () => {
  it('unstarted set has correct shape', () => {
    const s = makeSetLog({ exerciseId: 'e1', exerciseSlotId: 's1', setNumber: 1 });
    expect(s.completed).toBe(false);
    expect(s.skipped).toBe(false);
    expect(s.weight).toBeNull();
    expect(s.reps).toBeNull();
  });
});
```

- [ ] Run `npm test` — expect FAIL (module not found)

- [ ] Create `js/schema.js`:
```js
function uid() { return Math.random().toString(36).slice(2, 10); }

export function makeProfile(overrides = {}) {
  return {
    level: 'beginner',
    goals: [],
    equipment: [],
    daysPerWeek: 3,
    activeProgramId: null,
    onboardingComplete: false,
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

export function makeExerciseSlot(overrides = {}) {
  return {
    id: uid(),
    exerciseId: '',
    targetSets: 3,
    targetRepsMin: 8,
    targetRepsMax: 12,
    targetLoadDescriptor: null,
    targetLoadKg: null,
    progressionRule: 'none',
    progressionStepKg: 2.5,
    progressionCadenceWeeks: 1,
    lastProgressedWeek: null,
    consecutivePerformanceHoldWeeks: 0,
    ...overrides,
  };
}

export function makeWorkoutTemplate(overrides = {}) {
  return {
    id: uid(),
    name: '',
    dayOfWeek: 0,
    slots: [],
    ...overrides,
  };
}

export function makeProgram(overrides = {}) {
  return {
    id: uid(),
    name: '',
    totalWeeks: 8,
    isTemplate: false,
    updatedAt: new Date().toISOString(),
    days: [],
    ...overrides,
  };
}

export function makeWorkoutLog(overrides = {}) {
  return {
    id: uid(),
    date: new Date().toISOString(),
    programId: '',
    workoutTemplateId: '',
    sets: [],
    notes: '',
    sessionRating: null,
    completedAt: null,
    ...overrides,
  };
}

export function makeSetLog(overrides = {}) {
  return {
    exerciseId: '',
    exerciseSlotId: '',
    setNumber: 1,
    weight: null,
    reps: null,
    completed: false,
    skipped: false,
    ...overrides,
  };
}

export function makeProgressionSuggestion(overrides = {}) {
  return {
    id: uid(),
    programId: '',
    exerciseSlotId: '',
    weekNumber: 0,
    suggestedChange: 'hold',
    newTargetKg: null,
    newTargetRepsMax: null,   // populated for 'reps' and 'double' rules
    reason: '',
    accepted: null,
    ...overrides,
  };
}

export function makeExercise(overrides = {}) {
  return {
    id: uid(),
    name: '',
    muscleGroup: '',
    equipment: '',
    instructions: '',
    source: 'custom',
    ...overrides,
  };
}
```

- [ ] Run `npm test` — expect PASS

- [ ] Commit:
```bash
git add package.json vitest.config.js js/schema.js tests/schema.test.js
git commit -m "feat: schema factories + test harness"
```

---

### Task 2: State module (localStorage)

**Files:**
- Create: `js/state.js`

- [ ] Create `js/state.js`:
```js
import { makeProfile } from './schema.js';
// NOTE: darebee-data.js is loaded via <script> tag in index.html as a global (DAREBEE_WORKOUTS)
// before app.js loads, so it is available as window.DAREBEE_WORKOUTS in all modules.

const STORAGE_KEY = 'iron-protocol-v2';
const MAX_LOG_WEEKS = 8;

// In-memory state
export let state = {
  profile: makeProfile(),
  programs: {},      // id → Program
  logs: {},          // id → WorkoutLog
  suggestions: {},   // id → ProgressionSuggestion
  exercises: {},     // id → Exercise (custom only; built-ins in data.js)
  lastSyncAt: null,
};

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) Object.assign(state, JSON.parse(raw));
  } catch { /* corrupt storage — start fresh */ }
}

export function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    if (e.name === 'QuotaExceededError') evictOldLogs();
  }
}

function evictOldLogs() {
  const cutoff = Date.now() - MAX_LOG_WEEKS * 7 * 24 * 60 * 60 * 1000;
  for (const [id, log] of Object.entries(state.logs)) {
    if (new Date(log.date).getTime() < cutoff) delete state.logs[id];
  }
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
}

export function updateProfile(patch) {
  state.profile = { ...state.profile, ...patch, updatedAt: new Date().toISOString() };
  saveState();
}

export function saveProgram(program) {
  state.programs[program.id] = { ...program, updatedAt: new Date().toISOString() };
  saveState();
}

export function saveLog(log) {
  // WorkoutLogs are immutable — only write once
  if (!state.logs[log.id]) {
    state.logs[log.id] = log;
    saveState();
  }
}

export function saveSuggestion(suggestion) {
  state.suggestions[suggestion.id] = suggestion;
  saveState();
}

export function saveExercise(exercise) {
  state.exercises[exercise.id] = exercise;
  saveState();
}

export function getActiveProgram() {
  return state.programs[state.profile.activeProgramId] ?? null;
}

/** Returns WorkoutLog entries for active program in current ISO week */
export function getLogsThisWeek() {
  const pid = state.profile.activeProgramId;
  if (!pid) return [];
  const { start, end } = currentISOWeekBounds();
  return Object.values(state.logs).filter(l =>
    l.programId === pid &&
    new Date(l.date) >= start &&
    new Date(l.date) <= end
  );
}

export function currentISOWeekBounds() {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { start: monday, end: sunday };
}

export function currentISOWeekNumber() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
}
```

- [ ] Commit:
```bash
git add js/state.js
git commit -m "feat: state module with localStorage + ISO week helpers"
```

---

### Task 3: Router + index.html shell

**Files:**
- Create: `js/router.js`
- Rewrite: `index.html`
- Create: `css/main.css`

- [ ] Extract all CSS from current `index.html` into `css/main.css`. Keep every existing rule — change nothing yet.

- [ ] Rewrite `index.html` to the new shell:
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Iron Protocol</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=JetBrains+Mono:wght@400;600&family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="css/main.css">
  <!-- Firebase SDKs -->
  <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js"></script>
  <!-- Darebee data — must load before app.js as a global -->
  <script src="darebee-data.js"></script>
</head>
<body>
<div class="app">
  <header class="header">
    <div class="header-inner">
      <div class="logo">
        <div class="logo-icon">🏋</div>
        <div class="logo-text">IRON PROTOCOL</div>
      </div>
      <nav class="nav" id="main-nav">
        <button class="nav-btn active" data-tab="today">Today</button>
        <button class="nav-btn" data-tab="train">Train</button>
        <button class="nav-btn" data-tab="build">Build</button>
        <button class="nav-btn" data-tab="me">Me</button>
      </nav>
      <div id="auth-status" style="display:flex;align-items:center;gap:10px;flex-shrink:0">
        <div id="sync-indicator" style="display:none;align-items:center;gap:5px;font-size:.75rem;color:var(--text-secondary)">
          <div id="sync-dot" style="width:8px;height:8px;border-radius:50%;background:#22c55e"></div>
          Cloud
        </div>
        <button id="auth-btn" class="btn btn-ghost" style="font-size:.78rem;padding:5px 12px">☁ Sign In</button>
      </div>
    </div>
  </header>
  <main class="main" id="main-content"></main>
  <div class="save-toast" id="save-toast"></div>
</div>
<script type="module" src="js/app.js"></script>
</body>
</html>
```

- [ ] Create `js/router.js`:
```js
// Tab → render function registry
const routes = {};
let currentTab = 'today';
let backStack = []; // for sub-pages within a tab

export function registerRoute(tab, renderFn) {
  routes[tab] = renderFn;
}

export function navigateTo(tab, subPage = null) {
  currentTab = tab;
  backStack = subPage ? [subPage] : [];
  _render();
  // Update nav buttons
  document.querySelectorAll('.nav-btn[data-tab]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

export function pushSubPage(subPage) {
  backStack.push(subPage);
  _render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

export function popSubPage() {
  backStack.pop();
  _render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

export function currentSubPage() {
  return backStack[backStack.length - 1] ?? null;
}

function _render() {
  const fn = routes[currentTab];
  if (!fn) return;
  const el = document.getElementById('main-content');
  if (el) el.innerHTML = fn(currentSubPage());
}

export function rerender() { _render(); }

export function initNav() {
  document.querySelectorAll('.nav-btn[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => navigateTo(btn.dataset.tab));
  });
}
```

- [ ] Create `js/app.js` (boot entry point):
```js
import { loadState } from './state.js';
import { initAuth } from './auth.js';
import { initNav, navigateTo, registerRoute } from './router.js';
import { renderToday } from './render/today.js';
import { renderTrain } from './render/train.js';
import { renderBuild } from './render/build.js';
import { renderMe } from './render/me.js';
import { checkOnboarding } from './onboarding.js';

loadState();
initNav();

registerRoute('today', renderToday);
registerRoute('train', renderTrain);
registerRoute('build', renderBuild);
registerRoute('me', renderMe);

initAuth(); // fires rerender after auth state resolves

checkOnboarding(); // shows onboarding overlay if needed, else navigateTo('today')
```

- [ ] Commit:
```bash
git add css/main.css js/router.js js/app.js index.html
git commit -m "feat: app shell, router, CSS extraction"
```

---

## Phase 2 — Auth + Firebase

### Task 4: Auth module

**Files:**
- Create: `js/auth.js`
- Create: `js/firestore.js`

- [ ] Create `js/auth.js`:
```js
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
```

- [ ] Create `js/firestore.js`:
```js
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
```

- [ ] Commit:
```bash
git add js/auth.js js/firestore.js
git commit -m "feat: Firebase auth + Firestore sync"
```

---

## Phase 3 — Adaptive Engine (test-first)

### Task 5: Engine unit tests + implementation

**Files:**
- Create: `js/engine.js`
- Create: `tests/engine.test.js`

- [ ] Write failing tests in `tests/engine.test.js`:
```js
import { describe, it, expect } from 'vitest';
import { computeSignal, applyProgressionRule, generateSuggestions } from '../js/engine.js';
import { makeExerciseSlot, makeSetLog } from '../js/schema.js';

describe('computeSignal', () => {
  const slot = makeExerciseSlot({ targetSets: 4, targetRepsMax: 8 }); // target = 32 reps

  it('Hit when all reps logged', () => {
    const sets = Array.from({ length: 4 }, (_, i) =>
      makeSetLog({ setNumber: i+1, reps: 8, completed: true, skipped: false })
    );
    expect(computeSignal(slot, sets)).toBe('hit');
  });

  it('Partial when 1-2 reps missed', () => {
    const sets = [
      makeSetLog({ reps: 8, completed: true, skipped: false }),
      makeSetLog({ reps: 8, completed: true, skipped: false }),
      makeSetLog({ reps: 8, completed: true, skipped: false }),
      makeSetLog({ reps: 7, completed: true, skipped: false }), // 1 missed
    ];
    expect(computeSignal(slot, sets)).toBe('partial');
  });

  it('Missed when 3+ reps missed', () => {
    const sets = [
      makeSetLog({ reps: 8, completed: true, skipped: false }),
      makeSetLog({ reps: 5, completed: true, skipped: false }), // 3 missed
      makeSetLog({ reps: 8, completed: true, skipped: false }),
      makeSetLog({ reps: 8, completed: true, skipped: false }),
    ];
    expect(computeSignal(slot, sets)).toBe('missed');
  });

  it('Skipped when all sets are skipped', () => {
    const sets = Array.from({ length: 4 }, () =>
      makeSetLog({ completed: false, skipped: true })
    );
    expect(computeSignal(slot, sets)).toBe('skipped');
  });

  it('excludes skipped sets from rep count', () => {
    const sets = [
      makeSetLog({ reps: 8, completed: true, skipped: false }),
      makeSetLog({ completed: false, skipped: true }),
      makeSetLog({ reps: 8, completed: true, skipped: false }),
      makeSetLog({ reps: 8, completed: true, skipped: false }),
    ];
    // Only 3 sets × 8 = 24 logged vs target 32 → missed 8 → 'missed'
    expect(computeSignal(slot, sets)).toBe('missed');
  });
});

describe('applyProgressionRule', () => {
  it('weight rule increases targetLoadKg', () => {
    const slot = makeExerciseSlot({ progressionRule: 'weight', targetLoadKg: 20, progressionStepKg: 2.5 });
    const result = applyProgressionRule(slot, 'hit', 5);
    expect(result.targetLoadKg).toBe(22.5);
  });

  it('reps rule increases targetRepsMax up to ceiling', () => {
    const slot = makeExerciseSlot({ progressionRule: 'reps', targetRepsMin: 8, targetRepsMax: 10, targetLoadKg: 20, progressionStepKg: 2.5 });
    const result = applyProgressionRule(slot, 'hit', 5);
    expect(result.targetRepsMax).toBe(11);
    expect(result.targetLoadKg).toBe(20); // no load change yet
  });

  it('reps rule resets and increases load at ceiling', () => {
    const slot = makeExerciseSlot({ progressionRule: 'reps', targetRepsMin: 8, targetRepsMax: 12, targetLoadKg: 20, progressionStepKg: 2.5 });
    // ceiling = targetRepsMin + 4 = 12; already at ceiling
    const result = applyProgressionRule(slot, 'hit', 5);
    expect(result.targetRepsMax).toBe(8); // reset to current targetRepsMin
    expect(result.targetLoadKg).toBe(22.5);
  });

  it('double rule increases both load and reps', () => {
    const slot = makeExerciseSlot({ progressionRule: 'double', targetLoadKg: 20, targetRepsMax: 10, progressionStepKg: 2.5 });
    const result = applyProgressionRule(slot, 'hit', 5);
    expect(result.targetLoadKg).toBe(22.5);
    expect(result.targetRepsMax).toBe(11);
  });

  it('deload rounds to nearest 0.5kg', () => {
    const slot = makeExerciseSlot({ progressionRule: 'weight', targetLoadKg: 21, progressionStepKg: 2.5 });
    const result = applyProgressionRule(slot, 'missed', 5);
    // 21 × 0.9 = 18.9 → rounds to 19.0
    expect(result.targetLoadKg).toBe(19);
  });

  it('null-load slot always holds regardless of signal', () => {
    const slot = makeExerciseSlot({ targetLoadKg: null, progressionRule: 'weight' });
    const result = applyProgressionRule(slot, 'missed', 5);
    expect(result.targetLoadKg).toBeNull();
    expect(result.suggestedChange).toBe('hold');
  });

  it('cadence hold fires when cadence not elapsed', () => {
    const slot = makeExerciseSlot({ progressionRule: 'weight', targetLoadKg: 20, lastProgressedWeek: 4, progressionCadenceWeeks: 2 });
    const result = applyProgressionRule(slot, 'hit', 5); // currentWeek=5, 5-4=1 < 2
    expect(result.targetLoadKg).toBe(20); // no change
    expect(result.cadenceHold).toBe(true);
  });

  it('streak counter increments on partial', () => {
    const slot = makeExerciseSlot({ consecutivePerformanceHoldWeeks: 1, targetLoadKg: 20, progressionRule: 'weight' });
    const result = applyProgressionRule(slot, 'partial', 5);
    expect(result.consecutivePerformanceHoldWeeks).toBe(2);
  });

  it('streak counter increments on missed', () => {
    const slot = makeExerciseSlot({ consecutivePerformanceHoldWeeks: 1, targetLoadKg: 20, progressionRule: 'weight', progressionStepKg: 2.5 });
    const result = applyProgressionRule(slot, 'missed', 5);
    expect(result.consecutivePerformanceHoldWeeks).toBe(2);
    expect(result.suggestedChange).toBe('deload');
  });

  it('streak counter resets on hit', () => {
    const slot = makeExerciseSlot({ consecutivePerformanceHoldWeeks: 2, targetLoadKg: 20, progressionRule: 'weight', progressionStepKg: 2.5 });
    const result = applyProgressionRule(slot, 'hit', 5);
    expect(result.consecutivePerformanceHoldWeeks).toBe(0);
  });

  it('streak counter resets to 0 on skipped', () => {
    const slot = makeExerciseSlot({ consecutivePerformanceHoldWeeks: 2, targetLoadKg: 20, progressionRule: 'weight' });
    const result = applyProgressionRule(slot, 'skipped', 5);
    expect(result.consecutivePerformanceHoldWeeks).toBe(0);
  });
});

describe('generateSuggestions', () => {
  it('none rule on Hit generates no suggestion', () => {
    const slot = makeExerciseSlot({ id: 's1', progressionRule: 'none', targetSets: 3, targetRepsMax: 10 });
    const program = { id: 'p1', days: [{ slots: [slot] }] };
    const sets = Array.from({ length: 3 }, (_, i) =>
      makeSetLog({ exerciseSlotId: 's1', setNumber: i+1, reps: 10, completed: true, skipped: false })
    );
    const log = makeWorkoutLog({ programId: 'p1', sets });
    const suggestions = generateSuggestions(program, [log], 5);
    expect(suggestions).toHaveLength(0);
  });

  it('skipped exercise generates no suggestion', () => {
    const slot = makeExerciseSlot({ id: 's1', progressionRule: 'weight', targetSets: 3, targetRepsMax: 10, targetLoadKg: 20 });
    const program = { id: 'p1', days: [{ slots: [slot] }] };
    const sets = Array.from({ length: 3 }, () =>
      makeSetLog({ exerciseSlotId: 's1', skipped: true, completed: false })
    );
    const log = makeWorkoutLog({ programId: 'p1', sets });
    const suggestions = generateSuggestions(program, [log], 5);
    expect(suggestions).toHaveLength(0);
  });
});

describe('reps-progression newTargetRepsMax acceptance', () => {
  it('applyProgressionRule reps rule sets newTargetRepsMax below ceiling', () => {
    const slot = makeExerciseSlot({ progressionRule: 'reps', targetRepsMin: 8, targetRepsMax: 10, targetLoadKg: 20, progressionStepKg: 2.5 });
    const result = applyProgressionRule(slot, 'hit', 5);
    expect(result.newTargetRepsMax).toBe(11);
    expect(result.targetRepsMax).toBe(11);
  });

  it('applyProgressionRule double rule sets newTargetRepsMax', () => {
    const slot = makeExerciseSlot({ progressionRule: 'double', targetRepsMin: 8, targetRepsMax: 10, targetLoadKg: 20, progressionStepKg: 2.5 });
    const result = applyProgressionRule(slot, 'hit', 5);
    expect(result.newTargetRepsMax).toBe(11);
    expect(result.targetLoadKg).toBe(22.5);
  });

  it('generateSuggestions carries newTargetRepsMax for reps rule', () => {
    const slot = makeExerciseSlot({ id: 's1', progressionRule: 'reps', targetRepsMin: 8, targetRepsMax: 10, targetSets: 3, targetLoadKg: 20, progressionStepKg: 2.5 });
    const program = { id: 'p1', days: [{ slots: [slot] }] };
    const sets = Array.from({ length: 3 }, (_, i) =>
      makeSetLog({ exerciseSlotId: 's1', setNumber: i+1, reps: 10, completed: true, skipped: false })
    );
    const log = makeWorkoutLog({ programId: 'p1', sets });
    const suggestions = generateSuggestions(program, [log], 5);
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].newTargetRepsMax).toBe(11);
  });
});
```

- [ ] Run `npm test` — expect FAIL

- [ ] Create `js/engine.js`:
```js
import { makeProgressionSuggestion } from './schema.js';

/** Round to nearest 0.5 */
function roundHalf(n) { return Math.round(n * 2) / 2; }

/**
 * Determine signal for a slot given its SetLog entries for the week.
 * @param {ExerciseSlot} slot
 * @param {SetLog[]} sets - all SetLog entries for this slot this week
 * @returns {'hit'|'partial'|'missed'|'skipped'}
 */
export function computeSignal(slot, sets) {
  const activeSets = sets.filter(s => !s.skipped);
  if (activeSets.length === 0) return 'skipped';

  const loggedReps = activeSets.reduce((sum, s) => sum + (s.reps || 0), 0);
  const targetReps = slot.targetSets * slot.targetRepsMax;
  const missed = Math.max(0, targetReps - loggedReps);

  if (missed === 0) return 'hit';
  if (missed <= 2) return 'partial';
  return 'missed';
}

/**
 * Apply progression rule to a slot given signal and current ISO week.
 * Returns a new slot object (does not mutate) plus suggestedChange metadata.
 * @param {ExerciseSlot} slot
 * @param {'hit'|'partial'|'missed'|'skipped'} signal
 * @param {number} currentWeek - ISO week number
 * @returns {ExerciseSlot & { suggestedChange, cadenceHold, streakWarning }}
 */
export function applyProgressionRule(slot, signal, currentWeek) {
  const next = { ...slot };
  next.suggestedChange = 'hold';
  next.cadenceHold = false;
  next.streakWarning = false;

  if (signal === 'skipped') {
    next.consecutivePerformanceHoldWeeks = 0; // reset on skipped per spec
    return next;
  }

  // Null-load guard — always hold
  if (slot.targetLoadKg === null) {
    next.suggestedChange = 'hold';
    return next;
  }

  if (signal === 'missed') {
    next.targetLoadKg = roundHalf(slot.targetLoadKg * 0.9);
    next.suggestedChange = 'deload';
    next.consecutivePerformanceHoldWeeks = slot.consecutivePerformanceHoldWeeks + 1; // spec: Missed increments streak
    if (next.consecutivePerformanceHoldWeeks >= 3) next.streakWarning = true;
    return next;
  }

  if (signal === 'partial') {
    next.suggestedChange = 'hold';
    next.consecutivePerformanceHoldWeeks = slot.consecutivePerformanceHoldWeeks + 1;
    if (next.consecutivePerformanceHoldWeeks >= 3) next.streakWarning = true;
    return next;
  }

  // signal === 'hit'
  next.consecutivePerformanceHoldWeeks = 0; // reset on hit

  if (slot.progressionRule === 'none') {
    next.suggestedChange = 'hold';
    return next;
  }

  // Cadence check
  const weeksSinceProg = currentWeek - (slot.lastProgressedWeek ?? 0);
  if (slot.lastProgressedWeek !== null && weeksSinceProg < slot.progressionCadenceWeeks) {
    next.cadenceHold = true;
    next.suggestedChange = 'hold';
    return next;
  }

  // Apply rule
  const rule = slot.progressionRule === 'adaptive' ? 'weight' : slot.progressionRule;

  if (rule === 'weight') {
    next.targetLoadKg = slot.targetLoadKg + slot.progressionStepKg;
    next.lastProgressedWeek = currentWeek;
    next.suggestedChange = 'increase';
    next.newTargetRepsMax = null;
  } else if (rule === 'reps') {
    const ceiling = slot.targetRepsMin + 4;
    if (slot.targetRepsMax >= ceiling) {
      next.targetRepsMax = slot.targetRepsMin;
      next.targetLoadKg = slot.targetLoadKg + slot.progressionStepKg;
    } else {
      next.targetRepsMax = slot.targetRepsMax + 1;
    }
    next.newTargetRepsMax = next.targetRepsMax;
    next.lastProgressedWeek = currentWeek;
    next.suggestedChange = 'increase';
  } else if (rule === 'double') {
    next.targetLoadKg = slot.targetLoadKg + slot.progressionStepKg;
    next.targetRepsMax = slot.targetRepsMax + 1;
    next.newTargetRepsMax = next.targetRepsMax;
    next.lastProgressedWeek = currentWeek;
    next.suggestedChange = 'increase';
  }

  return next;
}

/**
 * Generate ProgressionSuggestion objects for all slots in a program
 * based on this week's logs.
 * @param {Program} program
 * @param {WorkoutLog[]} weekLogs - all logs for the active program this week
 * @param {number} currentWeek
 * @returns {ProgressionSuggestion[]}
 */
export function generateSuggestions(program, weekLogs, currentWeek) {
  const suggestions = [];

  for (const day of program.days) {
    for (const slot of day.slots) {
      // Collect all SetLogs for this slot across all this week's logs
      const sets = weekLogs.flatMap(log =>
        log.sets.filter(s => s.exerciseSlotId === slot.id)
      );

      const signal = computeSignal(slot, sets);
      if (signal === 'skipped') continue; // skipped = no action, no suggestion
      const next = applyProgressionRule(slot, signal, currentWeek);

      // 'none' rule on Hit generates no suggestion
      if (slot.progressionRule === 'none' && signal === 'hit') continue;

      suggestions.push(makeProgressionSuggestion({
        programId: program.id,
        exerciseSlotId: slot.id,
        weekNumber: currentWeek,
        suggestedChange: next.suggestedChange,
        newTargetKg: next.targetLoadKg ?? null,
        newTargetRepsMax: next.newTargetRepsMax ?? null,
        reason: buildReason(signal, next),
      }));
    }
  }

  return suggestions;
}

function buildReason(signal, next) {
  if (next.streakWarning) return 'Same weight 3+ weeks — consider a technique check or rep range change.';
  if (next.cadenceHold) return 'Progressed recently — holding this week per cadence setting.';
  const map = {
    hit: 'All target reps hit — time to progress.',
    partial: 'Missed 1–2 reps — holding to consolidate.',
    missed: 'Missed 3+ reps — deloading to rebuild strength.',
    skipped: 'Exercise was skipped this week.',
  };
  return map[signal] ?? '';
}
```

- [ ] Run `npm test` — expect PASS

- [ ] Commit:
```bash
git add js/engine.js tests/engine.test.js
git commit -m "feat: adaptive progression engine (fully tested)"
```

---

## Phase 4 — Data + Darebee import

### Task 6: data.js + Darebee import parser

**Files:**
- Create: `js/data.js`
- Create: `tests/data.test.js`

- [ ] Write failing tests `tests/data.test.js`:
```js
import { describe, it, expect } from 'vitest';
import { parseDarebeeExercise, recommendProgram } from '../js/data.js';

describe('parseDarebeeExercise', () => {
  it('uses fallback sets when null', () => {
    const ex = parseDarebeeExercise({ name: 'Burpee', sets: null, reps: null, duration: null });
    expect(ex.slot.targetSets).toBe(3);
    expect(ex.slot.targetRepsMin).toBe(10);
    expect(ex.slot.targetRepsMax).toBe(12);
  });

  it('uses duration when reps null', () => {
    const ex = parseDarebeeExercise({ name: 'Plank', sets: null, reps: null, duration: '30 seconds' });
    expect(ex.slot.targetRepsMin).toBe(1);
    expect(ex.slot.targetRepsMax).toBe(1);
    expect(ex.exercise.instructions).toContain('30 seconds');
  });

  it('parses string range reps', () => {
    const ex = parseDarebeeExercise({ name: 'Push-up', sets: 3, reps: '10-15', duration: null });
    expect(ex.slot.targetRepsMin).toBe(10);
    expect(ex.slot.targetRepsMax).toBe(15);
  });

  it('parses single number reps string', () => {
    const ex = parseDarebeeExercise({ name: 'Squat', sets: 3, reps: '20', duration: null });
    expect(ex.slot.targetRepsMin).toBe(20);
    expect(ex.slot.targetRepsMax).toBe(20);
  });
});

describe('recommendProgram', () => {
  it('recommends a program matching goal + level + equipment', () => {
    const profile = { goals: ['strength'], level: 'intermediate', equipment: ['dumbbells'] };
    const result = recommendProgram(profile);
    expect(result).not.toBeNull();
    expect(result.id).toBeTruthy();
  });
});
```

- [ ] Run `npm test` — expect FAIL

- [ ] Create `js/data.js`:
```js
import { makeExercise, makeExerciseSlot, makeWorkoutTemplate, makeProgram } from './schema.js';

// Built-in exercise library
export const BUILTIN_EXERCISES = [
  makeExercise({ id: 'db-floor-press', name: 'DB Floor Press', muscleGroup: 'Chest, Triceps', equipment: 'dumbbells', source: 'builtin' }),
  makeExercise({ id: 'db-bent-row', name: 'DB Bent-Over Row', muscleGroup: 'Back, Biceps', equipment: 'dumbbells', source: 'builtin' }),
  makeExercise({ id: 'db-ohp', name: 'DB Overhead Press', muscleGroup: 'Shoulders, Core', equipment: 'dumbbells', source: 'builtin' }),
  makeExercise({ id: 'db-rdl', name: 'DB Romanian Deadlift', muscleGroup: 'Hamstrings, Glutes', equipment: 'dumbbells', source: 'builtin' }),
  makeExercise({ id: 'db-goblet', name: 'DB Goblet Squat', muscleGroup: 'Quads, Glutes', equipment: 'dumbbells', source: 'builtin' }),
  makeExercise({ id: 'kb-swing', name: 'KB Swing', muscleGroup: 'Posterior Chain', equipment: 'kettlebell', source: 'builtin' }),
  makeExercise({ id: 'pushup', name: 'Push-Up', muscleGroup: 'Chest, Triceps', equipment: 'bodyweight', source: 'builtin' }),
  makeExercise({ id: 'pullup', name: 'Pull-Up', muscleGroup: 'Back, Biceps', equipment: 'pull-up bar', source: 'builtin' }),
  makeExercise({ id: 'db-curl', name: 'DB Bicep Curl', muscleGroup: 'Biceps', equipment: 'dumbbells', source: 'builtin' }),
  makeExercise({ id: 'db-lunge', name: 'DB Lunge', muscleGroup: 'Quads, Glutes', equipment: 'dumbbells', source: 'builtin' }),
  makeExercise({ id: 'db-lateral', name: 'DB Lateral Raise', muscleGroup: 'Side Delts', equipment: 'dumbbells', source: 'builtin' }),
  makeExercise({ id: 'plank', name: 'Plank', muscleGroup: 'Core', equipment: 'bodyweight', source: 'builtin' }),
  makeExercise({ id: 'glute-bridge', name: 'Glute Bridge', muscleGroup: 'Glutes', equipment: 'bodyweight', source: 'builtin' }),
  makeExercise({ id: 'db-skull', name: 'DB Skull Crushers', muscleGroup: 'Triceps', equipment: 'dumbbells', source: 'builtin' }),
  makeExercise({ id: 'db-split', name: 'DB Bulgarian Split Squat', muscleGroup: 'Quads, Glutes', equipment: 'dumbbells', source: 'builtin' }),
];

// Built-in program templates
export const BUILTIN_PROGRAMS = [
  makeProgram({
    id: 'iron-protocol',
    name: 'Iron Protocol',
    totalWeeks: 12,
    isTemplate: true,
    days: [
      makeWorkoutTemplate({
        id: 'upper-a', name: 'Upper Body A', dayOfWeek: 0,
        slots: [
          makeExerciseSlot({ exerciseId: 'db-floor-press', targetSets: 4, targetRepsMin: 6, targetRepsMax: 8, targetLoadKg: 20, targetLoadDescriptor: 'heavy', progressionRule: 'weight', progressionStepKg: 2.5 }),
          makeExerciseSlot({ exerciseId: 'db-bent-row', targetSets: 4, targetRepsMin: 6, targetRepsMax: 8, targetLoadKg: 22, targetLoadDescriptor: 'heavy', progressionRule: 'weight', progressionStepKg: 2.5 }),
          makeExerciseSlot({ exerciseId: 'db-ohp', targetSets: 3, targetRepsMin: 8, targetRepsMax: 10, targetLoadKg: 14, targetLoadDescriptor: 'moderate', progressionRule: 'weight', progressionStepKg: 2.5 }),
          makeExerciseSlot({ exerciseId: 'db-curl', targetSets: 3, targetRepsMin: 10, targetRepsMax: 12, targetLoadKg: 10, targetLoadDescriptor: 'moderate', progressionRule: 'reps', progressionStepKg: 2.5 }),
          makeExerciseSlot({ exerciseId: 'db-skull', targetSets: 3, targetRepsMin: 10, targetRepsMax: 12, targetLoadKg: 8, targetLoadDescriptor: 'moderate', progressionRule: 'reps', progressionStepKg: 2.5 }),
          makeExerciseSlot({ exerciseId: 'db-lateral', targetSets: 3, targetRepsMin: 12, targetRepsMax: 15, targetLoadKg: 6, targetLoadDescriptor: 'light', progressionRule: 'reps', progressionStepKg: 2 }),
        ],
      }),
      makeWorkoutTemplate({
        id: 'lower-a', name: 'Lower Body A', dayOfWeek: 1,
        slots: [
          makeExerciseSlot({ exerciseId: 'db-goblet', targetSets: 4, targetRepsMin: 6, targetRepsMax: 8, targetLoadKg: 24, targetLoadDescriptor: 'heavy', progressionRule: 'weight', progressionStepKg: 2.5 }),
          makeExerciseSlot({ exerciseId: 'db-rdl', targetSets: 4, targetRepsMin: 8, targetRepsMax: 10, targetLoadKg: 22, targetLoadDescriptor: 'heavy', progressionRule: 'weight', progressionStepKg: 2.5 }),
          makeExerciseSlot({ exerciseId: 'kb-swing', targetSets: 4, targetRepsMin: 12, targetRepsMax: 15, targetLoadKg: 16, targetLoadDescriptor: 'moderate', progressionRule: 'weight', progressionStepKg: 2 }),
          makeExerciseSlot({ exerciseId: 'db-split', targetSets: 3, targetRepsMin: 8, targetRepsMax: 10, targetLoadKg: 14, targetLoadDescriptor: 'moderate', progressionRule: 'weight', progressionStepKg: 2.5 }),
          makeExerciseSlot({ exerciseId: 'glute-bridge', targetSets: 3, targetRepsMin: 12, targetRepsMax: 15, targetLoadKg: null, progressionRule: 'reps' }),
        ],
      }),
    ],
  }),
  makeProgram({
    id: 'full-body-3x',
    name: 'Full Body 3×/Week',
    totalWeeks: 8,
    isTemplate: true,
    days: [
      makeWorkoutTemplate({
        id: 'fb-a', name: 'Full Body A', dayOfWeek: 0,
        slots: [
          makeExerciseSlot({ exerciseId: 'db-goblet', targetSets: 3, targetRepsMin: 8, targetRepsMax: 10, targetLoadKg: 16, progressionRule: 'weight', progressionStepKg: 2.5 }),
          makeExerciseSlot({ exerciseId: 'pushup', targetSets: 3, targetRepsMin: 8, targetRepsMax: 12, targetLoadKg: null, progressionRule: 'reps' }),
          makeExerciseSlot({ exerciseId: 'db-bent-row', targetSets: 3, targetRepsMin: 8, targetRepsMax: 10, targetLoadKg: 14, progressionRule: 'weight', progressionStepKg: 2.5 }),
          makeExerciseSlot({ exerciseId: 'plank', targetSets: 3, targetRepsMin: 1, targetRepsMax: 1, targetLoadKg: null, progressionRule: 'none' }),
        ],
      }),
      makeWorkoutTemplate({ id: 'fb-b', name: 'Full Body B', dayOfWeek: 2, slots: [] }),
      makeWorkoutTemplate({ id: 'fb-c', name: 'Full Body C', dayOfWeek: 4, slots: [] }),
    ],
  }),
];

/**
 * Parse a Darebee exercise entry into { exercise, slot } pair.
 */
export function parseDarebeeExercise(dbEx) {
  const exercise = makeExercise({
    id: `db-${dbEx.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`,
    name: dbEx.name,
    muscleGroup: dbEx.muscles || '',
    equipment: dbEx.equip || 'bodyweight',
    instructions: dbEx.notes || '',
    source: 'darebee',
  });

  const targetSets = dbEx.sets != null ? Number(dbEx.sets) : 3;

  let targetRepsMin = 10, targetRepsMax = 12;
  let instructions = exercise.instructions;

  if (dbEx.reps != null) {
    const repsStr = String(dbEx.reps).trim();
    if (repsStr.includes('-')) {
      const [a, b] = repsStr.split('-').map(Number);
      targetRepsMin = a; targetRepsMax = b;
    } else {
      const n = parseInt(repsStr, 10);
      if (!isNaN(n)) targetRepsMin = targetRepsMax = n;
    }
  } else if (dbEx.duration != null) {
    targetRepsMin = 1; targetRepsMax = 1;
    instructions = instructions ? `${instructions} (${dbEx.duration})` : String(dbEx.duration);
    exercise.instructions = instructions;
  }
  // else both null: use defaults 10-12

  const slot = makeExerciseSlot({
    exerciseId: exercise.id,
    targetSets,
    targetRepsMin,
    targetRepsMax,
    targetLoadKg: null,
    progressionRule: 'none',
  });

  return { exercise, slot };
}

/**
 * Recommend the best matching built-in program for a user profile.
 */
export function recommendProgram(profile) {
  const { goals = [], level, equipment = [] } = profile;

  // Score each template
  const scored = BUILTIN_PROGRAMS.map(p => {
    let score = 0;
    if (level === 'beginner' && p.id === 'full-body-3x') score += 3;
    if (level === 'intermediate' && p.id === 'iron-protocol') score += 3;
    if (level === 'advanced' && p.id === 'iron-protocol') score += 2;
    if (goals.includes('strength') && p.id === 'iron-protocol') score += 2;
    if (equipment.includes('dumbbells')) score += 1;
    return { program: p, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.program ?? BUILTIN_PROGRAMS[0];
}

/** All exercises: built-in + user custom (passed in) + Darebee */
export function getAllExercises(customExercises = {}) {
  const darebeeExercises = (typeof DAREBEE_WORKOUTS !== 'undefined' ? DAREBEE_WORKOUTS : [])
    .flatMap(w => (w.exercises || []).map(ex => parseDarebeeExercise(ex).exercise));

  return [
    ...BUILTIN_EXERCISES,
    ...Object.values(customExercises),
    ...darebeeExercises,
  ];
}
```

- [ ] Run `npm test` — expect PASS

- [ ] Commit:
```bash
git add js/data.js tests/data.test.js
git commit -m "feat: built-in exercise library, programs, Darebee import parser"
```

---

## Phase 5 — Onboarding

### Task 7: Onboarding flow

**Files:**
- Create: `js/onboarding.js`

- [ ] Create `js/onboarding.js`:
```js
import { state, updateProfile } from './state.js';
import { recommendProgram, BUILTIN_PROGRAMS } from './data.js';
import { navigateTo, rerender } from './router.js';
import { saveProgram } from './state.js';

export function checkOnboarding() {
  if (state.profile.onboardingComplete) {
    navigateTo('today');
    return;
  }
  showOnboarding();
}

function showOnboarding() {
  const el = document.getElementById('main-content');
  if (!el) return;
  // Hide nav during onboarding
  document.getElementById('main-nav').style.display = 'none';
  el.innerHTML = renderStep(1, {});
}

function renderStep(step, answers) {
  const steps = [
    {
      q: "What's your main goal?",
      key: 'goals',
      multi: false,
      options: [
        { label: 'Build Strength', value: 'strength' },
        { label: 'Build Muscle', value: 'hypertrophy' },
        { label: 'Lose Fat', value: 'fat_loss' },
        { label: 'General Fitness', value: 'general' },
      ],
    },
    {
      q: 'Your experience level?',
      key: 'level',
      multi: false,
      options: [
        { label: 'New to training', value: 'beginner' },
        { label: '6 months – 2 years', value: 'intermediate' },
        { label: '2+ years', value: 'advanced' },
      ],
    },
    {
      q: 'What equipment do you have? (select all)',
      key: 'equipment',
      multi: true,
      options: [
        { label: 'Dumbbells', value: 'dumbbells' },
        { label: 'Barbell', value: 'barbell' },
        { label: 'Kettlebell', value: 'kettlebell' },
        { label: 'Pull-up bar', value: 'pull-up bar' },
        { label: 'Bodyweight only', value: 'bodyweight' },
        { label: 'Full gym', value: 'gym' },
      ],
    },
    {
      q: 'How many days per week?',
      key: 'daysPerWeek',
      multi: false,
      options: [2,3,4,5,6].map(n => ({ label: `${n} days`, value: n })),
    },
  ];

  const s = steps[step - 1];
  const answersJson = JSON.stringify(answers).replace(/'/g, '&#39;');

  return `
    <div class="page active" style="max-width:600px;margin:0 auto;padding:2rem 1rem">
      <div class="page-title" style="color:var(--accent)">Welcome to Iron Protocol</div>
      <div class="page-subtitle" style="margin-bottom:2rem">Step ${step} of ${steps.length}</div>
      <div style="font-size:1.1rem;font-weight:600;margin-bottom:1.5rem">${s.q}</div>
      <div style="display:flex;flex-wrap:wrap;gap:12px">
        ${s.options.map(opt => `
          <button class="onb-btn" onclick="onboardingSelect(${step}, '${s.key}', ${JSON.stringify(opt.value)}, ${s.multi}, '${answersJson}')"
            style="background:var(--bg-card);border:2px solid var(--border);border-radius:var(--radius);padding:12px 20px;color:var(--text-primary);font-size:0.95rem;cursor:pointer;transition:var(--transition)">
            ${opt.label}
          </button>
        `).join('')}
      </div>
    </div>
  `;
}

// Exposed globally for inline onclick
window.onboardingSelect = function(step, key, value, multi, answersJson) {
  const answers = JSON.parse(answersJson);
  if (multi) {
    answers[key] = answers[key] ? [...answers[key], value] : [value];
  } else {
    answers[key] = value;
  }

  const totalSteps = 4;
  if (step < totalSteps) {
    document.getElementById('main-content').innerHTML = renderStep(step + 1, answers);
    return;
  }

  // Final step — save profile + recommend program
  const profilePatch = {
    goals: Array.isArray(answers.goals) ? answers.goals : [answers.goals],
    level: answers.level || 'beginner',
    equipment: Array.isArray(answers.equipment) ? answers.equipment : [answers.equipment],
    daysPerWeek: answers.daysPerWeek || 3,
    onboardingComplete: true,
  };
  updateProfile(profilePatch);

  const rec = recommendProgram(profilePatch);
  // Deep-clone the template as user's own copy
  const userProg = { ...rec, id: `${rec.id}-${Date.now()}`, isTemplate: false };
  saveProgram(userProg);
  updateProfile({ activeProgramId: userProg.id });

  document.getElementById('main-nav').style.display = '';
  navigateTo('today');
};
```

- [ ] Commit:
```bash
git add js/onboarding.js
git commit -m "feat: 4-step onboarding flow with program recommendation"
```

---

## Phase 6 — Render Modules

### Task 8: Today screen

**Files:**
- Create: `js/render/today.js`

- [ ] Create `js/render/today.js`:
```js
import { state, getActiveProgram, getLogsThisWeek, currentISOWeekNumber, currentISOWeekBounds } from '../state.js';
import { BUILTIN_EXERCISES } from '../data.js';
import { pushSubPage } from '../router.js';

const DAY_NAMES = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

export function renderToday() {
  const program = getActiveProgram();
  if (!program) return renderNoProgram();

  const logsThisWeek = getLogsThisWeek();
  const doneCount = logsThisWeek.length;
  const totalDays = program.days.length;
  const weekNum = currentISOWeekNumber();

  const todayDow = (new Date().getDay() + 6) % 7; // 0=Mon
  const todayTemplate = program.days.find(d => d.dayOfWeek === todayDow);
  const isRestDay = !todayTemplate;

  // Next workout
  const upcomingDays = program.days
    .filter(d => d.dayOfWeek > todayDow)
    .sort((a, b) => a.dayOfWeek - b.dayOfWeek);
  const nextDay = upcomingDays[0] ?? program.days[0];

  // Best suggestion for today's workout
  const suggestion = todayTemplate ? getTodaySuggestion(todayTemplate, logsThisWeek) : null;

  const greeting = getGreeting();
  const name = state.profile.displayName || '';

  return `
    <div class="page active">
      <div style="margin-bottom:0.5rem;color:var(--text-secondary);font-size:0.9rem">
        ${greeting}${name ? `, ${name}` : ''}
      </div>
      <div style="display:flex;align-items:baseline;gap:16px;margin-bottom:1.5rem">
        <div class="page-title" style="margin:0">Week ${weekNum}</div>
        <div style="color:var(--text-secondary);font-size:0.9rem">${doneCount} of ${totalDays} days done</div>
      </div>

      ${isRestDay ? renderRestDay(nextDay) : renderWorkoutCard(todayTemplate, suggestion, weekNum)}

      ${nextDay && !isRestDay ? `
        <div style="color:var(--text-muted);font-size:0.82rem;margin-top:1rem;text-align:center">
          ${doneCount < totalDays - 1 ? `Rest tomorrow · ` : ''}Next: ${nextDay.name} ${DAY_NAMES[nextDay.dayOfWeek]}
        </div>
      ` : ''}
    </div>
  `;
}

function renderWorkoutCard(template, suggestion, weekNum) {
  return `
    <div class="card" style="cursor:pointer;border-color:var(--accent)" onclick="startWorkout('${template.id}')">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px">
        <div>
          <div style="font-size:1.2rem;font-weight:700">${template.name}</div>
          <div style="color:var(--text-secondary);font-size:0.85rem">${template.slots.length} exercises · Week ${weekNum}</div>
        </div>
      </div>
      ${suggestion ? `
        <div style="background:var(--bg-elevated);border-radius:var(--radius-sm);padding:10px 14px;margin-bottom:14px;font-size:0.85rem;color:var(--accent-secondary)">
          💡 ${suggestion}
        </div>
      ` : ''}
      <button class="btn btn-accent" style="width:100%;font-size:1rem;padding:14px" onclick="event.stopPropagation();startWorkout('${template.id}')">
        Start Workout
      </button>
    </div>
  `;
}

function renderRestDay(nextDay) {
  const streak = computeStreak();
  return `
    <div class="card" style="text-align:center;padding:2rem">
      <div style="font-size:3rem;margin-bottom:12px">🧘</div>
      <div style="font-size:1.1rem;font-weight:600;margin-bottom:8px">Rest Day</div>
      ${streak > 1 ? `<div style="color:var(--accent-amber);font-size:0.9rem">🔥 ${streak} week streak</div>` : ''}
      <div style="color:var(--text-secondary);font-size:0.85rem;margin-top:8px">
        ${nextDay ? `Next up: ${nextDay.name} on ${DAY_NAMES[nextDay.dayOfWeek]}` : 'Great work this week!'}
      </div>
    </div>
  `;
}

function renderNoProgram() {
  return `
    <div class="page active" style="text-align:center;padding:3rem 1rem">
      <div style="font-size:3rem;margin-bottom:16px">🏋</div>
      <div class="page-title">No program active</div>
      <div class="page-subtitle" style="margin-bottom:2rem">Pick a program to get started</div>
      <button class="btn btn-accent" onclick="navigateTo('build')">Browse Programs</button>
    </div>
  `;
}

function getTodaySuggestion(template, logsThisWeek) {
  // Find last week's log for this template
  const lastLog = Object.values(state.logs)
    .filter(l => l.workoutTemplateId === template.id)
    .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

  if (!lastLog) return null;

  // Find highest-load exercise that's going up
  for (const slot of template.slots) {
    const prevSets = lastLog.sets.filter(s => s.exerciseSlotId === slot.id && s.completed);
    if (!prevSets.length || !slot.targetLoadKg) continue;
    const prevLoad = Math.max(...prevSets.map(s => s.weight || 0));
    if (slot.targetLoadKg > prevLoad) {
      const ex = getExerciseName(slot.exerciseId);
      return `${ex}: try ${slot.targetLoadKg}kg today ↑`;
    }
  }
  return null;
}

function getExerciseName(exerciseId) {
  if (state.exercises[exerciseId]) return state.exercises[exerciseId].name;
  const builtin = BUILTIN_EXERCISES.find(e => e.id === exerciseId);
  if (builtin) return builtin.name;
  return exerciseId;
}

function computeStreak() {
  const pid = state.profile.activeProgramId;
  if (!pid) return 0;
  const logs = Object.values(state.logs).filter(l => l.programId === pid);
  if (!logs.length) return 0;

  // Get ISO week number for an arbitrary date
  function isoWeek(date) {
    const d = new Date(date);
    d.setHours(0,0,0,0);
    d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
    const week1 = new Date(d.getFullYear(), 0, 4);
    return 1 + Math.round(((d - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
  }

  // Build set of (year-week) strings that have at least one log
  const weekKeys = new Set(logs.map(l => {
    const d = new Date(l.date);
    return `${d.getFullYear()}-${isoWeek(d)}`;
  }));

  // Count consecutive weeks going backwards from current week
  let streak = 0;
  const now = new Date();
  for (let i = 0; i < 52; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() - i * 7);
    const key = `${d.getFullYear()}-${isoWeek(d)}`;
    if (weekKeys.has(key)) streak++;
    else if (i > 0) break; // gap found — stop
  }
  return streak;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

// Global handlers
window.startWorkout = function(templateId) {
  pushSubPage({ type: 'workout', templateId });
};

window.navigateTo = function(tab) {
  import('../router.js').then(r => r.navigateTo(tab));
};
```

- [ ] Commit:
```bash
git add js/render/today.js
git commit -m "feat: Today screen"
```

---

### Task 9: Active workout screen

**Files:**
- Create: `js/render/workout.js`

- [ ] Create `js/render/workout.js`:
```js
import { state, getActiveProgram, saveLog, saveProgram, currentISOWeekNumber } from '../state.js';
import { makeWorkoutLog, makeSetLog } from '../schema.js';
import { popSubPage, rerender } from '../router.js';
import { currentUser, db } from '../auth.js';
import { pushDoc } from '../firestore.js';
import { BUILTIN_EXERCISES, getAllExercises } from '../data.js';

// Active session state (in-memory only, not persisted until finish)
let session = null;

export function startSession(templateId) {
  const program = getActiveProgram();
  const template = program?.days.find(d => d.id === templateId);
  if (!template) return;

  session = {
    log: makeWorkoutLog({ programId: program.id, workoutTemplateId: template.id }),
    template,
    currentSlotIdx: 0,
    swaps: [], // { slotId, originalExerciseId, newExerciseId }
  };
  rerender();
}

export function renderWorkout(subPage) {
  if (!subPage || subPage.type !== 'workout') return '';
  if (!session || session.template.id !== subPage.templateId) {
    startSession(subPage.templateId);
    return '<div class="page active"><div style="text-align:center;padding:2rem">Loading...</div></div>';
  }
  return renderActiveWorkout();
}

function renderActiveWorkout() {
  const { template, currentSlotIdx, log } = session;
  const slot = template.slots[currentSlotIdx];
  if (!slot) return '';

  const total = template.slots.length;
  const pct = Math.round((currentSlotIdx / total) * 100);

  // Last week's reference sets for this slot
  const lastSets = getLastWeekSets(slot.id);

  // Current session's logged sets for this slot
  const currentSets = log.sets.filter(s => s.exerciseSlotId === slot.id);
  const targetSets = slot.targetSets;

  const exName = getExName(slot.exerciseId);
  const loadHint = slot.targetLoadKg ? `Try ${slot.targetLoadKg}kg ↑` : '';

  return `
    <div class="page active">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">
        <div style="font-weight:600">${template.name} — Week ${currentISOWeekNumber()}</div>
        <button class="btn btn-accent" onclick="finishWorkout()">Finish</button>
      </div>

      <div style="margin-bottom:1.5rem">
        <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:4px">${currentSlotIdx + 1} / ${total}</div>
        <div style="background:var(--bg-elevated);border-radius:4px;height:6px">
          <div style="background:var(--accent);height:6px;border-radius:4px;width:${pct}%;transition:width .3s"></div>
        </div>
      </div>

      <div class="card">
        <div style="font-size:1.3rem;font-weight:700;margin-bottom:4px">${exName}</div>
        <div style="color:var(--text-secondary);font-size:0.85rem;margin-bottom:1rem">
          Target: ${targetSets}×${slot.targetRepsMin}–${slot.targetRepsMax}
          ${loadHint ? `· ${loadHint}` : ''}
        </div>

        <table style="width:100%;border-collapse:collapse">
          <thead>
            <tr>
              <th style="text-align:left;font-size:0.7rem;color:var(--text-muted);padding:4px 8px">SET</th>
              <th style="font-size:0.7rem;color:var(--text-muted);padding:4px 8px">LAST WEEK</th>
              <th style="font-size:0.7rem;color:var(--text-muted);padding:4px 8px">KG</th>
              <th style="font-size:0.7rem;color:var(--text-muted);padding:4px 8px">REPS</th>
              <th style="font-size:0.7rem;color:var(--text-muted);padding:4px 8px">✓</th>
            </tr>
          </thead>
          <tbody>
            ${Array.from({ length: targetSets }, (_, i) => {
              const existing = currentSets.find(s => s.setNumber === i + 1);
              const lastSet = lastSets[i];
              return `
                <tr>
                  <td style="padding:6px 8px;color:var(--text-secondary);font-size:0.85rem">${i + 1}</td>
                  <td style="padding:6px 8px;text-align:center;font-size:0.8rem;color:var(--text-muted)">
                    ${lastSet ? `${lastSet.weight||'—'}kg × ${lastSet.reps||'—'}` : '—'}
                  </td>
                  <td style="padding:4px 6px">
                    <input class="db-log-input" type="number" placeholder="kg" step="0.5"
                      value="${existing?.weight || ''}"
                      onchange="logSet('${slot.id}', '${slot.exerciseId}', ${i+1}, 'weight', this.value)">
                  </td>
                  <td style="padding:4px 6px">
                    <input class="db-log-input" type="number" placeholder="reps"
                      value="${existing?.reps || ''}"
                      onchange="logSet('${slot.id}', '${slot.exerciseId}', ${i+1}, 'reps', this.value)">
                  </td>
                  <td style="padding:4px 6px;text-align:center">
                    <input type="checkbox" ${existing?.completed ? 'checked' : ''}
                      onchange="markComplete('${slot.id}', '${slot.exerciseId}', ${i+1}, this.checked)"
                      style="width:20px;height:20px;cursor:pointer">
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        <button class="btn btn-ghost" style="margin-top:8px;font-size:0.8rem"
          onclick="addSet('${slot.id}', '${slot.exerciseId}', ${targetSets + currentSets.filter(s=>s.setNumber > slot.targetSets).length + 1})">
          + Add set
        </button>
      </div>

      <div style="display:flex;gap:10px;margin-top:1rem;flex-wrap:wrap">
        <button class="btn btn-ghost" onclick="swapExercise('${slot.id}', '${slot.exerciseId}')">Swap</button>
        <button class="btn btn-ghost" onclick="skipExercise('${slot.id}', '${slot.exerciseId}', ${targetSets})">Skip</button>
        ${currentSlotIdx > 0 ? `<button class="btn btn-ghost" onclick="prevSlot()">← Prev</button>` : ''}
        ${currentSlotIdx < total - 1 ? `<button class="btn btn-accent" onclick="nextSlot()">Next →</button>` : ''}
      </div>

      <div class="card" style="margin-top:1rem">
        <div style="font-size:0.8rem;color:var(--text-muted);margin-bottom:4px">Session notes</div>
        <textarea class="notes-area" placeholder="How does it feel?"
          onchange="session.log.notes=this.value">${session.log.notes}</textarea>
      </div>
    </div>
  `;
}

function getLastWeekSets(slotId) {
  const program = getActiveProgram();
  if (!program) return [];
  const templateId = session?.template.id;
  const logs = Object.values(state.logs)
    .filter(l => l.workoutTemplateId === templateId && l.id !== session?.log.id)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  const lastLog = logs[0];
  if (!lastLog) return [];
  return lastLog.sets.filter(s => s.exerciseSlotId === slotId).sort((a, b) => a.setNumber - b.setNumber);
}

function getExName(exerciseId) {
  if (state.exercises[exerciseId]) return state.exercises[exerciseId].name;
  const builtin = (typeof BUILTIN_EXERCISES !== 'undefined' ? BUILTIN_EXERCISES : []).find(e => e.id === exerciseId);
  if (builtin) return builtin.name;
  return exerciseId;
}

function upsertSet(slotId, exerciseId, setNumber, patch) {
  if (!session) return;
  const idx = session.log.sets.findIndex(s => s.exerciseSlotId === slotId && s.setNumber === setNumber);
  if (idx >= 0) {
    session.log.sets[idx] = { ...session.log.sets[idx], ...patch };
  } else {
    session.log.sets.push(makeSetLog({ exerciseSlotId: slotId, exerciseId, setNumber, ...patch }));
  }
}

// Global handlers
window.logSet = function(slotId, exerciseId, setNumber, field, value) {
  upsertSet(slotId, exerciseId, setNumber, { [field]: field === 'reps' ? parseInt(value) : parseFloat(value) });
};

window.markComplete = function(slotId, exerciseId, setNumber, checked) {
  upsertSet(slotId, exerciseId, setNumber, { completed: checked });
  rerender();
};

window.addSet = function(slotId, exerciseId, setNumber) {
  upsertSet(slotId, exerciseId, setNumber, {});
  rerender();
};

window.swapExercise = function(slotId, originalExerciseId) {
  // Open exercise picker inline, on selection record the swap session-scoped
  const el = document.getElementById('main-content');
  const all = getAllExercises(state.exercises);
  el.insertAdjacentHTML('beforeend', `
    <div id="swap-overlay" style="position:fixed;inset:0;background:rgba(0,0,0,.8);z-index:200;overflow-y:auto;padding:1rem">
      <div style="background:var(--bg-card);border-radius:var(--radius);padding:1.5rem;max-width:500px;margin:2rem auto">
        <div style="font-weight:600;margin-bottom:1rem">Swap exercise</div>
        <input class="db-search" type="text" placeholder="Search..." style="width:100%;margin-bottom:1rem"
          oninput="filterSwapPicker(this.value,'${slotId}','${originalExerciseId}')">
        <div id="swap-picker-list">
          ${all.slice(0, 40).map(ex => `
            <div style="padding:8px;border-bottom:1px solid var(--border-subtle);cursor:pointer"
              onclick="selectSwap('${slotId}','${originalExerciseId}','${ex.id}','${ex.name.replace(/'/g,"\\'")}')">
              ${ex.name} <span style="font-size:0.75rem;color:var(--text-muted)">${ex.muscleGroup}</span>
            </div>
          `).join('')}
        </div>
        <button class="btn btn-ghost" style="margin-top:1rem" onclick="document.getElementById('swap-overlay').remove()">Cancel</button>
      </div>
    </div>
  `);
};

window.filterSwapPicker = function(query, slotId, originalExerciseId) {
  const all = getAllExercises(state.exercises);
  const filtered = query
    ? all.filter(ex => ex.name.toLowerCase().includes(query.toLowerCase()))
    : all.slice(0, 40);
  const list = document.getElementById('swap-picker-list');
  if (!list) return;
  list.innerHTML = filtered.slice(0, 40).map(ex => `
    <div style="padding:8px;border-bottom:1px solid var(--border-subtle);cursor:pointer"
      onclick="selectSwap('${slotId}','${originalExerciseId}','${ex.id}','${ex.name.replace(/'/g,"\\'")}')">
      ${ex.name} <span style="font-size:0.75rem;color:var(--text-muted)">${ex.muscleGroup}</span>
    </div>
  `).join('');
};

window.selectSwap = function(slotId, originalExerciseId, newExerciseId, newName) {
  if (!session) return;
  // Record the swap
  const originalName = getExName(originalExerciseId);
  session.swaps.push({ slotId, originalExerciseId, newExerciseId, originalName, newName });
  // Update this slot's exerciseId for the rest of the session (session-scoped)
  const slot = session.template.slots.find(s => s.id === slotId);
  if (slot) slot._sessionExerciseId = newExerciseId; // temporary override
  document.getElementById('swap-overlay')?.remove();
  rerender();
};

window.skipExercise = function(slotId, exerciseId, targetSets) {
  for (let i = 1; i <= targetSets; i++) {
    upsertSet(slotId, exerciseId, i, { completed: false, skipped: true, weight: null, reps: null });
  }
  nextSlot();
};

window.nextSlot = function() {
  if (!session) return;
  session.currentSlotIdx = Math.min(session.currentSlotIdx + 1, session.template.slots.length - 1);
  rerender();
};

window.prevSlot = function() {
  if (!session) return;
  session.currentSlotIdx = Math.max(session.currentSlotIdx - 1, 0);
  rerender();
};

window.finishWorkout = function() {
  if (!session) return;

  // Check minimum completion
  const completedSets = session.log.sets.filter(s => s.completed);
  if (completedSets.length === 0) {
    alert('Log at least one completed set before finishing.');
    return;
  }

  // Check many unstarted
  const startedSlots = new Set(session.log.sets.filter(s => s.completed || s.skipped).map(s => s.exerciseSlotId));
  const unstartedCount = session.template.slots.filter(sl => !startedSlots.has(sl.id)).length;
  if (unstartedCount > 3 && !confirm(`${unstartedCount} exercises not started — finish anyway?`)) return;

  // Write unstarted sets
  for (const slot of session.template.slots) {
    for (let i = 1; i <= slot.targetSets; i++) {
      const exists = session.log.sets.find(s => s.exerciseSlotId === slot.id && s.setNumber === i);
      if (!exists) {
        session.log.sets.push(makeSetLog({ exerciseSlotId: slot.id, exerciseId: slot.exerciseId, setNumber: i, completed: false, skipped: false }));
      }
    }
  }

  // Show swap consolidation if any swaps
  if (session.swaps.length > 0) {
    showSwapPrompt(() => commitFinish());
    return;
  }

  commitFinish();
};

function commitFinish() {
  session.log.completedAt = new Date().toISOString();

  // Rating prompt (simple)
  const rating = prompt('Rate this session 1–5 (or skip):');
  if (rating) session.log.sessionRating = Math.min(5, Math.max(1, parseInt(rating))) || null;

  saveLog(session.log);

  // Push to Firestore
  if (currentUser && db) pushDoc(db, currentUser.uid, 'logs', session.log);

  session = null;
  popSubPage();
  showToast('✓ Workout saved!');
}

function showSwapPrompt(onConfirm) {
  const el = document.getElementById('main-content');
  const swapsHtml = session.swaps.map((sw, i) => `
    <label style="display:flex;align-items:center;gap:8px;margin-bottom:8px;cursor:pointer">
      <input type="checkbox" id="swap-${i}" checked style="width:18px;height:18px">
      Replace ${sw.originalName} → ${sw.newName}
    </label>
  `).join('');

  el.innerHTML = `
    <div class="page active">
      <div class="page-title">Update your program?</div>
      <div class="page-subtitle">You made some exercise swaps this session</div>
      <div class="card" style="margin-top:1rem">${swapsHtml}</div>
      <div style="display:flex;gap:10px;margin-top:1.5rem">
        <button class="btn btn-accent" onclick="confirmSwaps()">Confirm</button>
        <button class="btn btn-ghost" onclick="skipSwaps()">Don't update</button>
      </div>
    </div>
  `;

  window.confirmSwaps = function() {
    session.swaps.forEach((sw, i) => {
      if (document.getElementById(`swap-${i}`)?.checked) {
        const program = getActiveProgram();
        const day = program?.days.find(d => d.id === session.template.id);
        const slot = day?.slots.find(s => s.id === sw.slotId);
        if (slot) slot.exerciseId = sw.newExerciseId;
      }
    });
    const prog = getActiveProgram();
    if (prog) saveProgram(prog);
    onConfirm();
  };
  window.skipSwaps = function() { onConfirm(); };
}

function showToast(msg) {
  const t = document.getElementById('save-toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('visible');
  setTimeout(() => t.classList.remove('visible'), 2000);
}
```

- [ ] Commit:
```bash
git add js/render/workout.js
git commit -m "feat: active workout screen with logging, skip, swap, finish"
```

---

### Task 10: Train screen + engine review UI

**Files:**
- Create: `js/render/train.js`

- [ ] Create `js/render/train.js`:
```js
import { state, getActiveProgram, getLogsThisWeek, currentISOWeekNumber, saveSuggestion, saveProgram } from '../state.js';
import { generateSuggestions } from '../engine.js';
import { currentUser, db } from '../auth.js';
import { pushDoc } from '../firestore.js';
import { rerender } from '../router.js';

export function renderTrain(subPage) {
  if (subPage?.type === 'review') return renderReview();
  return renderHistory();
}

function renderHistory() {
  const logs = Object.values(state.logs)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 20);

  const program = getActiveProgram();
  const pendingSuggestions = Object.values(state.suggestions)
    .filter(s => s.accepted === null && s.programId === program?.id);

  const lastSyncAge = state.lastSyncAt
    ? Math.floor((Date.now() - new Date(state.lastSyncAt)) / (7 * 24 * 60 * 60 * 1000))
    : null;

  const stalenessWarning = (!currentUser && lastSyncAge !== null && lastSyncAge > 8)
    ? `<div class="card" style="background:rgba(245,158,11,.1);border-color:var(--accent-amber);margin-bottom:1rem">
         ⚠ Your data may be out of date — sign in to sync before reviewing.
       </div>` : '';

  return `
    <div class="page active">
      <div class="page-title">Train</div>

      ${stalenessWarning}

      ${pendingSuggestions.length > 0 ? `
        <div class="card" style="border-color:var(--accent-secondary);margin-bottom:1.5rem">
          <div style="font-weight:600;margin-bottom:8px">📋 Week ${currentISOWeekNumber()} review ready</div>
          <div style="color:var(--text-secondary);font-size:0.85rem;margin-bottom:12px">
            ${pendingSuggestions.length} suggestions waiting
          </div>
          <button class="btn btn-accent" onclick="pushSubPage({type:'review'})">Review Now</button>
        </div>
      ` : `
        <div style="display:flex;justify-content:flex-end;margin-bottom:1rem">
          <button class="btn btn-ghost" onclick="triggerEngine()">Review this week</button>
        </div>
      `}

      <div class="card">
        <div class="section-label" style="margin-bottom:1rem">Recent Sessions</div>
        ${logs.length === 0 ? '<div style="color:var(--text-muted)">No sessions logged yet.</div>' :
          logs.map(log => {
            const completedSets = log.sets.filter(s => s.completed).length;
            const date = new Date(log.date).toLocaleDateString();
            return `
              <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border-subtle)">
                <div>
                  <div style="font-weight:500;font-size:0.9rem">${getTemplateName(log.workoutTemplateId)}</div>
                  <div style="color:var(--text-muted);font-size:0.78rem">${date} · ${completedSets} sets completed ${log.sessionRating ? `· ${log.sessionRating}/5` : ''}</div>
                </div>
              </div>
            `;
          }).join('')}
      </div>
    </div>
  `;
}

function renderReview() {
  const program = getActiveProgram();
  if (!program) return '<div class="page active"><p>No active program.</p></div>';

  const weekLogs = getLogsThisWeek();
  const currentWeek = currentISOWeekNumber();
  const suggestions = generateSuggestions(program, weekLogs, currentWeek);

  const allScheduledComplete = program.days.every(d =>
    weekLogs.some(l => l.workoutTemplateId === d.id)
  );

  const hasLowRating = weekLogs.some(l => l.sessionRating !== null && l.sessionRating <= 2);

  return `
    <div class="page active">
      <div class="db-detail-back" onclick="popSubPage()">← Back</div>
      <div class="page-title">Week ${currentWeek} Review</div>
      ${!allScheduledComplete ? `<div style="color:var(--accent-amber);font-size:0.85rem;margin-bottom:1rem">⚠ Not all sessions complete — suggestions may be incomplete.</div>` : ''}
      ${hasLowRating ? `<div style="color:var(--accent-amber);font-size:0.85rem;margin-bottom:1rem">⚠ Tough week noted — suggestions are conservative.</div>` : ''}

      <div class="card">
        ${suggestions.map(sug => {
          const slot = findSlot(program, sug.exerciseSlotId);
          const exName = slot ? getExName(slot.exerciseId) : sug.exerciseSlotId;
          const icon = sug.suggestedChange === 'increase' ? '↑' : sug.suggestedChange === 'deload' ? '↓' : '→';
          const color = sug.suggestedChange === 'increase' ? 'var(--accent-secondary)' : sug.suggestedChange === 'deload' ? 'var(--accent)' : 'var(--text-secondary)';
          return `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border-subtle)">
              <div>
                <div style="font-weight:500;font-size:0.9rem">${exName}</div>
                <div style="color:var(--text-muted);font-size:0.78rem">${sug.reason}</div>
              </div>
              <div style="color:${color};font-weight:700;font-size:1rem;margin-left:12px">
                ${icon} ${sug.newTargetKg != null ? sug.newTargetKg + 'kg' : ''} ${sug.newTargetRepsMax != null ? '× ' + sug.newTargetRepsMax + ' reps' : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <div style="display:flex;gap:10px;margin-top:1.5rem;flex-wrap:wrap">
        <button class="btn btn-accent" onclick="acceptAllSuggestions(${JSON.stringify(suggestions).replace(/"/g, '&quot;')})">Accept All</button>
        <button class="btn btn-ghost" onclick="reviewEach(${JSON.stringify(suggestions).replace(/"/g, '&quot;')}, 0)">Review Each</button>
        <button class="btn btn-ghost" onclick="popSubPage()">Skip for now</button>
      </div>
    </div>
  `;
}

function getTemplateName(templateId) {
  const prog = getActiveProgram();
  return prog?.days.find(d => d.id === templateId)?.name ?? templateId;
}

function findSlot(program, slotId) {
  for (const day of program.days) {
    const slot = day.slots.find(s => s.id === slotId);
    if (slot) return slot;
  }
  return null;
}

function getExName(exerciseId) {
  return state.exercises[exerciseId]?.name ?? exerciseId;
}

// Global handlers
window.triggerEngine = function() {
  import('../router.js').then(r => r.pushSubPage({ type: 'review' }));
};

window.pushSubPage = function(sub) {
  import('../router.js').then(r => r.pushSubPage(sub));
};

window.popSubPage = function() {
  import('../router.js').then(r => r.popSubPage());
};

window.reviewEach = function(suggestions, idx) {
  if (idx >= suggestions.length) { window.popSubPage(); return; }
  const sug = suggestions[idx];
  const program = getActiveProgram();
  const slot = program ? findSlot(program, sug.exerciseSlotId) : null;
  const exName = slot ? getExName(slot.exerciseId) : sug.exerciseSlotId;
  const icon = sug.suggestedChange === 'increase' ? '↑' : sug.suggestedChange === 'deload' ? '↓' : '→';

  const el = document.getElementById('main-content');
  el.innerHTML = `
    <div class="page active">
      <div class="page-title">Review ${idx + 1} of ${suggestions.length}</div>
      <div class="card" style="margin-top:1rem">
        <div style="font-size:1.1rem;font-weight:600">${exName}</div>
        <div style="font-size:1.5rem;font-weight:700;margin:12px 0">${icon} ${sug.newTargetKg != null ? sug.newTargetKg+'kg' : ''} ${sug.newTargetRepsMax != null ? '× '+sug.newTargetRepsMax+' reps' : ''}</div>
        <div style="color:var(--text-secondary);font-size:0.85rem">${sug.reason}</div>
      </div>
      <div style="display:flex;gap:10px;margin-top:1.5rem">
        <button class="btn btn-accent" onclick="acceptOneSuggestion(${JSON.stringify(sug).replace(/"/g,'&quot;')}, ${JSON.stringify(suggestions).replace(/"/g,'&quot;')}, ${idx})">Accept</button>
        <button class="btn btn-ghost" onclick="reviewEach(${JSON.stringify(suggestions).replace(/"/g,'&quot;')}, ${idx+1})">Skip this one</button>
      </div>
    </div>
  `;
};

window.acceptOneSuggestion = function(sug, suggestions, idx) {
  const program = getActiveProgram();
  if (program) {
    for (const day of program.days) {
      const slot = day.slots.find(s => s.id === sug.exerciseSlotId);
      if (slot) {
        if (sug.newTargetKg !== null) slot.targetLoadKg = sug.newTargetKg;
        if (sug.newTargetRepsMax !== null) slot.targetRepsMax = sug.newTargetRepsMax;
        if (sug.suggestedChange === 'increase') slot.lastProgressedWeek = currentISOWeekNumber();
      }
    }
    saveProgram(program);
  }
  const savedSug = { ...sug, accepted: true };
  saveSuggestion(savedSug);
  window.reviewEach(suggestions, idx + 1);
};

window.acceptAllSuggestions = function(suggestions) {
  const program = getActiveProgram();
  if (!program) return;

  for (const sug of suggestions) {
    // Update slot in program
    for (const day of program.days) {
      const slot = day.slots.find(s => s.id === sug.exerciseSlotId);
      if (slot) {
        if (sug.newTargetKg !== null) slot.targetLoadKg = sug.newTargetKg;
        if (sug.newTargetRepsMax !== null) slot.targetRepsMax = sug.newTargetRepsMax;
        if (sug.suggestedChange === 'increase') slot.lastProgressedWeek = currentISOWeekNumber();
      }
    }

    const savedSug = { ...sug, accepted: true };
    saveSuggestion(savedSug);
    if (currentUser && db) pushDoc(db, currentUser.uid, 'suggestions', savedSug);
  }

  saveProgram(program);
  if (currentUser && db) pushDoc(db, currentUser.uid, 'programs', program);

  window.popSubPage();
};
```

- [ ] Commit:
```bash
git add js/render/train.js
git commit -m "feat: Train screen — history, engine trigger, review UI"
```

---

### Task 11: Build screen + Me screen

**Files:**
- Create: `js/render/build.js`
- Create: `js/render/me.js`

- [ ] Create `js/render/me.js`:
```js
import { state, updateProfile } from '../state.js';
import { signIn, signOut, currentUser } from '../auth.js';
import { rerender } from '../router.js';

export function renderMe() {
  const p = state.profile;
  const name = currentUser?.displayName || currentUser?.email || 'Not signed in';

  return `
    <div class="page active">
      <div class="page-title">Me</div>

      <div class="card" style="margin-bottom:1rem">
        <div class="card-title" style="margin-bottom:12px">☁ Account</div>
        ${currentUser ? `
          <div style="color:var(--text-secondary);font-size:0.9rem;margin-bottom:12px">Signed in as ${name}</div>
          <button class="btn btn-ghost" onclick="firebase.auth().signOut()">Sign Out</button>
        ` : `
          <div style="color:var(--text-secondary);font-size:0.85rem;margin-bottom:12px">Sign in to sync across devices</div>
          <button class="btn btn-accent" onclick="signIn()">Sign In with Google</button>
        `}
      </div>

      <div class="card" style="margin-bottom:1rem">
        <div class="card-title" style="margin-bottom:12px">Profile</div>
        <div class="metric-row">
          <span class="metric-name">Level</span>
          <select class="db-search" style="width:auto" onchange="updateProfile({level:this.value})">
            ${['beginner','intermediate','advanced'].map(l => `<option value="${l}" ${p.level===l?'selected':''}>${l}</option>`).join('')}
          </select>
        </div>
        <div class="metric-row" style="margin-top:8px">
          <span class="metric-name">Days/week preference</span>
          <select class="db-search" style="width:auto" onchange="updateProfile({daysPerWeek:+this.value})">
            ${[2,3,4,5,6].map(n => `<option value="${n}" ${p.daysPerWeek===n?'selected':''}>${n}</option>`).join('')}
          </select>
        </div>
      </div>

      <div class="card">
        <div class="card-title" style="margin-bottom:12px">💾 Data</div>
        <div class="data-actions">
          <button class="btn btn-accent" onclick="exportData()">Export Backup</button>
          <button class="btn btn-ghost" onclick="document.getElementById('import-input').click()">Import Backup</button>
          <input type="file" id="import-input" accept=".json" style="display:none" onchange="importData(event)">
          <button class="btn btn-ghost" onclick="if(confirm('Clear ALL data?')){localStorage.clear();location.reload()}">Reset All</button>
        </div>
      </div>
    </div>
  `;
}

// Expose auth functions globally for inline onclick handlers
window.signIn = signIn;

window.updateProfile = function(patch) {
  updateProfile(patch);
  rerender();
};

window.exportData = function() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(blob),
    download: `iron-protocol-${new Date().toISOString().slice(0,10)}.json`,
  });
  a.click();
};

window.importData = function(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const imported = JSON.parse(e.target.result);
      Object.assign(state, imported);
      import('../state.js').then(m => m.saveState());
      location.reload();
    } catch { alert('Invalid backup file.'); }
  };
  reader.readAsText(file);
};
```

- [ ] Create `js/render/build.js` (program browser + builder):
```js
import { state, getActiveProgram, saveProgram, saveExercise, updateProfile } from '../state.js';
import { BUILTIN_PROGRAMS, BUILTIN_EXERCISES, getAllExercises, parseDarebeeExercise } from '../data.js';
import { makeProgram, makeWorkoutTemplate, makeExerciseSlot, makeExercise } from '../schema.js';
import { pushSubPage, popSubPage, currentSubPage, rerender } from '../router.js';
import { currentUser, db } from '../auth.js';
import { pushDoc } from '../firestore.js';

export function renderBuild(subPage) {
  if (subPage?.type === 'program-editor') return renderProgramEditor(subPage.programId);
  if (subPage?.type === 'workout-editor') return renderWorkoutEditor(subPage.programId, subPage.templateId);
  if (subPage?.type === 'darebee-browser') return renderDarebeeBrowser();
  return renderBuildHome();
}

function renderBuildHome() {
  const userPrograms = Object.values(state.programs);
  const allPrograms = [...BUILTIN_PROGRAMS, ...userPrograms.filter(p => !p.isTemplate)];

  return `
    <div class="page active">
      <div class="page-title">Build</div>

      <div style="display:flex;gap:10px;margin-bottom:1.5rem;flex-wrap:wrap">
        <button class="btn btn-accent" onclick="newProgram()">+ New Program</button>
        <button class="btn btn-ghost" onclick="pushSubPage({type:'darebee-browser'})">Browse Darebee</button>
      </div>

      <div class="card">
        <div class="section-label" style="margin-bottom:1rem">Programs</div>
        ${allPrograms.map(p => `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border-subtle)">
            <div>
              <div style="font-weight:500">${p.name} ${p.isTemplate ? '<span style="font-size:0.7rem;color:var(--text-muted)">(template)</span>' : ''}</div>
              <div style="font-size:0.78rem;color:var(--text-muted)">${p.days.length} days · ${p.totalWeeks} weeks</div>
            </div>
            <div style="display:flex;gap:8px">
              <button class="btn btn-ghost" style="font-size:0.78rem;padding:4px 10px" onclick="useProgram('${p.id}')">Use</button>
              <button class="btn btn-ghost" style="font-size:0.78rem;padding:4px 10px" onclick="editProgram('${p.id}')">Edit</button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderProgramEditor(programId) {
  const prog = getProgram(programId);
  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

  return `
    <div class="page active">
      <div class="db-detail-back" onclick="popSubPage()">← Back</div>
      <input class="db-search" style="font-size:1.1rem;font-weight:600;margin-bottom:1rem;width:100%"
        value="${prog.name}" placeholder="Program name"
        onchange="updateProgramField('${programId}','name',this.value)">

      <div style="display:flex;gap:10px;margin-bottom:1rem;flex-wrap:wrap">
        <label style="font-size:0.85rem;color:var(--text-secondary)">
          Weeks:
          <input type="number" class="db-log-input" min="1" max="16" value="${prog.totalWeeks}"
            onchange="updateProgramField('${programId}','totalWeeks',+this.value)">
        </label>
      </div>

      <div class="card">
        <div class="section-label" style="margin-bottom:1rem">Week Design</div>
        ${days.map((day, dow) => {
          const template = prog.days.find(d => d.dayOfWeek === dow);
          return `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border-subtle)">
              <div style="font-weight:500;min-width:40px">${day}</div>
              ${template ? `
                <div style="flex:1;margin:0 12px;color:var(--text-secondary);font-size:0.85rem">${template.name} (${template.slots.length} exercises)</div>
                <button class="btn btn-ghost" style="font-size:0.78rem;padding:4px 10px"
                  onclick="pushSubPage({type:'workout-editor',programId:'${programId}',templateId:'${template.id}'})">Edit</button>
              ` : `
                <div style="flex:1;margin:0 12px;color:var(--text-muted);font-size:0.85rem">Rest</div>
                <button class="btn btn-ghost" style="font-size:0.78rem;padding:4px 10px"
                  onclick="addWorkoutDay('${programId}',${dow})">+ Add</button>
              `}
            </div>
          `;
        }).join('')}
      </div>

      <button class="btn btn-accent" style="margin-top:1rem"
        onclick="saveAndBack('${programId}')">Save Program</button>
    </div>
  `;
}

function renderWorkoutEditor(programId, templateId) {
  const prog = getProgram(programId);
  const template = prog.days.find(d => d.id === templateId);
  if (!template) return '';

  return `
    <div class="page active">
      <div class="db-detail-back" onclick="popSubPage()">← Back to program</div>
      <input class="db-search" style="font-size:1.1rem;font-weight:600;margin-bottom:1rem;width:100%"
        value="${template.name}" placeholder="Workout name"
        onchange="updateTemplateName('${programId}','${templateId}',this.value)">

      <div class="card">
        ${template.slots.map((slot, idx) => `
          <div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--border-subtle)">
            <div style="display:flex;flex-direction:column;gap:2px">
              <button style="background:none;border:none;color:var(--text-muted);cursor:pointer;padding:0;font-size:0.9rem" onclick="moveSlot('${programId}','${templateId}','${slot.id}',-1)">▲</button>
              <button style="background:none;border:none;color:var(--text-muted);cursor:pointer;padding:0;font-size:0.9rem" onclick="moveSlot('${programId}','${templateId}','${slot.id}',1)">▼</button>
            </div>
            <div style="flex:1">
              <div style="font-weight:500;font-size:0.9rem">${getExName(slot.exerciseId)}</div>
              <div style="font-size:0.75rem;color:var(--text-muted)">${slot.targetSets}×${slot.targetRepsMin}–${slot.targetRepsMax} ${slot.targetLoadKg ? `@ ${slot.targetLoadKg}kg` : ''} · ${slot.progressionRule}</div>
            </div>
            <button class="btn btn-ghost" style="font-size:0.72rem;padding:3px 8px" onclick="openSlotEditor('${programId}','${templateId}','${slot.id}')">Edit</button>
            <button style="background:none;border:none;color:var(--accent);cursor:pointer;font-size:0.9rem" onclick="deleteSlot('${programId}','${templateId}','${slot.id}')">✕</button>
          </div>
        `).join('')}

        <button class="btn btn-ghost" style="margin-top:12px;width:100%" onclick="openExercisePicker('${programId}','${templateId}')">
          + Add Exercise
        </button>
      </div>
    </div>
  `;
}

function renderDarebeeBrowser() {
  const workouts = typeof DAREBEE_WORKOUTS !== 'undefined' ? DAREBEE_WORKOUTS : [];
  return `
    <div class="page active">
      <div class="db-detail-back" onclick="popSubPage()">← Back</div>
      <div class="page-title" style="color:var(--accent-amber)">Darebee Workouts</div>
      <input class="db-search" type="text" placeholder="Search..." oninput="filterDarebee(this.value)" style="margin-bottom:1rem;width:100%">
      <div class="db-grid" id="darebee-grid">
        ${workouts.map((w, i) => `
          <div class="db-card" onclick="importDarebeeWorkout(${i})">
            <div class="db-card-name">${w.name}</div>
            <div class="db-card-meta">
              <span class="db-stars">${'★'.repeat(w.difficulty||3)}${'☆'.repeat(5-(w.difficulty||3))}</span>
              <span class="db-type-tag">${w.type}</span>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function getProgram(id) {
  return state.programs[id] ?? BUILTIN_PROGRAMS.find(p => p.id === id) ?? makeProgram();
}

function getExName(exerciseId) {
  return state.exercises[exerciseId]?.name ??
    BUILTIN_EXERCISES.find(e => e.id === exerciseId)?.name ??
    exerciseId;
}

// Global handlers
window.newProgram = function() {
  const prog = makeProgram({ name: 'My Program' });
  saveProgram(prog);
  pushSubPage({ type: 'program-editor', programId: prog.id });
};

window.editProgram = function(id) {
  // Clone template if needed
  if (BUILTIN_PROGRAMS.find(p => p.id === id)) {
    const clone = { ...JSON.parse(JSON.stringify(BUILTIN_PROGRAMS.find(p => p.id === id))),
      id: `${id}-${Date.now()}`, isTemplate: false, name: `${BUILTIN_PROGRAMS.find(p => p.id === id).name} (copy)` };
    saveProgram(clone);
    pushSubPage({ type: 'program-editor', programId: clone.id });
  } else {
    pushSubPage({ type: 'program-editor', programId: id });
  }
};

window.useProgram = function(id) {
  let pid = id;
  if (BUILTIN_PROGRAMS.find(p => p.id === id)) {
    const clone = { ...JSON.parse(JSON.stringify(BUILTIN_PROGRAMS.find(p => p.id === id))),
      id: `${id}-${Date.now()}`, isTemplate: false };
    saveProgram(clone);
    pid = clone.id;
  }
  updateProfile({ activeProgramId: pid });
  import('../router.js').then(r => r.navigateTo('today'));
};

window.updateProgramField = function(programId, field, value) {
  const prog = getProgram(programId);
  prog[field] = value;
  saveProgram(prog);
};

window.addWorkoutDay = function(programId, dow) {
  const prog = getProgram(programId);
  const template = makeWorkoutTemplate({ name: `Day ${prog.days.length + 1}`, dayOfWeek: dow });
  prog.days.push(template);
  saveProgram(prog);
  rerender();
};

window.updateTemplateName = function(programId, templateId, name) {
  const prog = getProgram(programId);
  const t = prog.days.find(d => d.id === templateId);
  if (t) { t.name = name; saveProgram(prog); }
};

window.moveSlot = function(programId, templateId, slotId, dir) {
  const prog = getProgram(programId);
  const t = prog.days.find(d => d.id === templateId);
  if (!t) return;
  const idx = t.slots.findIndex(s => s.id === slotId);
  const newIdx = idx + dir;
  if (newIdx < 0 || newIdx >= t.slots.length) return;
  [t.slots[idx], t.slots[newIdx]] = [t.slots[newIdx], t.slots[idx]];
  saveProgram(prog);
  rerender();
};

window.deleteSlot = function(programId, templateId, slotId) {
  const prog = getProgram(programId);
  const t = prog.days.find(d => d.id === templateId);
  if (t) { t.slots = t.slots.filter(s => s.id !== slotId); saveProgram(prog); rerender(); }
};

window.filterDarebee = function(query) {
  const workouts = typeof DAREBEE_WORKOUTS !== 'undefined' ? DAREBEE_WORKOUTS : [];
  const filtered = query
    ? workouts.filter(w => w.name.toLowerCase().includes(query.toLowerCase()))
    : workouts;
  const grid = document.getElementById('darebee-grid');
  if (!grid) return;
  grid.innerHTML = filtered.map((w, i) => `
    <div class="db-card" onclick="importDarebeeWorkout(${workouts.indexOf(w)})">
      <div class="db-card-name">${w.name}</div>
      <div class="db-card-meta">
        <span class="db-stars">${'★'.repeat(w.difficulty||3)}${'☆'.repeat(5-(w.difficulty||3))}</span>
        <span class="db-type-tag">${w.type}</span>
      </div>
    </div>
  `).join('');
};

window.filterExPicker = function(query, programId, templateId) {
  const all = getAllExercises(state.exercises);
  const filtered = query
    ? all.filter(ex => ex.name.toLowerCase().includes(query.toLowerCase()))
    : all.slice(0, 50);
  const list = document.getElementById('ex-picker-list');
  if (!list) return;
  list.innerHTML = filtered.slice(0, 50).map(ex => `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border-subtle);cursor:pointer"
      onclick="addExerciseToSlot('${programId}','${templateId}','${ex.id}')">
      <div>
        <div style="font-weight:500;font-size:0.9rem">${ex.name}</div>
        <div style="font-size:0.75rem;color:var(--text-muted)">${ex.muscleGroup} · ${ex.source}</div>
      </div>
    </div>
  `).join('');
};

window.openExercisePicker = function(programId, templateId) {
  const all = getAllExercises(state.exercises);
  const el = document.getElementById('main-content');
  el.innerHTML = `
    <div class="page active">
      <div class="db-detail-back" onclick="rerender()">← Back</div>
      <div class="page-title">Add Exercise</div>
      <input class="db-search" type="text" placeholder="Search..." oninput="filterExPicker(this.value,'${programId}','${templateId}')" style="margin-bottom:1rem;width:100%">
      <div id="ex-picker-list">
        ${all.slice(0, 50).map(ex => `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border-subtle);cursor:pointer"
            onclick="addExerciseToSlot('${programId}','${templateId}','${ex.id}')">
            <div>
              <div style="font-weight:500;font-size:0.9rem">${ex.name}</div>
              <div style="font-size:0.75rem;color:var(--text-muted)">${ex.muscleGroup} · ${ex.source}</div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
};

window.addExerciseToSlot = function(programId, templateId, exerciseId) {
  const prog = getProgram(programId);
  const t = prog.days.find(d => d.id === templateId);
  if (!t) return;
  t.slots.push(makeExerciseSlot({ exerciseId }));
  saveProgram(prog);
  pushSubPage({ type: 'workout-editor', programId, templateId });
};

window.openSlotEditor = function(programId, templateId, slotId) {
  const prog = getProgram(programId);
  const t = prog.days.find(d => d.id === templateId);
  const slot = t?.slots.find(s => s.id === slotId);
  if (!slot) return;

  const el = document.getElementById('main-content');
  el.innerHTML = `
    <div class="page active">
      <div class="db-detail-back" onclick="rerender()">← Back</div>
      <div class="page-title">Edit Exercise</div>
      <div class="card">
        <div class="calc-grid">
          <div class="calc-field">
            <label>Sets</label>
            <input class="calc-input" type="number" value="${slot.targetSets}"
              onchange="updateSlotField('${programId}','${templateId}','${slotId}','targetSets',+this.value)">
          </div>
          <div class="calc-field">
            <label>Reps min</label>
            <input class="calc-input" type="number" value="${slot.targetRepsMin}"
              onchange="updateSlotField('${programId}','${templateId}','${slotId}','targetRepsMin',+this.value)">
          </div>
          <div class="calc-field">
            <label>Reps max</label>
            <input class="calc-input" type="number" value="${slot.targetRepsMax}"
              onchange="updateSlotField('${programId}','${templateId}','${slotId}','targetRepsMax',+this.value)">
          </div>
          <div class="calc-field">
            <label>Load (kg)</label>
            <input class="calc-input" type="number" step="0.5" value="${slot.targetLoadKg ?? ''}"
              onchange="updateSlotField('${programId}','${templateId}','${slotId}','targetLoadKg',+this.value||null)">
          </div>
          <div class="calc-field">
            <label>Step (kg)</label>
            <input class="calc-input" type="number" step="0.5" value="${slot.progressionStepKg}"
              onchange="updateSlotField('${programId}','${templateId}','${slotId}','progressionStepKg',+this.value)">
          </div>
          <div class="calc-field">
            <label>Progression</label>
            <select class="calc-input" onchange="updateSlotField('${programId}','${templateId}','${slotId}','progressionRule',this.value)">
              ${['none','weight','reps','double','adaptive'].map(r =>
                `<option value="${r}" ${slot.progressionRule===r?'selected':''}>${r}</option>`
              ).join('')}
            </select>
          </div>
          <div class="calc-field">
            <label>Every N weeks</label>
            <input class="calc-input" type="number" min="1" value="${slot.progressionCadenceWeeks}"
              onchange="updateSlotField('${programId}','${templateId}','${slotId}','progressionCadenceWeeks',+this.value)">
          </div>
        </div>
      </div>
    </div>
  `;
};

window.updateSlotField = function(programId, templateId, slotId, field, value) {
  const prog = getProgram(programId);
  const t = prog.days.find(d => d.id === templateId);
  const slot = t?.slots.find(s => s.id === slotId);
  if (!slot) return;
  slot[field] = value;
  saveProgram(prog);
};

window.saveAndBack = function(programId) {
  const prog = getProgram(programId);
  saveProgram(prog);
  if (currentUser && db) pushDoc(db, currentUser.uid, 'programs', prog);
  popSubPage();
};

window.importDarebeeWorkout = function(idx) {
  const w = (typeof DAREBEE_WORKOUTS !== 'undefined' ? DAREBEE_WORKOUTS : [])[idx];
  if (!w) return;
  const parsed = (w.exercises || []).map(ex => parseDarebeeExercise(ex));
  const template = makeWorkoutTemplate({ name: w.name, slots: parsed.map(p => p.slot) });
  parsed.forEach(p => saveExercise(p.exercise));
  const prog = makeProgram({ name: w.name, days: [template] });
  saveProgram(prog);
  updateProfile({ activeProgramId: prog.id });
  import('../router.js').then(r => r.navigateTo('today'));
};

window.rerender = function() { import('../router.js').then(r => r.rerender()); };
window.pushSubPage = function(sub) { import('../router.js').then(r => r.pushSubPage(sub)); };
window.popSubPage = function() { import('../router.js').then(r => r.popSubPage()); };
```

- [ ] Commit:
```bash
git add js/render/build.js js/render/me.js
git commit -m "feat: Build + Me screens — program builder, exercise picker, profile"
```

---

## Phase 7 — CSS + final wiring

### Task 12: CSS additions + Firestore security rules + deploy

**Files:**
- Modify: `css/main.css`

- [ ] Add these styles to `css/main.css` (after existing rules):
```css
/* ── Onboarding ── */
.onb-btn:hover { border-color: var(--accent) !important; color: var(--accent) !important; }

/* ── Workout log inputs ── */
.db-log-input { background: var(--bg-input); border: 1px solid var(--border); border-radius: var(--radius-xs); padding: 4px 8px; color: var(--text-primary); font-size: 0.82rem; width: 70px; text-align: center; }

/* ── Toast ── */
.save-toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%) translateY(80px); background: var(--bg-elevated); border: 1px solid var(--border); border-radius: var(--radius); padding: 10px 20px; color: var(--text-primary); font-size: 0.85rem; transition: transform 0.3s; z-index: 100; }
.save-toast.visible { transform: translateX(-50%) translateY(0); }
```

- [ ] Deploy Firestore security rules in Firebase console:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null
                         && request.auth.uid == userId;
    }
  }
}
```

- [ ] Run full test suite:
```bash
npm test
```
Expected: all tests PASS

- [ ] Commit + push:
```bash
git add -A
git commit -m "feat: complete fitness tracker rebuild — all phases integrated"
git push
```

---

## Verification Checklist

Run through each success criterion manually in the browser at `https://tamoghna12.github.io/fitnessapp/`:

- [ ] **SC1** — New user: clear site storage, load page → onboarding shows, complete 4 questions in < 2 min, Today screen shows a workout
- [ ] **SC2** — Build tab → New Program → fill in 12 weeks, add 5 workout days, add 3+ exercises each → total time < 10 min
- [ ] **SC3** — Offline: disable network in DevTools → log a workout → data saved in localStorage
- [ ] **SC4** — Today screen: only one `[ Start Workout ]` button visible as primary action
- [ ] **SC5** — Firestore rules: attempt to read another user's doc via Firebase console → denied
- [ ] **SC6** — Run `npm test` → all engine tests PASS including Hit/Partial/Missed/Skipped/cadence/streak
