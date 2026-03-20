# Fitness Tracker — Redesign Spec
**Date:** 2026-03-20
**Status:** Approved by user — v3 (post spec-review round 2 fixes)

---

## Overview

A ground-up redesign of the Iron Protocol fitness tracker into a simple yet powerful adaptive training system. Targets three user levels (beginner, intermediate, advanced) on a GitHub Pages static webapp. Vanilla JS ES modules + Firebase Auth + Firestore. No build tools, no frameworks.

**Core problems being solved:**
1. Too cluttered — hard to know where to start
2. Not personal — everyone gets the same program
3. No guidance — logs data but doesn't tell you what to do next
4. Too rigid — can't skip days, swap exercises, or build custom programs

**Chosen approach:** Builder + Tracker with "Today First" home screen.

---

## File Structure

ES modules loaded via `<script type="module">` from `index.html`. Fully supported on GitHub Pages without a build step.

```
index.html
js/
  data.js             — DAREBEE_WORKOUTS, built-in programs, exercise library
  state.js            — localStorage + Firestore read/write, merge logic
  auth.js             — Firebase Auth, sign-in/out, auth state
  engine.js           — adaptive progression logic
  onboarding.js       — first-launch flow
  render/
    today.js          — Today screen
    workout.js        — Active workout screen
    build.js          — Program builder
    train.js          — History + charts
    me.js             — Profile screen
  router.js           — page/tab routing
```

---

## Data Model

### User Profile
```
level: 'beginner' | 'intermediate' | 'advanced'
goals: Array<'strength' | 'hypertrophy' | 'fat_loss' | 'general'>
equipment: Array<'dumbbells' | 'barbell' | 'kettlebell' | 'pull-up bar' | 'bodyweight' | 'gym'>
daysPerWeek: 2–6           // preference only — informational, not enforced
activeProgramId: string | null
onboardingComplete: boolean
```

`daysPerWeek` is a preference used for program recommendations. A program owns its own schedule. The two values can differ — no conflict.

### Exercise (global library)
```
id: string
name: string
muscleGroup: string
equipment: string
instructions: string
source: 'builtin' | 'darebee' | 'custom'
```

### Program
```
id: string
name: string
totalWeeks: number (1–16)
isTemplate: boolean
updatedAt: ISO string
days: WorkoutTemplate[]
```

`days` enforces unique `dayOfWeek` values — save is rejected if two templates share the same day. `dayOfWeek` is a calendar day: 0 = Monday, 6 = Sunday.

### WorkoutTemplate
```
id: string
name: string
dayOfWeek: 0–6
slots: ExerciseSlot[]
```

### ExerciseSlot
```
id: string
exerciseId: string
targetSets: number
targetRepsMin: number
targetRepsMax: number
targetLoadDescriptor: 'heavy' | 'moderate' | 'light' | null  // display label only
targetLoadKg: number | null    // required for engine arithmetic; null = bodyweight/unweighted
progressionRule: 'weight' | 'reps' | 'double' | 'adaptive' | 'none'
progressionStepKg: number      // e.g. 2.5 — only used when progressionRule = 'weight' or 'double'
progressionCadenceWeeks: number  // default 1 — how many weeks between progressions
lastProgressedWeek: number | null  // ISO week number when load/reps last increased
consecutivePerformanceHoldWeeks: number  // default 0 — streak counter (Partial/Missed only)
```

### WorkoutLog (immutable — never edited after creation)
```
id: string
date: ISO string
programId: string
workoutTemplateId: string
sets: SetLog[]
notes: string
sessionRating: 1–5 | null
completedAt: ISO string | null
```

**Finish conditions:** At least one `SetLog` with `completed: true` is required. If >3 slots have no logged sets at all, a confirmation prompt fires: *"You have X exercises not started — finish anyway?"* All unstarted sets are written as `{ completed: false, skipped: false, weight: null, reps: null }`.

**Session rating ≤ 2** is flagged in the weekly review UI with a warning icon to provide context.

### SetLog
```
exerciseId: string
exerciseSlotId: string
setNumber: number
weight: number | null
reps: number | null
completed: boolean
skipped: boolean       // true = user explicitly skipped; excluded from engine entirely
```

Every `SetLog` has a `skipped` field. Unstarted sets always have `skipped: false`.

