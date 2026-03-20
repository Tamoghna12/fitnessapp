# Fitness Tracker — Redesign Spec
**Date:** 2026-03-20
**Status:** Approved by user

---

## Overview

A ground-up redesign of the Iron Protocol fitness tracker into a simple yet powerful adaptive training system. Targets three user levels (beginner, intermediate, advanced) on a single GitHub Pages static webapp. No build tools, no frameworks — vanilla JS + Firebase Auth + Firestore.

**Core problems being solved:**
1. Too cluttered — hard to know where to start
2. Not personal — everyone gets the same program
3. No guidance — logs data but doesn't tell you what to do next
4. Too rigid — can't skip days, swap exercises, or build custom programs

**Chosen approach:** Builder + Tracker with "Today First" home screen.

---

## Architecture & Data Model

### Stack
- Single `index.html` — vanilla JS, no build step
- GitHub Pages (static hosting)
- Firebase Auth (Google Sign-In) + Firestore (cloud sync)
- `localStorage` fallback for offline / unauthenticated use

### Data Entities

```
User Profile
  └── level: 'beginner' | 'intermediate' | 'advanced'
  └── goals: string[]  // 'strength' | 'hypertrophy' | 'fat_loss' | 'general'
  └── equipment: string[]  // 'dumbbells' | 'barbell' | 'kettlebell' | 'bodyweight' | 'gym'
  └── daysPerWeek: 2–6
  └── activeProgramId: string

Exercise  (global library — built-in + user-created + Darebee)
  └── id: string
  └── name: string
  └── muscleGroup: string
  └── equipment: string
  └── instructions: string
  └── source: 'builtin' | 'darebee' | 'custom'

Program
  └── id: string
  └── name: string
  └── weeks: number (1–16)
  └── isTemplate: boolean
  └── days: WorkoutTemplate[]

WorkoutTemplate
  └── id: string
  └── name: string
  └── dayOfWeek: 0–6
  └── slots: ExerciseSlot[]

ExerciseSlot
  └── exerciseId: string
  └── targetSets: number
  └── targetRepsMin: number
  └── targetRepsMax: number
  └── targetLoad: string  // 'heavy' | 'moderate' | 'light' | kg value
  └── progressionRule: 'weight' | 'reps' | 'double' | 'adaptive' | 'none'
  └── progressionStep: number  // e.g. 2.5 (kg)
  └── progressionFrequency: number  // every N weeks

WorkoutLog  (immutable — never edited after creation)
  └── id: string
  └── date: ISO string
  └── programId: string
  └── workoutTemplateId: string
  └── sets: SetLog[]
  └── notes: string
  └── sessionRating: 1–5

SetLog
  └── exerciseId: string
  └── setNumber: number
  └── weight: number
  └── reps: number
  └── rpe: number (optional)
  └── completed: boolean

ProgressionSuggestion
  └── weekNumber: number
  └── exerciseId: string
  └── suggestedChange: 'increase' | 'hold' | 'deload'
  └── newTarget: number
  └── reason: string
  └── accepted: boolean | null
```

**Key invariant:** `WorkoutLog` entries are immutable records. The adaptive engine reads logs and writes `ProgressionSuggestion` entries. Programs are mutated (when user accepts suggestions), but historical logs are never changed.

---

## Navigation

Four top-level tabs only:

```
[ Today ]  [ Train ]  [ Build ]  [ Me ]
```

- **Today** — default home. Shows today's workout, rest day info, or program picker if none assigned.
- **Train** — workout history, logs, progress charts
- **Build** — program/workout/exercise creator
- **Me** — profile, goals, equipment, Firebase sign-in/out

---

## Today Screen

Default home screen. Single focus — what to do right now.

**Active training day:**
```
Good morning, [Name]               Week 4 · Day 2 of 4

┌─────────────────────────────────────────┐
│  Upper Body A              55–65 min    │
│  Strength · 8 exercises                 │
│                                         │
│  💡 Beat last week: DB Press 22.5kg     │
│                           [ Start ]     │
└─────────────────────────────────────────┘

Rest day tomorrow · Next: Lower Body A Thu
```

**Rest day:**
- Show streak, recovery tips, next scheduled workout

**No program assigned:**
- Prompt with recommended program based on profile (or onboarding if new user)

---

## Active Workout Screen

One exercise shown at a time. Scroll/swipe between exercises.

```
Upper Body A — Week 4          [ Finish ]

  DB Floor Press
  ┌──────┬──────┬──────┬──────┐
  │ Set 1│ Set 2│ Set 3│ Set 4│
  │ 20kg │ 20kg │ 20kg │ 20kg │  ← last week
  │ [  ] │ [  ] │ [  ] │ [  ] │  ← log today
  └──────┴──────┴──────┴──────┘
  Target: 4×8 · Try 22.5kg ↑

  [ + Swap exercise ]  [ + Add set ]  [ Skip ]
```

