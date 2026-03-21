# Build Tab Redesign — Single-Page Program Builder

**Date:** 2026-03-21
**Status:** Approved
**Scope:** Redesign Build tab workflow, fix Darebee integration, add text file import

## Problem Statement

The current Build tab has three usability issues:
1. **Unintuitive workout creator** — multi-level sub-page navigation (home → program editor → workout editor → exercise picker) is confusing and easy to get lost in
2. **Poorly integrated Darebee import** — creates a new program and navigates away, breaking user flow
3. **No text/file import** — users cannot paste or upload workout plans from external sources

## Design Overview

Replace the current multi-sub-page Build tab with a single-page program builder. All editing happens inline via expanding/collapsing sections and overlay sheets. No sub-page navigation — the Build tab stops using `pushSubPage`/`popSubPage`. Other tabs continue using the router sub-page mechanism unchanged.

## Section 1: Build Tab Home — Program List

- Top bar: "My Programs" title + "New Program" button + "Generate Workout" button (preserves existing AI generator feature, opens `renderGenerator()` as before via `pushSubPage`)
- Program cards showing: name, workout day count, "Active" badge if current
- Tap card → opens single-page builder for that program (component-level state, not router sub-page)
- Built-in template programs (from `BUILTIN_PROGRAMS`) shown separately under "Templates" heading — tap clones to a new user program (clone-on-edit, as current behavior)
- Empty state: "Create your first program" CTA + "Start from template"

### Creating a New Program

- "New Program" → inline name input at top (no modal, no navigation)
- "Start from template" row with horizontal chips: Push/Pull/Legs, Upper/Lower, Full Body 3x, Bro Split, Blank
- Picking a template pre-fills the 7-day grid with exercises
- Picking "Blank" gives empty 7-day grid
- Immediately in the builder — no extra steps

## Section 2: Single-Page Program Builder

### Layout

- Editable program name at top
- **Total Weeks** input (maps to `prog.totalWeeks`, default 8) — inline number input next to program name
- 7 day cards stacked vertically (Mon–Sun)
- Each day card shows:
  - Day label + editable workout name (e.g. "Push Day")
  - Collapsed: exercise count + muscle group tags (e.g. "4 exercises · Chest, Shoulders, Triceps")
  - "Rest Day" toggle — dims card
  - Expand/collapse chevron

### Data Model for 7-Day Grid

The existing `makeProgram().days[]` array stores `WorkoutTemplate` objects with `dayOfWeek` (0-6). The 7-day grid always renders all 7 days. Rest days are represented by the *absence* of a template for that `dayOfWeek` — no schema change needed. Toggling "Rest Day" on removes the template from the array; toggling it off creates a new empty template with that `dayOfWeek`.

### Expanded Day Card

- Exercise list: name, sets × reps, edit/remove buttons
- Up/down arrows for reordering
- **"+ Add Exercises"** button → opens exercise picker sheet
- **"Import"** button → dropdown with three options:
  - Browse Darebee
  - Paste Text
  - Upload File

### Builder-Level Actions (bottom of entire page, not per-card)

- "Set as Active Program" button (if not already active)
- "Delete Program" danger button

## Section 3: Exercise Picker Sheet

- Slides up from bottom as overlay (not a new page)
- New CSS/JS component: bottom sheet with backdrop, slide-up animation, scroll trapping, z-index above content
- **Multi-select mode** — tap to toggle checkmark, add many at once
- Search bar with instant filtering
- Exercises grouped by muscle group
- Each row: exercise name, primary muscle, equipment tag
- Source tabs: **Library** (from `getAllExercises()` which includes `EXERCISE_LIBRARY` global) | **Darebee** (individual exercises from `window.DAREBEE_WORKOUTS`)
- Fixed bottom button: "Add Selected (N)" — adds all checked, closes sheet
- Default sets/reps: 3×10, editable after adding

## Section 4: Text Import

### Format

```
# Push Day
Bench Press 4x8
Incline Dumbbell Press 3x12
Cable Flyes 3x15

# Pull Day
Deadlift 3x5
Barbell Rows 4x8
Lat Pulldown 3x12
```