### ProgressionSuggestion
```
id: string
programId: string
exerciseSlotId: string
weekNumber: number
suggestedChange: 'increase' | 'hold' | 'deload'
newTargetKg: number | null     // null when targetLoadKg is null on the slot
reason: string
accepted: boolean | null       // null = pending
```

---

## Navigation

Four top-level tabs only:

```
[ Today ]  [ Train ]  [ Build ]  [ Me ]
```

- **Today** — default home. One job: what to do right now.
- **Train** — workout history, logs, progress charts
- **Build** — program/workout/exercise creator, Darebee library
- **Me** — profile, goals, equipment, sign in/out

---

## Onboarding (first launch)

4 questions, ~30 seconds:

```
1. Goal:       [ Build Strength ]  [ Build Muscle ]  [ Lose Fat ]  [ General Fitness ]
               (maps to: 'strength' | 'hypertrophy' | 'fat_loss' | 'general')

2. Experience: [ New to training ]  [ 6 months–2 years ]  [ 2+ years ]
               (maps to: 'beginner' | 'intermediate' | 'advanced')

3. Equipment:  [ Dumbbells ]  [ Barbell ]  [ Kettlebell ]  [ Pull-up bar ]  [ Bodyweight ]  [ Full gym ]
               (multi-select)

4. Days/week:  [ 2 ]  [ 3 ]  [ 4 ]  [ 5 ]  [ 6 ]
```

Based on answers → one program recommended immediately with a plain-English explanation. User can start it or browse all programs.

Beginners see simpler programs (3-day full body) with coaching notes. Advanced users see full program stats and progression logic upfront.

---

## Today Screen

**Active training day:**
```
Good morning, [Name]                    Week 4 · 2 of 4 days done

┌──────────────────────────────────────────┐
│  Upper Body A                55–65 min   │
│  Strength · 8 exercises                  │
│                                          │
│  💡 DB Press: try 22.5kg today ↑         │
│                            [ Start ]     │
└──────────────────────────────────────────┘

Rest day tomorrow · Next: Lower Body A Thu
```

**"2 of 4 days done"** = count of `WorkoutLog` entries for the active program in the current ISO week (Mon–Sun). Logging on an unscheduled day counts and is permitted. Two sessions on the same calendar day both count.

**Mid-week program switch:** Switching `activeProgramId` resets the current week counter for the new program. Partial-week logs from the old program are preserved as historical records but excluded from the new program's adaptive engine entirely.

**Rest day:** streak count, recovery tips, next scheduled workout.

**No program assigned:** prompt to start recommended program or browse all.

---

## Active Workout Screen

One exercise visible at a time. Scroll to navigate between exercises.

```
Upper Body A — Week 4                     [ Finish ]

  2 / 8  ████░░░░░░░░░░

  DB Floor Press
  ┌──────┬──────┬──────┬──────┐
  │ Set 1│ Set 2│ Set 3│ Set 4│
  │ 20kg │ 20kg │ 20kg │ 20kg │  ← last week
  │ [  ] │ [  ] │ [  ] │ [  ] │  ← log today
  └──────┴──────┴──────┴──────┘
  Target: 4×8 · Try 22.5kg ↑

  [ Swap ]  [ Skip exercise ]  [ + Add set ]
```

**Swap exercise:** Session-scoped by default. At end of workout, if any exercises were swapped, a single consolidated prompt is shown listing all swaps: *"You made some swaps — update your program for next week?"* followed by a checklist of each swap (e.g. `☐ Replace Skull Crushers → DB Kickback`). Each can be checked or unchecked individually before confirming. Confirmed swaps update `ExerciseSlot.exerciseId` in the template.

**Skip exercise:** All sets written `{ completed: false, skipped: true, weight: null, reps: null }`. Excluded from engine.

**Finish:** Requires ≥ 1 `completed: true` set. If >3 exercises have zero logged sets, shows: *"X exercises not started — finish anyway?"* All unstarted sets written `{ completed: false, skipped: false, weight: null, reps: null }`.

---

## Program Builder

