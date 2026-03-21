# Iron Protocol — Modern Stack Migration Plan

> **Target Stack:** Vite + React 19 + TypeScript + Zustand + TailwindCSS 4 + Firebase Modular SDK v10
>
> **Current Stack:** Vanilla JS ES modules, no build step, single CSS file, Firebase compat CDN, localStorage state
>
> **Goal:** Migrate incrementally from vanilla JS to a modern, type-safe, component-based architecture without losing any functionality or user data.

---

## Why This Stack

| Choice | Rationale | Alternatives Considered |
|--------|-----------|------------------------|
| **Vite** | Near-instant HMR, native ESM dev server, zero-config React/TS support, tree-shaking production builds | Webpack (slow, config-heavy), Parcel (less ecosystem) |
| **React 19** | Largest ecosystem, most hiring demand, concurrent features, Server Components for future SSR | Svelte (smaller ecosystem), Vue (less TS-native) |
| **TypeScript** | Catches the class of bugs this codebase is most vulnerable to (wrong property names, null access, shape mismatches) | Flow (dead), JSDoc (weak) |
| **Zustand** | Minimal API, works with React DevTools, no boilerplate, supports persist middleware (replaces manual localStorage). ~1KB | Redux Toolkit (heavier), Jotai (atomic model less natural for this app's monolithic state) |
| **TailwindCSS 4** | Utility-first eliminates the 3,100-line CSS monolith, JIT compilation, design tokens via config, responsive-first | CSS Modules (still manual), styled-components (runtime cost) |
| **Firebase Modular SDK** | Tree-shakeable (compat SDK bundles everything), official path forward, same project/credentials | Supabase (would require backend migration) |

---

## Codebase Inventory (What Migrates Where)

### Current Modules → React Components

```
js/app.js (28 lines)              → src/App.tsx + src/main.tsx
js/router.js (60 lines)           → react-router-dom v7 (or TanStack Router)
js/state.js (105 lines)           → src/store/index.ts (Zustand)
js/schema.js (109 lines)          → src/types/schema.ts (TypeScript interfaces + factory fns)
js/auth.js (65 lines)             → src/hooks/useAuth.ts + src/providers/AuthProvider.tsx
js/data.js (173 lines)            → src/data/exercises.ts + src/data/programs.ts
js/engine.js (139 lines)          → src/engine/progression.ts (pure logic, no React)
js/firestore.js (79 lines)        → src/services/firestore.ts (modular SDK)
js/onboarding.js (160 lines)      → src/components/Onboarding/index.tsx (multi-step form)

js/render/today.js (375 lines)    → src/pages/Dashboard/ (3-4 components)
js/render/workout.js (396 lines)  → src/pages/Workout/ (3-4 components)
js/render/train.js (220 lines)    → src/pages/Train/ (2-3 components)
js/render/build.js (929 lines)    → src/pages/Build/ (6-8 components, biggest split)
js/render/generator.js (622 lines)→ src/pages/Generator/ (4-5 components)
js/render/calculators.js (491 lines)→ src/pages/Calculators/ (5-6 components)
js/render/me.js (128 lines)       → src/pages/Me/ (2-3 components)

css/main.css (3,110 lines)        → Tailwind utilities + src/index.css (tokens only)
darebee-data.js (4,293 lines)     → src/data/darebee.json (lazy-loaded)
exercise-library.js (9 lines)     → src/data/exercise-library.json (lazy-loaded)
index.html (71 lines)             → index.html (Vite template, minimal)
```

### Target Directory Structure

```
src/
├── main.tsx                       # Vite entry, ReactDOM.createRoot
├── App.tsx                        # Router + layout + AuthProvider
├── index.css                      # Tailwind directives + CSS custom properties
├── vite-env.d.ts
│
├── types/
│   ├── schema.ts                  # All interfaces: Profile, Program, WorkoutTemplate, ExerciseSlot, etc.
│   └── index.ts                   # Re-exports
│
├── store/
│   ├── index.ts                   # Zustand store: state + actions (replaces state.js)
│   ├── persist.ts                 # localStorage + Firestore sync middleware
│   └── selectors.ts               # Derived state: getActiveProgram, getLogsThisWeek, etc.
│
├── services/
│   ├── firebase.ts                # Firebase app init, modular SDK
│   ├── auth.ts                    # signIn, signOut, onAuthStateChanged
│   └── firestore.ts               # pull/push sync logic
│
├── hooks/
│   ├── useAuth.ts                 # Auth state + user info
│   ├── useProgram.ts              # Active program, CRUD
│   ├── useWorkoutLog.ts           # Log creation, set tracking
│   └── useExercises.ts            # Exercise lookup, fuzzy search
│
├── engine/
│   ├── progression.ts             # computeSignal, applyProgressionRule, generateSuggestions
│   └── progression.test.ts        # Existing tests, ported to TS
│
├── data/
│   ├── exercises.ts               # BUILTIN_EXERCISES, getAllExercises
│   ├── programs.ts                # BUILTIN_PROGRAMS, recommendProgram
│   ├── darebee.json               # Lazy-loaded
│   └── exercise-library.json      # Lazy-loaded
│
├── components/
│   ├── Layout/
│   │   ├── Header.tsx
│   │   ├── BottomNav.tsx
│   │   └── Layout.tsx
│   ├── Onboarding/
│   │   ├── OnboardingFlow.tsx
│   │   ├── StepGoals.tsx
│   │   ├── StepEquipment.tsx
│   │   ├── StepLevel.tsx
│   │   └── StepProgram.tsx
│   └── shared/
│       ├── ChipSelector.tsx        # Reusable chip row (used in Me, Onboarding, Build)
│       ├── BottomSheet.tsx          # Slide-up overlay (used in Build, Workout)
│       ├── ExercisePicker.tsx       # Multi-select exercise picker
│       ├── MuscleChip.tsx
│       └── StatTile.tsx
│
├── pages/
│   ├── Dashboard/
│   │   ├── Dashboard.tsx           # Main dashboard page
│   │   ├── WeekStrip.tsx           # Mon-Sun progress indicators
│   │   ├── WorkoutCard.tsx         # Today's workout preview + start
│   │   └── RecentActivity.tsx      # Last 3 logs
│   ├── Workout/
│   │   ├── ActiveWorkout.tsx       # Set-by-set logging
│   │   ├── SetRow.tsx              # Individual set input
│   │   └── WorkoutSummary.tsx      # Post-workout review
│   ├── Train/
│   │   ├── TrainHistory.tsx        # Log list
│   │   └── ProgressionReview.tsx   # Suggestion cards
│   ├── Build/
│   │   ├── BuildHome.tsx           # Program list + templates
│   │   ├── ProgramBuilder.tsx      # 7-day accordion
│   │   ├── DayCard.tsx             # Single day's exercises
│   │   ├── SlotEditor.tsx          # Inline sets/reps/load editor
│   │   ├── ImportArea.tsx          # Text/file import + preview
│   │   └── DareebeeBrowser.tsx     # Darebee workout picker
│   ├── Generator/
│   │   ├── GeneratorFlow.tsx       # Multi-step generator wizard
│   │   ├── MuscleSelector.tsx      # Body map / muscle group picker
│   │   └── GeneratedPreview.tsx    # Generated program preview
│   ├── Calculators/
│   │   ├── Calculators.tsx         # Tab container
│   │   ├── BMRCalculator.tsx
│   │   ├── BodyFatCalculator.tsx
│   │   ├── MacroCalculator.tsx
│   │   └── HeartRateZones.tsx
│   └── Me/
│       ├── ProfilePage.tsx         # Hero + settings
│       └── DataManagement.tsx      # Export/import/reset
```

---

## Migration Phases

### Phase 0: Scaffolding (No Functionality Change)

**Goal:** Set up the build toolchain alongside existing code. App continues to work as-is.

- [ ] **0.1** Initialize Vite + React + TypeScript project in a new branch
  ```bash
  npm create vite@latest . -- --template react-ts
  ```
  Merge into existing directory — keep all existing files, Vite ignores non-src files.

- [ ] **0.2** Install core dependencies
  ```bash
  npm install react react-dom zustand firebase@10 react-router-dom@7
  npm install -D typescript @types/react @types/react-dom tailwindcss@4 @tailwindcss/vite vitest @testing-library/react @testing-library/jest-dom jsdom
  ```

- [ ] **0.3** Configure Vite (`vite.config.ts`)
  ```typescript
  import { defineConfig } from 'vite';
  import react from '@vitejs/plugin-react';
  import tailwindcss from '@tailwindcss/vite';

  export default defineConfig({
    plugins: [react(), tailwindcss()],
    base: './',  // GitHub Pages compatibility
    build: { outDir: 'dist' },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: './src/test-setup.ts',
    },
  });
  ```

- [ ] **0.4** Configure TypeScript (`tsconfig.json`)
  ```json
  {
    "compilerOptions": {
      "target": "ES2022",
      "module": "ESNext",
      "moduleResolution": "bundler",
      "jsx": "react-jsx",
      "strict": true,
      "noUncheckedIndexedAccess": true,
      "esModuleInterop": true,
      "skipLibCheck": true,
      "paths": { "@/*": ["./src/*"] }
    },
    "include": ["src"]
  }
  ```

- [ ] **0.5** Set up Tailwind with existing design tokens in `src/index.css`
  ```css
  @import "tailwindcss";

  @theme {
    --color-bg-primary: #EEF2F7;
    --color-bg-card: #FFFFFF;
    --color-accent: #2563EB;
    --color-accent-secondary: #10B981;
    --color-accent-purple: #7C3AED;
    --color-accent-amber: #D97706;
    --color-text-primary: #0F172A;
    --color-text-secondary: #64748B;
    --color-text-muted: #94A3B8;
    --radius-card: 16px;
    --font-display: 'Bricolage Grotesque', system-ui, sans-serif;
    --font-mono: 'JetBrains Mono', monospace;
  }
  ```

- [ ] **0.6** Create minimal `src/main.tsx` and `src/App.tsx` that renders "Migration in progress" placeholder

- [ ] **0.7** Verify: `npm run dev` serves the new React app; old `index.html` still works if opened directly

- [ ] **0.8** Commit: `chore: scaffold Vite + React + TS + Tailwind project`

---

### Phase 1: Type Foundation + State Layer

**Goal:** Port schema, state management, and pure logic to TypeScript. Zero UI changes yet.

- [ ] **1.1** Create `src/types/schema.ts` — convert all `make*()` factory functions from `js/schema.js` to TypeScript interfaces + factory functions with proper types
  ```typescript
  export interface Profile {
    level: 'beginner' | 'intermediate' | 'advanced';
    goals: string[];
    equipment: string[];
    daysPerWeek: number;
    activeProgramId: string | null;
    onboardingComplete: boolean;
    updatedAt: string;
  }

  export interface ExerciseSlot {
    id: string;
    exerciseId: string;
    targetSets: number;
    targetRepsMin: number;
    targetRepsMax: number;
    targetLoadDescriptor: 'heavy' | 'moderate' | 'light' | null;
    targetLoadKg: number | null;
    progressionRule: 'none' | 'weight' | 'reps' | 'double' | 'adaptive';
    progressionStepKg: number;
    progressionCadenceWeeks: number;
    lastProgressedWeek: number | null;
    consecutivePerformanceHoldWeeks: number;
  }
  // ... WorkoutTemplate, Program, WorkoutLog, SetLog, ProgressionSuggestion, Exercise
  ```

- [ ] **1.2** Create `src/store/index.ts` — Zustand store replacing `state.js`
  ```typescript
  import { create } from 'zustand';
  import { persist } from 'zustand/middleware';
  import type { Profile, Program, WorkoutLog, ProgressionSuggestion, Exercise } from '@/types/schema';

  interface AppState {
    profile: Profile;
    programs: Record<string, Program>;
    logs: Record<string, WorkoutLog>;
    suggestions: Record<string, ProgressionSuggestion>;
    exercises: Record<string, Exercise>;
    lastSyncAt: string | null;

    // Actions
    updateProfile: (patch: Partial<Profile>) => void;
    saveProgram: (program: Program) => void;
    deleteProgram: (id: string) => void;
    saveLog: (log: WorkoutLog) => void;
    saveSuggestion: (s: ProgressionSuggestion) => void;
    saveExercise: (e: Exercise) => void;
  }

  export const useStore = create<AppState>()(
    persist(
      (set) => ({
        // ... initial state + action implementations
      }),
      {
        name: 'iron-protocol-v2',  // Same localStorage key for data continuity
        version: 1,
      }
    )
  );
  ```

- [ ] **1.3** Create `src/store/selectors.ts` — derived state hooks
  ```typescript
  export const useActiveProgram = () => useStore(s =>
    s.profile.activeProgramId ? s.programs[s.profile.activeProgramId] : null
  );
  export const useLogsThisWeek = () => { /* ISO week filter */ };
  export const useWeekStreak = () => { /* streak computation */ };
  ```

- [ ] **1.4** Port `js/engine.js` → `src/engine/progression.ts` (pure functions, just add types)

- [ ] **1.5** Port `js/data.js` → `src/data/exercises.ts` + `src/data/programs.ts`

- [ ] **1.6** Port existing tests to TypeScript: `src/engine/progression.test.ts`, `src/data/exercises.test.ts`

- [ ] **1.7** Run tests: `npm test` — all existing logic tests pass

- [ ] **1.8** Commit: `feat: port state, schema, engine, data layer to TypeScript`

---

### Phase 2: Firebase Modular SDK

**Goal:** Replace compat CDN scripts with tree-shakeable modular imports.

- [ ] **2.1** Create `src/services/firebase.ts`
  ```typescript
  import { initializeApp } from 'firebase/app';
  import { getAuth } from 'firebase/auth';
  import { getFirestore } from 'firebase/firestore';

  const app = initializeApp({ /* same config */ });
  export const auth = getAuth(app);
  export const db = getFirestore(app);
  ```

- [ ] **2.2** Create `src/services/auth.ts` — modular auth with `signInWithPopup`, `GoogleAuthProvider`, `onAuthStateChanged`

- [ ] **2.3** Create `src/hooks/useAuth.ts`
  ```typescript
  export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      return onAuthStateChanged(auth, (u) => {
        setUser(u);
        setLoading(false);
      });
    }, []);

    return { user, loading, signIn, signOut };
  }
  ```

- [ ] **2.4** Create `src/services/firestore.ts` — port pull/push with modular API (`doc`, `setDoc`, `getDocs`, `collection`, `writeBatch`)

- [ ] **2.5** Create `src/providers/AuthProvider.tsx` — React context wrapping `useAuth` + sync trigger

- [ ] **2.6** Test: sign in/out works, data syncs both directions

- [ ] **2.7** Commit: `feat: migrate to Firebase modular SDK v10`

---

### Phase 3: Layout Shell + Router

**Goal:** App shell renders with navigation, all pages are empty placeholders.

- [ ] **3.1** Create `src/components/Layout/Header.tsx` — logo, desktop nav, auth button, sync indicator

- [ ] **3.2** Create `src/components/Layout/BottomNav.tsx` — mobile bottom tab bar with SVG icons

- [ ] **3.3** Create `src/components/Layout/Layout.tsx` — wraps Header + `<Outlet />` + BottomNav

- [ ] **3.4** Set up React Router in `src/App.tsx`
  ```tsx
  <AuthProvider>
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="train" element={<Train />} />
          <Route path="build" element={<Build />} />
          <Route path="me" element={<Me />} />
          <Route path="calc" element={<Calculators />} />
          <Route path="workout/:templateId" element={<ActiveWorkout />} />
          <Route path="build/generator" element={<Generator />} />
        </Route>
        <Route path="onboarding" element={<OnboardingFlow />} />
      </Routes>
    </BrowserRouter>
  </AuthProvider>
  ```

- [ ] **3.5** Create placeholder pages: each page exports a component that renders its name

- [ ] **3.6** Verify: navigation works between all tabs, active states highlight correctly, mobile bottom nav works

- [ ] **3.7** Commit: `feat: app shell with React Router + responsive nav`

---

### Phase 4: Shared Components

**Goal:** Build reusable UI primitives before page-specific work.

- [ ] **4.1** `src/components/shared/ChipSelector.tsx` — generic chip row (level selector, day selector, muscle groups)
- [ ] **4.2** `src/components/shared/BottomSheet.tsx` — slide-up overlay with backdrop, animation via `framer-motion` or CSS
- [ ] **4.3** `src/components/shared/ExercisePicker.tsx` — tabbed picker (Library / Custom / Darebee), multi-select, search
- [ ] **4.4** `src/components/shared/StatTile.tsx` — stat number + label card
- [ ] **4.5** `src/components/shared/MuscleChip.tsx` — colored muscle group badge
- [ ] **4.6** Commit: `feat: shared UI components — chips, bottom sheet, picker, stat tiles`

---

### Phase 5: Page Migration (One Page Per Task)

Migrate pages **in dependency order** — simplest first, building up to the complex ones.

#### 5A: Me Page (simplest, 128 lines → 2 components)
- [ ] **5A.1** `src/pages/Me/ProfilePage.tsx` — avatar, name, auth state, level chips, days chips
- [ ] **5A.2** `src/pages/Me/DataManagement.tsx` — export/import/reset buttons
- [ ] **5A.3** Verify: profile changes persist, export downloads JSON, import works, reset clears
- [ ] **5A.4** Commit: `feat: migrate Me page to React`

#### 5B: Calculators (491 lines → 5 components, no state deps beyond calcProfile)
- [ ] **5B.1** `src/pages/Calculators/Calculators.tsx` — tab container
- [ ] **5B.2** Individual calculator components (BMR, BodyFat, Macros, HeartRateZones)
- [ ] **5B.3** Verify: all calculations produce same results as vanilla version
- [ ] **5B.4** Commit: `feat: migrate Calculators to React`

#### 5C: Dashboard (375 lines → 4 components)
- [ ] **5C.1** `src/pages/Dashboard/Dashboard.tsx` — greeting, stats row, week strip, workout card, recent activity, quick actions
- [ ] **5C.2** `src/pages/Dashboard/WeekStrip.tsx` — 7-day chip strip with state indicators
- [ ] **5C.3** `src/pages/Dashboard/WorkoutCard.tsx` — exercise preview, start button, done/rest states
- [ ] **5C.4** `src/pages/Dashboard/RecentActivity.tsx` — last 3 logs
- [ ] **5C.5** Verify: stats correct, start workout navigates, rest/done states work
- [ ] **5C.6** Commit: `feat: migrate Dashboard to React`

#### 5D: Active Workout (396 lines → 3 components)
- [ ] **5D.1** `src/pages/Workout/ActiveWorkout.tsx` — timer, progress bar, exercise list
- [ ] **5D.2** `src/pages/Workout/SetRow.tsx` — weight/rep input, complete/skip toggles
- [ ] **5D.3** `src/pages/Workout/WorkoutSummary.tsx` — post-workout rating, log saving
- [ ] **5D.4** Verify: sets log correctly, finish saves to state + Firestore, back navigates to dashboard
- [ ] **5D.5** Commit: `feat: migrate Active Workout to React`

#### 5E: Train / History (220 lines → 2 components)
- [ ] **5E.1** `src/pages/Train/TrainHistory.tsx` — log list, expandable details
- [ ] **5E.2** `src/pages/Train/ProgressionReview.tsx` — suggestion cards, accept/reject
- [ ] **5E.3** Verify: suggestions generate correctly, accepting updates program
- [ ] **5E.4** Commit: `feat: migrate Train page to React`

#### 5F: Build / Program Builder (929 lines → 6-8 components, most complex)
- [ ] **5F.1** `src/pages/Build/BuildHome.tsx` — program list, template chips, new/clone actions
- [ ] **5F.2** `src/pages/Build/ProgramBuilder.tsx` — 7-day accordion, program name edit
- [ ] **5F.3** `src/pages/Build/DayCard.tsx` — exercise slots, add/remove/reorder
- [ ] **5F.4** `src/pages/Build/SlotEditor.tsx` — inline sets/reps/load/progression editing
- [ ] **5F.5** `src/pages/Build/ImportArea.tsx` — text parser, file upload, preview with fuzzy matching
- [ ] **5F.6** `src/pages/Build/DarebeeBrowser.tsx` — browse + import Darebee workouts
- [ ] **5F.7** Verify: create program, edit exercises, import text, import Darebee, activate program
- [ ] **5F.8** Commit: `feat: migrate Build page to React`

#### 5G: Generator (622 lines → 3-4 components)
- [ ] **5G.1** `src/pages/Generator/GeneratorFlow.tsx` — multi-step wizard
- [ ] **5G.2** `src/pages/Generator/MuscleSelector.tsx` — muscle group picker
- [ ] **5G.3** `src/pages/Generator/GeneratedPreview.tsx` — preview + save
- [ ] **5G.4** Verify: generated programs have correct exercises for selected muscles/equipment
- [ ] **5G.5** Commit: `feat: migrate Generator to React`

#### 5H: Onboarding (160 lines → 5 components)
- [ ] **5H.1** `src/components/Onboarding/OnboardingFlow.tsx` — step router
- [ ] **5H.2** Individual step components (Goals, Equipment, Level, Program)
- [ ] **5H.3** Verify: first-time user sees onboarding, completing it activates a program and navigates to dashboard
- [ ] **5H.4** Commit: `feat: migrate Onboarding to React`

---

### Phase 6: Cleanup + Data Migration

**Goal:** Remove all vanilla JS code, ensure backwards-compatible localStorage.

- [ ] **6.1** Verify Zustand `persist` middleware reads the existing `iron-protocol-v2` localStorage key correctly — users should not lose data on upgrade

- [ ] **6.2** Write a one-time migration function in `src/store/persist.ts`:
  ```typescript
  // If old state shape is detected (no version field), normalize it
  migrate: (persisted, version) => {
    if (version === 0) {
      // Old vanilla JS shape → new typed shape
      return normalizeV0(persisted);
    }
    return persisted;
  }
  ```

- [ ] **6.3** Delete old files:
  ```
  rm index.html (replaced by Vite's index.html)
  rm css/main.css
  rm js/ -rf
  rm darebee-data.js
  rm exercise-library.js
  rm vitest.config.js (replaced by vite.config.ts)
  ```

- [ ] **6.4** Convert `darebee-data.js` → `src/data/darebee.json` (lazy-loaded via dynamic import)

- [ ] **6.5** Convert `exercise-library.js` → `src/data/exercise-library.json` (lazy-loaded)

- [ ] **6.6** Update `package.json` scripts:
  ```json
  {
    "scripts": {
      "dev": "vite",
      "build": "tsc && vite build",
      "preview": "vite preview",
      "test": "vitest run",
      "test:watch": "vitest",
      "lint": "tsc --noEmit && eslint src/"
    }
  }
  ```

- [ ] **6.7** Update GitHub Pages deploy to use `dist/` output

- [ ] **6.8** Commit: `chore: remove vanilla JS, finalize React migration`

---

### Phase 7: Polish + Quality

**Goal:** Add what the vanilla version lacked.

- [ ] **7.1** Add ESLint + Prettier config (`eslint.config.js` with `@typescript-eslint`)
- [ ] **7.2** Add error boundaries around each page
- [ ] **7.3** Add loading skeletons for lazy-loaded data (Darebee, exercise library)
- [ ] **7.4** Add `React.lazy` + `Suspense` for code splitting per page
- [ ] **7.5** Add PWA manifest + service worker (via `vite-plugin-pwa`)
- [ ] **7.6** Run Lighthouse audit — target 90+ on all categories
- [ ] **7.7** Commit: `chore: add error boundaries, code splitting, PWA support`

---

## Key Migration Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| **User data loss** | High — users lose programs/logs | Zustand `persist` uses same localStorage key; write migration function for shape changes |
| **929-line build.js** | High — most complex module | Split into 6+ components with clear interfaces; migrate last after patterns are established |
| **3,100 lines of CSS** | Medium — tedious to port | Don't port line-by-line; rebuild with Tailwind utilities, reference old CSS for values only |
| **50+ window.* globals** | Medium — easy to miss one | TypeScript will catch missing references; grep for `window.` in old code to inventory |
| **Firebase compat → modular** | Low — same backend | Same project credentials; modular SDK is a drop-in API change |
| **GitHub Pages routing** | Low — SPA routing breaks on refresh | Use `HashRouter` or add 404.html redirect hack for GitHub Pages |

## Estimated Scope

- **~4,070 lines of JS** to port across 17 modules
- **~3,110 lines of CSS** to replace with Tailwind
- **7 pages**, **~25-30 React components** total
- **3 existing test files** to port to TypeScript

## Data Lazy-Loading Strategy

The two largest data files should be lazy-loaded to avoid blocking initial render:

```typescript
// src/data/darebee.ts
export async function loadDarebeeData() {
  const { default: data } = await import('./darebee.json');
  return data;
}

// Usage in Build page
const [darebee, setDarebee] = useState(null);
useEffect(() => { loadDarebeeData().then(setDarebee); }, []);
```

This reduces initial bundle from ~300KB+ to ~50KB.

---

## Execution Order Summary

```
Phase 0: Scaffold          → Vite + React + TS + Tailwind alongside existing code
Phase 1: Type foundation   → schema.ts, store (Zustand), engine, data
Phase 2: Firebase          → Modular SDK, auth hooks, sync service
Phase 3: Layout shell      → Header, BottomNav, Router, placeholder pages
Phase 4: Shared components → ChipSelector, BottomSheet, ExercisePicker, StatTile
Phase 5: Pages (ordered)   → Me → Calc → Dashboard → Workout → Train → Build → Generator → Onboarding
Phase 6: Cleanup           → Delete vanilla JS, data migration, deploy config
Phase 7: Polish            → ESLint, error boundaries, code splitting, PWA
```