- Last week's numbers always visible as reference
- Progression nudge shown inline (from adaptive engine)
- Swap exercise pulls from global library
- Skipped exercises are logged as skipped (not deleted)

---

## Program Builder

### Three entry points
1. **Start from template** — pick built-in program and customise
2. **Import from Darebee** — browse 105 Darebee workouts and assemble into a program
3. **Build from scratch** — blank canvas

### Creation flow

**Step 1 — Program basics**
- Name, duration (weeks), days per week, goal tag

**Step 2 — Design the week**
- Assign workout templates to days
- Drag to reorder, tap to edit each day
- Mark days as Rest

**Step 3 — Edit a workout day**
- Ordered list of exercises with sets/reps/load
- Per-exercise progression rule
- Reorder via drag, delete, duplicate

**Step 4 — Per-exercise progression rule**
- `weight` — add N kg every M weeks
- `reps` — stay at weight until top of rep range, then increase weight
- `double` — reps first, then weight (double progression)
- `adaptive` — let the engine decide based on performance
- `none` — no automatic progression

### Exercise picker
- Search across all sources (built-in, custom, Darebee)
- Filter by muscle group and equipment
- Create new exercise inline (name, muscle group, equipment, notes)

---

## Adaptive Progression Engine

Runs at end of each completed training week. Compares `WorkoutLog` sets against `ExerciseSlot` targets.

### Signal thresholds

| Result | Condition | Action |
|--------|-----------|--------|
| Hit | All target sets × reps completed | Progress per progression rule |
| Partial | Missed ≤ 2 total reps | Hold — same weight/reps next week |
| Missed | Missed > 2 reps or bailed early | Deload 10% |

### Streak detection
- Stuck at same weight for 3+ consecutive weeks → surface note suggesting technique check or rep range change

### Review UI
```
Week 4 Complete — Review

  DB Floor Press    ✓ Hit all     → ↑ 22.5kg
  DB Row            ✓ Hit all     → hold (1 week)
  Overhead Press    ~ Partial     → hold
  Skull Crushers    ✗ Missed      → ↓ 8kg

  [ Accept All ]  [ Review Each ]  [ Ignore ]
```

User can accept, modify each suggestion, or ignore entirely. Accepted suggestions update the program template for next week.

### No AI dependency
Engine is purely rule-based. Fast, works offline, fully predictable. No Claude API calls required.

---

## Onboarding

First launch — 4 questions, ~30 seconds:

1. Goal: Strength / Muscle / Fat Loss / General Fitness
2. Experience: New / 6m–2yr / 2yr+
3. Equipment: (multi-select) Dumbbells / Barbell / Kettlebell / Pull-up bar / Full gym
4. Days per week: 2–5

Based on answers, one program is recommended immediately with explanation. User can start it directly or browse all programs.

**Beginner experience:** More coaching notes on exercises, simpler programs (3 days, full body), RPE explanations.
**Advanced experience:** Full program stats, progression logic shown upfront, raw controls visible.

---

## Data Persistence

- All data keyed to Firebase user UID in Firestore
- `localStorage` as offline cache and unauthenticated fallback
- On sign-in: pull from Firestore, merge with local state (cloud wins)
- On every save: write to `localStorage` immediately + async push to Firestore
- `WorkoutLog` entries pushed immediately on workout completion

### Firestore structure
```
users/{uid}/profile        — User profile doc
users/{uid}/programs/{id}  — Program docs
users/{uid}/logs/{id}      — WorkoutLog docs (immutable)
users/{uid}/suggestions/{id} — ProgressionSuggestion docs
```

---

## Darebee Integration

Existing 105 Darebee workouts (in `darebee-data.js`) are surfaced in:
- Exercise picker (as individual exercises)
- Program builder "Import from Darebee" flow
- A browsable Darebee library (preserved from current app)

The standalone Darebee tab from the current app becomes part of Build → Browse Workouts.

---

## Out of Scope

- Native mobile app (GitHub Pages only)
- Social features (sharing, leaderboards)
- AI-generated programs (engine is rule-based only)
- Video demonstrations
- Nutrition/diet tracking
- Payment / subscription

---

## Success Criteria

1. A new user completes onboarding and starts their first workout in under 2 minutes
2. An advanced user can build a custom 12-week program in under 10 minutes
3. The app works fully offline (localStorage fallback)
4. Today screen never shows more than one primary action
5. Adaptive suggestions are accepted >60% of the time (they feel useful, not arbitrary)