### Three entry points
1. **Start from template** — pick a built-in program and customise
2. **Import from Darebee** — browse 105 Darebee workouts; importing one creates a `WorkoutTemplate` with each Darebee movement mapped to an `ExerciseSlot` (`targetLoadKg: null`, `progressionRule: 'none'` by default). User edits slots post-import to add load and progression rules.

   **Null sets/reps fallback:** Darebee source data often has `sets: null` or `reps: null`. When importing:
   - If `sets` is null → `targetSets: 3`
   - If `reps` is null and `duration` is non-null → `targetRepsMin: 1`, `targetRepsMax: 1`, append duration to instructions (e.g. "30 seconds")
   - If both `reps` and `duration` are null → `targetRepsMin: 10`, `targetRepsMax: 12`
   - If `reps` is a string range (e.g. "10-15") → parse to `targetRepsMin: 10`, `targetRepsMax: 15`
   - If `reps` is a single number string → `targetRepsMin = targetRepsMax = parsed value`
3. **Build from scratch** — blank canvas

### Creation flow

**Step 1 — Program basics:** Name, total weeks (1–16), goal tag.

**Step 2 — Week design:** Assign templates to days. One template per `dayOfWeek` enforced. Tap a day to open its workout editor (Step 3).

**Step 3 — Workout editor (list view):** Ordered list of exercise slots. Each row: exercise name, sets × reps, load, progression rule badge. Tap a row to open the slot editor (Step 4, a modal). Reorder via up/down buttons. Delete and duplicate per row.

**Step 4 — Slot editor (per-exercise modal):**
```
Exercise:           [ DB Floor Press       ▼ ]
Sets:               [ 4 ]
Reps (range):       [ 6 ] – [ 8 ]
Load (kg):          [ 20 ]    Label: [ Heavy ▼ ]
Progression rule:   [ Weight +2.5kg ▼ ]
Every N weeks:      [ 1 ]
```

### Reordering
Desktop: HTML5 native drag-and-drop.
Mobile: up/down arrow buttons per row. No touch drag-and-drop in v1.

### Exercise picker
Unified search across all sources (built-in, custom, Darebee). Filter by muscle group and equipment. Source label shown on each result.

**Create custom exercise (inline):** Name, muscle group, equipment, instructions. Saved to user's library immediately.

---

## Adaptive Progression Engine

### Trigger
The engine runs at the end of each training week. Two trigger conditions:
1. **Automatic:** All scheduled training days for the active program in the current ISO week have a `WorkoutLog` entry.
2. **Manual:** User taps "Review this week" in the Train tab. Available any time regardless of completion status. Shows a banner: *"Not all sessions complete — suggestions may be incomplete."* if triggered early.

If a user misses one or more scheduled days, the engine still runs on manual trigger. Missed days produce no `SetLog` data for those slots; those slots receive a "Missed" result for the week and trigger a deload.

**Staleness guard:** Before executing, the engine checks whether any required `WorkoutLog` entries were loaded from localStorage only (not confirmed synced). If the device has been offline and the localStorage cache may be stale (last sync > 8 weeks ago), the engine shows: *"Your data may be out of date — sign in to sync before reviewing."* Engine can still run but shows this warning.

### Progression rule definitions

For each `ExerciseSlot`, the engine computes `totalRepsMissed`:
```
totalRepsMissed = (targetSets × targetRepsMax) − sum(loggedReps where skipped=false)
                  floored at 0
```

| Result | Condition | Action |
|--------|-----------|--------|
| **Hit** | `totalRepsMissed = 0` | Progress per `progressionRule` (see below) |
| **Partial** | `1 ≤ totalRepsMissed ≤ 2` | Hold — same `targetLoadKg` and `targetRepsMax` next week |
| **Missed** | `totalRepsMissed ≥ 3` | If `targetLoadKg` is set: deload `targetLoadKg × 0.9`, rounded to nearest 0.5kg. If `targetLoadKg` is null: Hold (`newTargetKg: null`). |
| **Skipped** | All sets `skipped = true` | Exclude — no action taken, no suggestion generated |

Slots with `targetLoadKg = null` produce only Hold suggestions (`newTargetKg: null`) regardless of Hit/Partial/Missed result. The engine never attempts arithmetic on null loads. If the user sets `progressionRule` to anything other than `'none'` on a null-load slot without also setting `targetLoadKg`, the app shows an inline validation error: *"Set a starting weight to use this progression rule."*

### Progression rules (applied on "Hit")