### Parsing Rules

- `#` lines = workout/day name
- Exercise lines: `Name SetsxReps` (flexible spacing, case-insensitive x)
- No `#` headers → single workout
- Blank lines ignored
- Optional weight: `Bench Press 4x8 @135lb` or `@60kg` — `lb` converted to `kg` (÷ 2.205), `kg` used directly. Maps to `targetLoadKg` on the exercise slot.
- **Fuzzy matching algorithm:** token-based overlap — split exercise name and library names into lowercase tokens, score by proportion of matching tokens. Threshold: ≥50% token overlap = match. If multiple matches, pick highest score. Below threshold = custom exercise. This is simple, dependency-free, and handles common variations ("Bench Press" matches "Barbell Bench Press").
- **Preview step:** shows each parsed exercise with its match status. Green = exact match, yellow = fuzzy match (shows matched library name, user can tap to change), red = no match (added as custom). User can correct individual matches before confirming.

### Entry Points

- **Paste Text:** textarea inline in import dropdown → preview → confirm
- **Upload File:** file picker (`.txt`, max 50KB) → same parser → preview → confirm
- **Preview step** shows parsed exercises with match highlights for correction
- Multiple `#` sections → each maps to a separate day in the program
- "Download Template" link in import dropdown
- If text is completely unparseable (no exercise lines found) → show error message: "No exercises found. Check the format and try again."

## Section 5: Darebee Integration

Darebee becomes an exercise/workout *source*, not a standalone feature.

- **Exercise picker "Darebee" tab:** browse individual Darebee exercises, add them one-by-one or multi-select alongside library exercises
- **Import dropdown "Browse Darebee":** opens compact browser with filterable workout cards. Picking a whole Darebee workout **appends** its exercises to the current day (does not replace existing exercises). This is the "import a whole workout" flow.
- **No separate Darebee Browser sub-page** — lives within the builder flow
- **Exercise matching:** imported exercises matched against library for metadata; unmatched added as custom with Darebee name preserved

The distinction: the picker tab is for cherry-picking individual exercises; the import dropdown is for importing an entire Darebee workout at once.

## Section 6: Program Templates

| Template | Days | Structure |
|----------|------|-----------|
| Push / Pull / Legs | 6 | Push, Pull, Legs, Push, Pull, Legs, Rest |
| Upper / Lower | 4 | Upper, Lower, Rest, Upper, Lower, Rest, Rest |
| Full Body 3x | 3 | Full Body, Rest, Full Body, Rest, Full Body, Rest, Rest |
| Bro Split | 5 | Chest, Back, Shoulders, Legs, Arms, Rest, Rest |

- Pre-filled with exercises drawn from `EXERCISE_LIBRARY` (the large global from `exercise-library.js`, not the small 15-exercise built-in set)
- Template exercise data defined as arrays of exercise names + sets/reps in the build module, matched against `EXERCISE_LIBRARY` at render time
- Fully editable after selection
- Custom template saving is a stretch goal (not v1)

## Technical Notes

- All rendering in `js/render/build.js` — complete rewrite
- Uses existing schema functions: `makeProgram`, `makeWorkoutTemplate`, `makeExerciseSlot`
- Exercise data from `getAllExercises()` + `window.DAREBEE_WORKOUTS`
- State persistence via `saveState()` to localStorage; Firestore sync via `pushDoc('programs', prog)` when user is authenticated (matching current behavior in `saveAndBack`)
- Text parser added as utility function within build.js
- CSS additions to `css/main.css` for: bottom sheet overlay (`.build-sheet`, `.build-sheet-backdrop`), day cards (`.build-day-card`), template chips, import dropdown
- Bottom sheet is a new UI component: fixed-position overlay with backdrop, CSS `transform: translateY()` animation, scroll trapping via `overflow: hidden` on body
- No new dependencies — vanilla JS only
- The "Generate Workout" feature remains accessible from the Build home page, using the existing `pushSubPage` mechanism — it is the one exception to the "no sub-pages" rule for Build