| Rule | Behaviour |
|------|-----------|
| `'weight'` | Increase `targetLoadKg` by `progressionStepKg`. `targetRepsMin` and `targetRepsMax` unchanged. |
| `'reps'` | Increase `targetRepsMax` by 1 (up to `targetRepsMin + 4` ceiling, evaluated at time of each reset). When ceiling reached, increase `targetLoadKg` by `progressionStepKg` and reset `targetRepsMax` to current `targetRepsMin`. "Current" means the value of `targetRepsMin` at the moment of reset — no separate original-value field is stored. If the user has manually edited `targetRepsMin` since the last reset, the new value becomes the reset target. |
| `'double'` | Increase both `targetLoadKg` by `progressionStepKg` AND `targetRepsMax` by 1 simultaneously. |
| `'adaptive'` | Same as `'weight'` in the engine. Differs in labelling only — displayed to user as "App decides." Reserved for future rule variation. |
| `'none'` | No progression applied. No suggestion generated on Hit. |

**Cadence check (all rules except `'none'`):** Before applying a Hit increase, the engine checks:
```
currentISOWeek − lastProgressedWeek >= progressionCadenceWeeks
```
If the cadence has not elapsed, the result is a cadence-hold (not a performance Hold). `lastProgressedWeek` is updated to `currentISOWeek` when a progression is applied.

### Streak detection
`targetLoadKg` unchanged on a given `ExerciseSlot` for 3+ consecutive logged weeks **where the result was performance-driven (Partial or Missed), not a cadence-hold**. Cadence-holds do not count toward the streak — an unchanged load due to a deliberate 2-weekly cadence should not warn the user. Streak surfaces a note: *"Same weight for 3 weeks — try a technique check or adjusting your rep range."*

The engine tracks this by storing `consecutivePerformanceHoldWeeks: number` on `ExerciseSlot` (default 0). Incremented when result is Partial or Missed. Reset to 0 when result is Hit (even if cadence-held) or Skipped.

### Review UI
```
Week 4 Complete  [session rated 2 ⚠]

  DB Floor Press    ✓ Hit      → ↑ 22.5kg
  DB Row            ✓ Hit      → hold (progressed last week)
  Overhead Press    ~ Partial  → hold
  Skull Crushers    ✗ Missed   → ↓ 8kg

  [ Accept All ]   [ Review Each ]   [ Skip for now ]
```

Accepted suggestions update `ExerciseSlot.targetLoadKg`, `targetRepsMax`, and `lastProgressedWeek`. `ProgressionSuggestion.accepted` is set to `true`. Ignored suggestions marked `accepted: false`.

---

## Data Persistence

### Firestore structure
```
users/{uid}/profile                — User Profile doc
users/{uid}/programs/{programId}   — Program docs (includes WorkoutTemplates + ExerciseSlots)
users/{uid}/logs/{logId}           — WorkoutLog docs (immutable)
users/{uid}/suggestions/{id}       — ProgressionSuggestion docs
```

### Merge semantics

| Entity | Conflict rule |
|--------|--------------|
| `WorkoutLog` | No conflicts — immutable after creation. Any local logs absent from Firestore are pushed on reconnect. |
| `Program` | Most recently modified wins (`updatedAt` timestamp). Local drafts pushed on reconnect. |
| `Profile` | Most recently modified wins (`updatedAt` timestamp). |
| `ProgressionSuggestion` | Cloud wins. |

### localStorage as rolling cache
Stores: active program, last 8 weeks of `WorkoutLog` entries, user profile. Evicts logs older than 8 weeks silently when storage is full. Firestore is the system of record for all historical data.

### Security rules (must be deployed before go-live)
```javascript
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

---

## Darebee Integration

`darebee-data.js` loaded as an ES module. Surfaced in:
- **Exercise picker** — individual exercises searchable by name and muscle group
- **Program builder → Import from Darebee** — creates a `WorkoutTemplate` as described above
- **Build → Browse Workouts** — replaces the current standalone Darebee tab

---

## Out of Scope (v1)

- Native mobile app
- Social features (sharing, leaderboards)
- AI-generated programs
- Video demonstrations
- Nutrition / diet tracking
- Payment / subscription
- RPE logging (deferred to v2)
- Touch drag-and-drop reordering (desktop only in v1)

---

## Success Criteria

All criteria are verifiable at build time:

1. New user completes onboarding and starts first workout in under 2 minutes
2. Advanced user builds a custom 12-week program in under 10 minutes
3. App works fully offline (localStorage fallback — all core flows functional without network)
4. Today screen never shows more than one primary action
5. Firestore security rules deployed and verified — cross-user data access blocked
6. Engine produces correct suggestions for Hit / Partial / Missed / Skipped in a test scenario with mock log data
