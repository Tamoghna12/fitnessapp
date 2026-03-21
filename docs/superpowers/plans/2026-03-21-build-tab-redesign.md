# Build Tab Redesign Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current multi-sub-page Build tab with a single-page program builder that includes multi-select exercise picker, Darebee integration, and text/file import.

**Architecture:** Complete rewrite of `js/render/build.js`. All UI state (which day is expanded, whether sheets are open, picker selection state) lives in module-level variables rather than the router. The router sub-page mechanism is only kept for "Generate Workout" which delegates to the existing `renderGenerator()`. A new bottom-sheet component (CSS + JS) handles the exercise picker and Darebee browser overlays. CSS additions go into `css/main.css`.

**Tech Stack:** Vanilla JS ES modules, CSS custom properties, localStorage persistence, Firebase Firestore for cloud sync when authenticated.

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `js/render/build.js` | **Rewrite** | All Build tab rendering and interaction — program list, builder, picker sheet, text parser, Darebee integration |
| `css/main.css` | **Append** | Bottom sheet overlay, day card styles, template chips, import dropdown, picker row styles |

No new files needed.

---

## Important Context for Implementer

- **`window.*` globals are required** for all `onclick` handlers in template strings (module scope is not accessible from inline HTML event handlers)
- **`getAllExercises(state.exercises)`** returns combined built-in + `EXERCISE_LIBRARY` global + Darebee exercises + custom — use this for the exercise picker
- **`window.DAREBEE_WORKOUTS`** is the global for Darebee workout cards (loaded via `<script>` in index.html)
- **`parseDarebeeExercise(dbEx)`** in `data.js` converts a Darebee exercise object to `{ exercise, slot }` — reuse this
- **`saveProgram(prog)`** persists to localStorage; also call `pushDoc(db, currentUser.uid, 'programs', prog)` when `currentUser && db` for Firestore sync
- **`rerender()`** re-renders the current tab (imported from router.js)
- The module-level state for UI (expanded days, open sheet, picker state) must be reset when the tab re-renders
- **CSS bottom-of-page** — `bottom-nav` is `position: fixed; bottom: 0; height: 56px` so add `padding-bottom: 80px` to the builder page to prevent content being hidden behind it

---

## Task 1: CSS — Bottom Sheet + Build Card Styles

**Files:**
- Modify: `css/main.css` (append at end)

- [ ] **Step 1: Append bottom sheet CSS**

Add to end of `css/main.css`:

```css
/* ── Build Tab ─────────────────────────────────────────────────────────────── */

/* Bottom sheet overlay */
.build-sheet-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  z-index: 300;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.22s ease;
}
.build-sheet-backdrop.open {
  opacity: 1;
  pointer-events: all;
}
.build-sheet {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--bg-card);
  border-radius: var(--radius) var(--radius) 0 0;
  box-shadow: var(--shadow-lg);
  z-index: 301;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  transform: translateY(100%);
  transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
}
.build-sheet.open {
  transform: translateY(0);
}
.build-sheet-handle {
  width: 36px;
  height: 4px;
  background: var(--border);
  border-radius: 2px;
  margin: 12px auto 0;
  flex-shrink: 0;
}
.build-sheet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px 10px;
  border-bottom: 1px solid var(--border-subtle);
  flex-shrink: 0;
}
.build-sheet-title {
  font-weight: 600;
  font-size: 1rem;
}
.build-sheet-close {
  background: none;
  border: none;
  font-size: 1.2rem;
  color: var(--text-muted);
  cursor: pointer;
  padding: 4px;
  line-height: 1;
}
.build-sheet-tabs {
  display: flex;
  gap: 0;
  border-bottom: 1px solid var(--border-subtle);
  flex-shrink: 0;
}
.build-sheet-tab {
  flex: 1;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  padding: 10px 0;
  font-size: 0.88rem;
  font-weight: 500;
  color: var(--text-muted);
  cursor: pointer;
  transition: color var(--transition), border-color var(--transition);
}
.build-sheet-tab.active {
  color: var(--accent);
  border-bottom-color: var(--accent);
}
.build-sheet-search {
  padding: 10px 16px;
  flex-shrink: 0;
}
.build-sheet-search input {
  width: 100%;
  padding: 9px 14px;
  background: var(--bg-input);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xs);
  font-size: 0.9rem;
  font-family: inherit;
  color: var(--text-primary);
  outline: none;
}
.build-sheet-search input:focus {
  border-color: var(--accent);
}
.build-sheet-body {
  overflow-y: auto;
  flex: 1;
  padding: 0 16px;
  padding-bottom: 80px; /* space for add-selected button */
}
.build-sheet-footer {
  position: sticky;
  bottom: 0;
  padding: 12px 16px;
  background: var(--bg-card);
  border-top: 1px solid var(--border-subtle);
  flex-shrink: 0;
}

/* Exercise picker rows */
.ex-picker-group-label {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
  padding: 12px 0 4px;
}
.ex-picker-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 0;
  border-bottom: 1px solid var(--border-subtle);
  cursor: pointer;
  user-select: none;
}
.ex-picker-row:last-child { border-bottom: none; }
.ex-picker-check {
  width: 20px;
  height: 20px;
  border: 2px solid var(--border);
  border-radius: 5px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background var(--transition), border-color var(--transition);
  font-size: 0.75rem;
  color: white;
}
.ex-picker-row.selected .ex-picker-check {
  background: var(--accent);
  border-color: var(--accent);
}
.ex-picker-name {
  font-weight: 500;
  font-size: 0.9rem;
  flex: 1;
}
.ex-picker-meta {
  font-size: 0.73rem;
  color: var(--text-muted);
}
.ex-picker-source {
  font-size: 0.68rem;
  color: var(--text-muted);
  white-space: nowrap;
}

/* Day cards */
.build-day-card {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  margin-bottom: 10px;
  overflow: hidden;
  transition: box-shadow var(--transition);
}
.build-day-card:focus-within {
  box-shadow: var(--shadow-sm);
}
.build-day-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  cursor: pointer;
  user-select: none;
}
.build-day-label {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
  min-width: 30px;
}
.build-day-name {
  flex: 1;
  font-weight: 500;
  font-size: 0.92rem;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.build-day-meta {
  font-size: 0.72rem;
  color: var(--text-muted);
  white-space: nowrap;
}
.build-day-chevron {
  color: var(--text-muted);
  font-size: 0.8rem;
  transition: transform var(--transition);
  flex-shrink: 0;
}
.build-day-card.expanded .build-day-chevron {
  transform: rotate(180deg);
}
.build-day-card.rest .build-day-name {
  color: var(--text-muted);
  font-style: italic;
}
.build-day-body {
  display: none;
  padding: 0 14px 14px;
  border-top: 1px solid var(--border-subtle);
}
.build-day-card.expanded .build-day-body {
  display: block;
}
.build-day-name-input {
  width: 100%;
  background: var(--bg-input);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xs);
  padding: 7px 10px;
  font-size: 0.92rem;
  font-family: inherit;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 10px;
  margin-top: 10px;
  outline: none;
}
.build-day-name-input:focus {
  border-color: var(--accent);
}
.build-day-rest-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.83rem;
  color: var(--text-secondary);
  margin-bottom: 10px;
  cursor: pointer;
}
.build-day-rest-toggle input[type="checkbox"] {
  width: 14px;
  height: 14px;
  accent-color: var(--accent);
  cursor: pointer;
}

/* Slot list within a day */
.build-slot-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 0;
  border-bottom: 1px solid var(--border-subtle);
  font-size: 0.88rem;
}
.build-slot-row:last-of-type { border-bottom: none; }
.build-slot-name { flex: 1; font-weight: 500; }
.build-slot-meta { font-size: 0.73rem; color: var(--text-muted); }
.build-slot-actions { display: flex; gap: 4px; flex-shrink: 0; }
.build-slot-btn {
  background: none;
  border: 1px solid var(--border);
  border-radius: 5px;
  padding: 2px 6px;
  font-size: 0.72rem;
  cursor: pointer;
  color: var(--text-secondary);
  transition: background var(--transition), color var(--transition);
}
.build-slot-btn:hover { background: var(--bg-elevated); }
.build-slot-btn.danger { color: var(--accent); border-color: transparent; }

/* Day action buttons row */
.build-day-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

/* Import dropdown */
.build-import-dropdown {
  position: relative;
  display: inline-block;
}
.build-import-menu {
  display: none;
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-xs);
  box-shadow: var(--shadow-md);
  z-index: 100;
  min-width: 160px;
  overflow: hidden;
}
.build-import-menu.open { display: block; }
.build-import-menu button {
  display: block;
  width: 100%;
  padding: 9px 14px;
  background: none;
  border: none;
  font-size: 0.85rem;
  text-align: left;
  cursor: pointer;
  color: var(--text-primary);
  font-family: inherit;
  transition: background var(--transition);
}
.build-import-menu button:hover { background: var(--bg-elevated); }

/* Template chips */
.build-template-chips {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin: 12px 0 0;
}
.build-template-chip {
  padding: 6px 14px;
  border-radius: 20px;
  border: 1.5px solid var(--border);
  background: var(--bg-card);
  font-size: 0.82rem;
  font-weight: 500;
  cursor: pointer;
  color: var(--text-secondary);
  transition: border-color var(--transition), color var(--transition), background var(--transition);
  white-space: nowrap;
}
.build-template-chip:hover {
  border-color: var(--accent);
  color: var(--accent);
  background: rgba(37, 99, 235, 0.05);
}

/* Inline text import area */
.build-import-area {
  margin-top: 10px;
  display: none;
}
.build-import-area.open { display: block; }
.build-import-textarea {
  width: 100%;
  min-height: 140px;
  padding: 10px 12px;
  background: var(--bg-input);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xs);
  font-size: 0.82rem;
  font-family: 'JetBrains Mono', monospace;
  color: var(--text-primary);
  resize: vertical;
  outline: none;
  margin-bottom: 8px;
}
.build-import-textarea:focus { border-color: var(--accent); }

/* Import preview */
.build-import-preview {
  margin-top: 8px;
}
.build-import-preview-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 0;
  font-size: 0.83rem;
  border-bottom: 1px solid var(--border-subtle);
}
.build-import-preview-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.build-import-preview-dot.match-exact { background: #10b981; }
.build-import-preview-dot.match-fuzzy { background: #d97706; }
.build-import-preview-dot.match-none  { background: #94a3b8; }

/* Program list */
.build-prog-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  margin-bottom: 8px;
  cursor: pointer;
  transition: box-shadow var(--transition), border-color var(--transition);
}
.build-prog-card:hover {
  border-color: var(--accent);
  box-shadow: var(--shadow-sm);
}
.build-prog-name {
  font-weight: 600;
  font-size: 0.95rem;
}
.build-prog-meta {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-top: 2px;
}
.build-active-badge {
  font-size: 0.62rem;
  background: rgba(16,185,129,.12);
  color: #059669;
  padding: 2px 7px;
  border-radius: 4px;
  font-weight: 700;
  letter-spacing: 0.04em;
  flex-shrink: 0;
}

/* Slot editor inline */
.build-slot-editor {
  background: var(--bg-input);
  border-radius: var(--radius-xs);
  padding: 12px;
  margin: 6px 0;
}
.build-slot-editor-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 10px;
  margin-bottom: 10px;
}
.build-slot-editor label {
  font-size: 0.72rem;
  color: var(--text-muted);
  display: block;
  margin-bottom: 3px;
  font-weight: 500;
}
.build-slot-editor input,
.build-slot-editor select {
  width: 100%;
  padding: 6px 8px;
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  font-size: 0.85rem;
  font-family: inherit;
  color: var(--text-primary);
  outline: none;
}
.build-slot-editor input:focus,
.build-slot-editor select:focus { border-color: var(--accent); }

/* New program inline creation area */
.build-new-prog-area {
  background: var(--bg-card);
  border: 1.5px dashed var(--border);
  border-radius: var(--radius-sm);
  padding: 16px;
  margin-bottom: 16px;
  display: none;
}
.build-new-prog-area.open { display: block; }
.build-new-prog-input {
  width: 100%;
  padding: 9px 12px;
  background: var(--bg-input);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xs);
  font-size: 1rem;
  font-family: inherit;
  font-weight: 600;
  color: var(--text-primary);
  outline: none;
  margin-bottom: 4px;
}
.build-new-prog-input:focus { border-color: var(--accent); }
```

- [ ] **Step 2: Verify CSS renders without errors**

Open the app in a browser, go to Build tab. The page should load without visual breakage. (New classes aren't used yet but adding them shouldn't break anything.)

- [ ] **Step 3: Commit**

```bash
cd /home/lunet/cgtd/Documents/product/fitnessapp
git add css/main.css
git commit -m "style: add build tab CSS — bottom sheet, day cards, program list, picker rows"
```

---

## Task 2: Module-Level State + Build Home

**Files:**
- Modify: `js/render/build.js` (full rewrite begins)

The existing `build.js` is 401 lines. Replace it entirely starting with this task.

- [ ] **Step 1: Write the new build.js — imports, module state, helper functions, and renderBuild()**

Replace the **entire contents** of `js/render/build.js` with:

```javascript
import { state, getActiveProgram, saveProgram, saveExercise, updateProfile, saveState } from '../state.js';
import { BUILTIN_PROGRAMS, BUILTIN_EXERCISES, getAllExercises, parseDarebeeExercise } from '../data.js';
import { makeProgram, makeWorkoutTemplate, makeExerciseSlot, makeExercise } from '../schema.js';
import { pushSubPage, rerender } from '../router.js';
import { currentUser, db } from '../auth.js';
import { pushDoc } from '../firestore.js';
import { renderGenerator } from './generator.js';

// ── Module-level UI state (reset on each render) ─────────────────────────────
let _editingProgramId = null;   // null = list view, string = builder view
let _expandedDays    = new Set(); // set of dayOfWeek indices (0-6) currently expanded
let _pickerDayOfWeek = null;    // which day the picker sheet is open for
let _pickerTab       = 'library'; // 'library' | 'darebee'
let _pickerSearch    = '';
let _pickerSelected  = new Set(); // set of exerciseIds currently checked
let _editingSlot     = null;    // { programId, templateId, slotId } or null
let _importOpenDay   = null;    // dayOfWeek with import dropdown open
let _importMode      = null;    // 'paste' | 'darebee' | null
let _importDarebeeSearch = '';
let _darebeePickerProgId = null; // programId context for darebee import

// ── Entry point ───────────────────────────────────────────────────────────────
export function renderBuild(subPage) {
  if (subPage?.type === 'generator') return renderGenerator();
  // Reset sheet state on fresh render
  return _editingProgramId ? renderBuilder(_editingProgramId) : renderBuildHome();
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function getProgram(id) {
  return state.programs[id]
    ?? BUILTIN_PROGRAMS.find(p => p.id === id)
    ?? makeProgram();
}

function getExName(exerciseId) {
  return state.exercises[exerciseId]?.name
    ?? BUILTIN_EXERCISES.find(e => e.id === exerciseId)?.name
    ?? (getAllExercises(state.exercises).find(e => e.id === exerciseId)?.name)
    ?? exerciseId;
}

function getExMuscle(exerciseId) {
  return state.exercises[exerciseId]?.muscleGroup
    ?? BUILTIN_EXERCISES.find(e => e.id === exerciseId)?.muscleGroup
    ?? (getAllExercises(state.exercises).find(e => e.id === exerciseId)?.muscleGroup)
    ?? '';
}

function syncFirestore(prog) {
  if (currentUser && db) pushDoc(db, currentUser.uid, 'programs', prog);
}

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// ── Build Home ─────────────────────────────────────────────────────────────────
function renderBuildHome() {
  const userPrograms = Object.values(state.programs).filter(p => !p.isTemplate);
  const activeId = state.profile.activeProgramId;

  return `
    <div class="page active" style="padding-bottom:80px">
      <div class="page-title">Build</div>

      <div style="display:flex;gap:8px;margin-bottom:1.25rem;flex-wrap:wrap">
        <button class="btn btn-accent" onclick="buildNewProgram()">+ New Program</button>
        <button class="btn btn-ghost" onclick="buildOpenGenerator()">⚡ Generate</button>
      </div>

      <!-- Inline new program creation area -->
      <div class="build-new-prog-area" id="build-new-prog-area">
        <div style="font-size:0.82rem;font-weight:600;color:var(--text-secondary);margin-bottom:8px">Program name</div>
        <input class="build-new-prog-input" id="build-new-prog-name" placeholder="e.g. Push Pull Legs" />
        <div style="font-size:0.78rem;color:var(--text-muted);margin:8px 0 4px">Start from a template:</div>
        <div class="build-template-chips">
          <button class="build-template-chip" onclick="buildCreateFromTemplate('ppl')">Push/Pull/Legs</button>
          <button class="build-template-chip" onclick="buildCreateFromTemplate('ul')">Upper/Lower</button>
          <button class="build-template-chip" onclick="buildCreateFromTemplate('fb3')">Full Body 3×</button>
          <button class="build-template-chip" onclick="buildCreateFromTemplate('bro')">Bro Split</button>
          <button class="build-template-chip" onclick="buildCreateFromTemplate('blank')">Blank</button>
        </div>
        <div style="display:flex;gap:8px;margin-top:12px">
          <button class="btn btn-ghost" style="font-size:0.82rem" onclick="buildCancelNew()">Cancel</button>
        </div>
      </div>

      <!-- User programs -->
      <div class="section-label" style="margin-bottom:8px">My Programs</div>
      ${userPrograms.length === 0 ? `
        <div style="color:var(--text-muted);font-size:0.88rem;padding:16px 0">No programs yet. Create one above.</div>
      ` : userPrograms.map(p => `
        <div class="build-prog-card" onclick="buildOpenBuilder('${p.id}')">
          <div>
            <div style="display:flex;align-items:center;gap:8px">
              <span class="build-prog-name">${p.name}</span>
              ${p.id === activeId ? `<span class="build-active-badge">ACTIVE</span>` : ''}
            </div>
            <div class="build-prog-meta">${p.days.length} workout day${p.days.length !== 1 ? 's' : ''} · ${p.totalWeeks} weeks</div>
          </div>
          <span style="color:var(--text-muted);font-size:0.85rem">›</span>
        </div>
      `).join('')}

      <!-- Built-in templates -->
      <div class="section-label" style="margin:1.25rem 0 8px">Templates</div>
      <div style="font-size:0.78rem;color:var(--text-muted);margin-bottom:10px">Tap to clone and customize</div>
      ${BUILTIN_PROGRAMS.map(p => `
        <div class="build-prog-card" onclick="buildCloneTemplate('${p.id}')">
          <div>
            <div class="build-prog-name">${p.name}</div>
            <div class="build-prog-meta">${p.days.length} workout days · ${p.totalWeeks} weeks</div>
          </div>
          <span style="color:var(--text-muted);font-size:0.85rem">Clone ›</span>
        </div>
      `).join('')}
    </div>
  `;
}
```

- [ ] **Step 2: Add global handlers for the home view (still in build.js, continue appending)**

```javascript
// ── Home globals ──────────────────────────────────────────────────────────────
window.buildNewProgram = function() {
  const area = document.getElementById('build-new-prog-area');
  if (area) { area.classList.add('open'); area.querySelector('input')?.focus(); }
};

window.buildCancelNew = function() {
  const area = document.getElementById('build-new-prog-area');
  if (area) area.classList.remove('open');
};

window.buildOpenGenerator = function() {
  pushSubPage({ type: 'generator' });
};

window.buildOpenBuilder = function(programId) {
  _editingProgramId = programId;
  _expandedDays = new Set();
  rerender();
};

window.buildCloneTemplate = function(templateId) {
  const src = BUILTIN_PROGRAMS.find(p => p.id === templateId);
  if (!src) return;
  const clone = {
    ...JSON.parse(JSON.stringify(src)),
    id: `${templateId}-${Date.now()}`,
    isTemplate: false,
    name: src.name + ' (copy)',
  };
  saveProgram(clone);
  _editingProgramId = clone.id;
  _expandedDays = new Set();
  rerender();
};

window.buildCreateFromTemplate = function(tplKey) {
  const nameInput = document.getElementById('build-new-prog-name');
  const name = nameInput?.value.trim() || _TEMPLATES[tplKey]?.name || 'My Program';
  const tpl = _TEMPLATES[tplKey];
  const prog = makeProgram({ name });
  if (tpl) {
    prog.days = tpl.days.map((d, i) => makeWorkoutTemplate({
      name: d.name,
      dayOfWeek: d.dow,
      slots: (d.exercises || []).map(exName => {
        const ex = _findExercise(exName);
        if (!ex) return null;
        return makeExerciseSlot({ exerciseId: ex.id, targetSets: d.sets || 3, targetRepsMin: d.repsMin || 8, targetRepsMax: d.repsMax || 12 });
      }).filter(Boolean),
    }));
  }
  saveProgram(prog);
  _editingProgramId = prog.id;
  _expandedDays = new Set();
  rerender();
};
```

- [ ] **Step 3: Verify Build tab renders the home screen**

Open the app, click Build. You should see "My Programs" and "Templates" sections, with a "+ New Program" button. Clicking it should reveal the template chips area.

- [ ] **Step 4: Commit**

```bash
git add js/render/build.js
git commit -m "feat: build tab home — program list, clone templates, new program creation"
```

---

## Task 3: Program Templates Data

**Files:**
- Modify: `js/render/build.js` (append)

- [ ] **Step 1: Add template data and exercise finder (append to build.js)**

```javascript
// ── Template data ─────────────────────────────────────────────────────────────
// exercises referenced by name — matched against getAllExercises() at runtime
function _findExercise(name) {
  const all = getAllExercises(state.exercises);
  // Exact match first
  const exact = all.find(e => e.name.toLowerCase() === name.toLowerCase());
  if (exact) return exact;
  // Token fuzzy match
  return _fuzzyFindExercise(name, all);
}

function _fuzzyFindExercise(name, exercises) {
  const qTokens = name.toLowerCase().split(/\s+/);
  let best = null, bestScore = 0;
  for (const ex of exercises) {
    const eTokens = ex.name.toLowerCase().split(/\s+/);
    const matches = qTokens.filter(t => eTokens.includes(t)).length;
    const score = matches / Math.max(qTokens.length, eTokens.length);
    if (score >= 0.5 && score > bestScore) { best = ex; bestScore = score; }
  }
  return best;
}

const _TEMPLATES = {
  ppl: {
    name: 'Push Pull Legs',
    days: [
      { name: 'Push', dow: 0, sets: 3, repsMin: 8, repsMax: 12,
        exercises: ['Bench Press', 'Overhead Press', 'Incline Dumbbell Press', 'Tricep Pushdown', 'Lateral Raise'] },
      { name: 'Pull', dow: 1, sets: 3, repsMin: 8, repsMax: 12,
        exercises: ['Deadlift', 'Barbell Row', 'Lat Pulldown', 'Face Pull', 'Bicep Curl'] },
      { name: 'Legs', dow: 2, sets: 3, repsMin: 8, repsMax: 12,
        exercises: ['Squat', 'Romanian Deadlift', 'Leg Press', 'Leg Curl', 'Calf Raise'] },
      { name: 'Push', dow: 3, sets: 3, repsMin: 8, repsMax: 12,
        exercises: ['Bench Press', 'Overhead Press', 'Cable Fly', 'Tricep Overhead Extension', 'Lateral Raise'] },
      { name: 'Pull', dow: 4, sets: 3, repsMin: 8, repsMax: 12,
        exercises: ['Deadlift', 'Pull Up', 'Seated Row', 'Face Pull', 'Hammer Curl'] },
      { name: 'Legs', dow: 5, sets: 3, repsMin: 8, repsMax: 12,
        exercises: ['Squat', 'Romanian Deadlift', 'Bulgarian Split Squat', 'Leg Extension', 'Calf Raise'] },
    ],
  },
  ul: {
    name: 'Upper Lower',
    days: [
      { name: 'Upper A', dow: 0, sets: 3, repsMin: 8, repsMax: 12,
        exercises: ['Bench Press', 'Barbell Row', 'Overhead Press', 'Lat Pulldown', 'Bicep Curl', 'Tricep Pushdown'] },
      { name: 'Lower A', dow: 1, sets: 3, repsMin: 8, repsMax: 12,
        exercises: ['Squat', 'Romanian Deadlift', 'Leg Press', 'Leg Curl', 'Calf Raise'] },
      { name: 'Upper B', dow: 3, sets: 3, repsMin: 8, repsMax: 12,
        exercises: ['Incline Dumbbell Press', 'Pull Up', 'Lateral Raise', 'Seated Row', 'Hammer Curl', 'Tricep Overhead Extension'] },
      { name: 'Lower B', dow: 4, sets: 3, repsMin: 8, repsMax: 12,
        exercises: ['Deadlift', 'Bulgarian Split Squat', 'Leg Extension', 'Leg Curl', 'Calf Raise'] },
    ],
  },
  fb3: {
    name: 'Full Body 3x',
    days: [
      { name: 'Full Body A', dow: 0, sets: 3, repsMin: 8, repsMax: 12,
        exercises: ['Squat', 'Bench Press', 'Barbell Row', 'Overhead Press', 'Plank'] },
      { name: 'Full Body B', dow: 2, sets: 3, repsMin: 8, repsMax: 12,
        exercises: ['Deadlift', 'Incline Dumbbell Press', 'Pull Up', 'Lateral Raise', 'Glute Bridge'] },
      { name: 'Full Body C', dow: 4, sets: 3, repsMin: 8, repsMax: 12,
        exercises: ['Squat', 'Bench Press', 'Seated Row', 'Bicep Curl', 'Tricep Pushdown'] },
    ],
  },
  bro: {
    name: 'Bro Split',
    days: [
      { name: 'Chest', dow: 0, sets: 3, repsMin: 8, repsMax: 12,
        exercises: ['Bench Press', 'Incline Dumbbell Press', 'Cable Fly', 'Push Up'] },
      { name: 'Back', dow: 1, sets: 3, repsMin: 8, repsMax: 12,
        exercises: ['Deadlift', 'Barbell Row', 'Lat Pulldown', 'Seated Row'] },
      { name: 'Shoulders', dow: 2, sets: 3, repsMin: 10, repsMax: 15,
        exercises: ['Overhead Press', 'Lateral Raise', 'Face Pull', 'Front Raise'] },
      { name: 'Legs', dow: 3, sets: 3, repsMin: 8, repsMax: 12,
        exercises: ['Squat', 'Romanian Deadlift', 'Leg Press', 'Leg Curl', 'Calf Raise'] },
      { name: 'Arms', dow: 4, sets: 3, repsMin: 10, repsMax: 15,
        exercises: ['Bicep Curl', 'Hammer Curl', 'Tricep Pushdown', 'Tricep Overhead Extension', 'Skull Crusher'] },
    ],
  },
  blank: { name: 'My Program', days: [] },
};
```

- [ ] **Step 2: Verify template creation works**

Open Build tab → New Program → type a name → click "Push/Pull/Legs" chip → the builder should open with 6 day cards pre-populated. Open the browser DevTools console and look for any warnings. Add this line to `_findExercise` to surface missing exercises:

```javascript
function _findExercise(name) {
  const all = getAllExercises(state.exercises);
  const exact = all.find(e => e.name.toLowerCase() === name.toLowerCase());
  if (exact) return exact;
  const fuzzy = _fuzzyFindExercise(name, all);
  if (!fuzzy) console.warn('[build] No exercise match for:', name);
  return fuzzy;
}
```

Template exercises use common barbell names (e.g. "Bench Press", "Squat"). These will match from the `EXERCISE_LIBRARY` global (loaded via `exercise-library.js`). If the library hasn't loaded or is empty, exercises will be silently dropped — the `console.warn` above will surface this.

- [ ] **Step 3: Commit**

```bash
git add js/render/build.js
git commit -m "feat: program template data — PPL, UL, Full Body 3x, Bro Split with exercise fuzzy matching"
```

---

## Task 4: Single-Page Builder — 7-Day Accordion

**Files:**
- Modify: `js/render/build.js` (append)

- [ ] **Step 1: Add renderBuilder() function**

```javascript
// ── Builder ───────────────────────────────────────────────────────────────────
function renderBuilder(programId) {
  const prog = getProgram(programId);
  const activeId = state.profile.activeProgramId;
  const isActive = prog.id === activeId;

  const dayCards = DAY_NAMES.map((dayName, dow) => {
    const template = prog.days.find(d => d.dayOfWeek === dow);
    const isExpanded = _expandedDays.has(dow);
    const isRest = !template;

    const slotList = template ? template.slots.map((slot, idx) => {
      const isEditingSlot = _editingSlot?.slotId === slot.id;
      return `
        <div class="build-slot-row">
          <div style="display:flex;flex-direction:column;gap:1px">
            <button class="build-slot-btn" onclick="buildMoveSlot('${programId}','${template.id}','${slot.id}',-1)">▲</button>
            <button class="build-slot-btn" onclick="buildMoveSlot('${programId}','${template.id}','${slot.id}',1)">▼</button>
          </div>
          <div style="flex:1">
            <div class="build-slot-name">${getExName(slot.exerciseId)}</div>
            <div class="build-slot-meta">${slot.targetSets}×${slot.targetRepsMin}–${slot.targetRepsMax}${slot.targetLoadKg ? ` @ ${slot.targetLoadKg}kg` : ''}</div>
          </div>
          <div class="build-slot-actions">
            <button class="build-slot-btn" onclick="buildToggleSlotEditor('${programId}','${template.id}','${slot.id}')">
              ${isEditingSlot ? 'Done' : 'Edit'}
            </button>
            <button class="build-slot-btn danger" onclick="buildDeleteSlot('${programId}','${template.id}','${slot.id}')">✕</button>
          </div>
        </div>
        ${isEditingSlot ? renderSlotEditor(programId, template.id, slot) : ''}
      `;
    }).join('') : '';

    const importAreaHtml = _importOpenDay === dow ? renderImportArea(programId, dow, template) : '';

    return `
      <div class="build-day-card ${isExpanded ? 'expanded' : ''} ${isRest ? 'rest' : ''}"
           id="build-day-${dow}">
        <div class="build-day-header" onclick="buildToggleDay(${dow})">
          <span class="build-day-label">${dayName}</span>
          <span class="build-day-name">${isRest ? 'Rest' : (template.name || 'Untitled')}</span>
          <span class="build-day-meta">${template ? `${template.slots.length} ex` : ''}</span>
          <span class="build-day-chevron">▾</span>
        </div>
        ${isExpanded ? `
          <div class="build-day-body">
            <label class="build-day-rest-toggle">
              <input type="checkbox" ${isRest ? 'checked' : ''}
                onchange="buildToggleRest('${programId}',${dow},this.checked)"> Rest day
            </label>
            ${!isRest ? `
              <input class="build-day-name-input" value="${template.name}"
                placeholder="Workout name (e.g. Push Day)"
                onchange="buildUpdateTemplateName('${programId}','${template.id}',this.value)">
              ${slotList}
              <div class="build-day-actions">
                <button class="btn btn-ghost btn-sm" onclick="buildOpenPicker('${programId}',${dow})">+ Add Exercises</button>
                <div class="build-import-dropdown" id="import-dd-${dow}">
                  <button class="btn btn-ghost btn-sm" onclick="buildToggleImportMenu(${dow})">Import ▾</button>
                  <div class="build-import-menu" id="import-menu-${dow}">
                    <button onclick="buildStartDarebeeImport('${programId}',${dow})">Browse Darebee</button>
                    <button onclick="buildStartPasteImport('${programId}',${dow})">Paste Text</button>
                    <button onclick="buildStartFileImport('${programId}',${dow})">Upload File</button>
                    <button onclick="buildDownloadTemplate()">Download Template</button>
                  </div>
                </div>
              </div>
              ${importAreaHtml}
            ` : ''}
          </div>
        ` : ''}
      </div>
    `;
  }).join('');

  return `
    <div class="page active" style="padding-bottom:80px">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:1rem">
        <button class="btn btn-ghost btn-sm" onclick="buildGoHome()">← Back</button>
      </div>

      <div style="display:flex;align-items:center;gap:12px;margin-bottom:0.5rem;flex-wrap:wrap">
        <input class="build-new-prog-input" style="display:inline-block;width:auto;flex:1;min-width:160px"
          value="${prog.name}" placeholder="Program name"
          onchange="buildUpdateProgName('${programId}',this.value)">
        <label style="font-size:0.82rem;color:var(--text-secondary);display:flex;align-items:center;gap:6px;white-space:nowrap">
          <span>Weeks</span>
          <input type="number" min="1" max="52" value="${prog.totalWeeks}"
            style="width:52px;padding:6px 8px;background:var(--bg-input);border:1px solid var(--border-subtle);border-radius:6px;font-size:0.85rem;font-family:inherit;text-align:center;outline:none"
            onchange="buildUpdateProgWeeks('${programId}',+this.value)">
        </label>
      </div>

      ${dayCards}

      <div style="display:flex;gap:10px;margin-top:1.25rem;flex-wrap:wrap">
        ${!isActive ? `<button class="btn btn-accent" onclick="buildSetActive('${programId}')">Set as Active</button>` : `<span style="font-size:0.82rem;color:#059669;font-weight:600;padding:8px 0">✓ Active Program</span>`}
        <button class="btn btn-ghost" style="color:var(--accent)" onclick="buildDeleteProgram('${programId}')">Delete Program</button>
      </div>

      <!-- Bottom sheet for exercise picker (rendered outside day cards for proper stacking) -->
      <div class="build-sheet-backdrop" id="build-sheet-backdrop" onclick="buildCloseSheet()"></div>
      <div class="build-sheet" id="build-sheet">
        <div class="build-sheet-handle"></div>
        <div class="build-sheet-header">
          <span class="build-sheet-title">Add Exercises</span>
          <button class="build-sheet-close" onclick="buildCloseSheet()">✕</button>
        </div>
        <div class="build-sheet-tabs">
          <button class="build-sheet-tab ${_pickerTab === 'library' ? 'active' : ''}" onclick="buildPickerTab('library')">Library</button>
          <button class="build-sheet-tab ${_pickerTab === 'darebee' ? 'active' : ''}" onclick="buildPickerTab('darebee')">Darebee</button>
        </div>
        <div class="build-sheet-search">
          <input type="text" placeholder="Search exercises…" value="${_pickerSearch}"
            oninput="buildPickerSearch(this.value)">
        </div>
        <div class="build-sheet-body" id="build-sheet-body">
          ${renderPickerBody()}
        </div>
        <div class="build-sheet-footer">
          <button class="btn btn-accent" style="width:100%" onclick="buildAddSelected('${programId}')">
            Add Selected${_pickerSelected.size > 0 ? ` (${_pickerSelected.size})` : ''}
          </button>
        </div>
      </div>
    </div>
  `;
}
```

- [ ] **Step 2: Add builder global handlers**

```javascript
// ── Builder globals ───────────────────────────────────────────────────────────
window.buildGoHome = function() {
  _editingProgramId = null;
  _expandedDays = new Set();
  rerender();
};

window.buildToggleDay = function(dow) {
  if (_expandedDays.has(dow)) _expandedDays.delete(dow);
  else _expandedDays.add(dow);
  rerender();
};

window.buildToggleRest = function(programId, dow, isRest) {
  const prog = getProgram(programId);
  if (isRest) {
    prog.days = prog.days.filter(d => d.dayOfWeek !== dow);
  } else {
    if (!prog.days.find(d => d.dayOfWeek === dow)) {
      prog.days.push(makeWorkoutTemplate({ name: DAY_NAMES[dow] + ' Workout', dayOfWeek: dow }));
    }
  }
  saveProgram(prog);
  syncFirestore(prog);
  rerender();
};

window.buildUpdateProgName = function(programId, name) {
  const prog = getProgram(programId);
  prog.name = name;
  saveProgram(prog);
};

window.buildUpdateProgWeeks = function(programId, weeks) {
  const prog = getProgram(programId);
  prog.totalWeeks = weeks;
  saveProgram(prog);
};

window.buildUpdateTemplateName = function(programId, templateId, name) {
  const prog = getProgram(programId);
  const t = prog.days.find(d => d.id === templateId);
  if (t) { t.name = name; saveProgram(prog); }
};

window.buildMoveSlot = function(programId, templateId, slotId, dir) {
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

window.buildDeleteSlot = function(programId, templateId, slotId) {
  const prog = getProgram(programId);
  const t = prog.days.find(d => d.id === templateId);
  if (t) { t.slots = t.slots.filter(s => s.id !== slotId); saveProgram(prog); rerender(); }
};

window.buildSetActive = function(programId) {
  updateProfile({ activeProgramId: programId });
  rerender();
};

window.buildDeleteProgram = function(programId) {
  if (!confirm('Delete this program?')) return;
  delete state.programs[programId];
  saveState();
  if (state.profile.activeProgramId === programId) updateProfile({ activeProgramId: null });
  _editingProgramId = null;
  rerender();
};
```

- [ ] **Step 3: Verify the builder renders**

Open Build → create a program or open existing → confirm the 7-day accordion appears, days expand/collapse, and the name/weeks inputs work.

- [ ] **Step 4: Commit**

```bash
git add js/render/build.js
git commit -m "feat: single-page builder with 7-day accordion, slot management, rest toggle"
```

---

## Task 5: Slot Editor (Inline)

**Files:**
- Modify: `js/render/build.js` (append)

- [ ] **Step 1: Add renderSlotEditor() and toggle global**

```javascript
// ── Slot editor ───────────────────────────────────────────────────────────────
function renderSlotEditor(programId, templateId, slot) {
  return `
    <div class="build-slot-editor">
      <div class="build-slot-editor-grid">
        <div>
          <label>Sets</label>
          <input type="number" min="1" max="10" value="${slot.targetSets}"
            onchange="buildUpdateSlot('${programId}','${templateId}','${slot.id}','targetSets',+this.value)">
        </div>
        <div>
          <label>Reps min</label>
          <input type="number" min="1" value="${slot.targetRepsMin}"
            onchange="buildUpdateSlot('${programId}','${templateId}','${slot.id}','targetRepsMin',+this.value)">
        </div>
        <div>
          <label>Reps max</label>
          <input type="number" min="1" value="${slot.targetRepsMax}"
            onchange="buildUpdateSlot('${programId}','${templateId}','${slot.id}','targetRepsMax',+this.value)">
        </div>
        <div>
          <label>Load (kg)</label>
          <input type="number" step="0.5" min="0" value="${slot.targetLoadKg ?? ''}"
            onchange="buildUpdateSlot('${programId}','${templateId}','${slot.id}','targetLoadKg',this.value?+this.value:null)">
        </div>
        <div>
          <label>Step (kg)</label>
          <input type="number" step="0.5" min="0" value="${slot.progressionStepKg}"
            onchange="buildUpdateSlot('${programId}','${templateId}','${slot.id}','progressionStepKg',+this.value)">
        </div>
        <div>
          <label>Progression</label>
          <select onchange="buildUpdateSlot('${programId}','${templateId}','${slot.id}','progressionRule',this.value)">
            ${['none','weight','reps','double','adaptive'].map(r =>
              `<option value="${r}" ${slot.progressionRule===r?'selected':''}>${r}</option>`
            ).join('')}
          </select>
        </div>
      </div>
    </div>
  `;
}

window.buildToggleSlotEditor = function(programId, templateId, slotId) {
  if (_editingSlot?.slotId === slotId) _editingSlot = null;
  else _editingSlot = { programId, templateId, slotId };
  rerender();
};

window.buildUpdateSlot = function(programId, templateId, slotId, field, value) {
  const prog = getProgram(programId);
  const t = prog.days.find(d => d.id === templateId);
  const slot = t?.slots.find(s => s.id === slotId);
  if (!slot) return;
  slot[field] = value;
  saveProgram(prog);
};
```

- [ ] **Step 2: Verify slot editor**

Expand a day with exercises → click "Edit" on a slot → inline editor should appear with sets/reps/load/progression fields. Changes should persist on reload.

- [ ] **Step 3: Commit**

```bash
git add js/render/build.js
git commit -m "feat: inline slot editor for sets/reps/load/progression within day card"
```

---

## Task 6: Exercise Picker Sheet

**Files:**
- Modify: `js/render/build.js` (append)

- [ ] **Step 1: Add renderPickerBody() and sheet globals**

```javascript
// ── Exercise picker sheet ─────────────────────────────────────────────────────
function renderPickerBody() {
  if (_pickerTab === 'darebee') return renderDarebeePickerBody();

  const all = getAllExercises(state.exercises);
  const q = _pickerSearch.toLowerCase();
  const filtered = q
    ? all.filter(ex =>
        ex.name.toLowerCase().includes(q) ||
        ex.muscleGroup.toLowerCase().includes(q) ||
        (ex.equipment || '').toLowerCase().includes(q)
      )
    : all;

  // Group by muscleGroup
  const groups = {};
  filtered.slice(0, 100).forEach(ex => {
    const g = ex.muscleGroup || 'Other';
    if (!groups[g]) groups[g] = [];
    groups[g].push(ex);
  });

  if (Object.keys(groups).length === 0) return `<div style="color:var(--text-muted);font-size:0.85rem;padding:16px 0">No exercises found.</div>`;

  return Object.entries(groups).map(([group, exes]) => `
    <div class="ex-picker-group-label">${group}</div>
    ${exes.map(ex => {
      const sel = _pickerSelected.has(ex.id);
      return `
        <div class="ex-picker-row ${sel ? 'selected' : ''}" onclick="buildPickerToggle('${ex.id}')">
          <div class="ex-picker-check">${sel ? '✓' : ''}</div>
          <div style="flex:1">
            <div class="ex-picker-name">${ex.name}</div>
            <div class="ex-picker-meta">${ex.muscleGroup}${ex.equipment ? ' · ' + ex.equipment : ''}</div>
          </div>
          <span class="ex-picker-source">${ex.source || ''}</span>
        </div>
      `;
    }).join('')}
  `).join('');
}

function renderDarebeePickerBody() {
  const workouts = typeof DAREBEE_WORKOUTS !== 'undefined' ? DAREBEE_WORKOUTS : [];
  const q = _pickerSearch.toLowerCase();
  const filtered = q ? workouts.filter(w => w.name.toLowerCase().includes(q)) : workouts;

  return filtered.slice(0, 80).map((w, i) => `
    <div class="db-card" style="margin-bottom:6px" onclick="buildImportDarebeeWorkout('${_darebeePickerProgId}','${_pickerDayOfWeek}',${workouts.indexOf(w)})">
      <div class="db-card-name">${w.name}</div>
      <div class="db-card-meta">
        <span class="db-stars">${'★'.repeat(w.difficulty||3)}${'☆'.repeat(5-(w.difficulty||3))}</span>
        <span class="db-type-tag">${w.type}</span>
      </div>
    </div>
  `).join('');
}

window.buildOpenPicker = function(programId, dow) {
  _pickerDayOfWeek = dow;
  _pickerTab = 'library';
  _pickerSearch = '';
  _pickerSelected = new Set();
  _darebeePickerProgId = programId;
  // Open sheet via DOM (picker is already rendered in the page)
  document.getElementById('build-sheet')?.classList.add('open');
  document.getElementById('build-sheet-backdrop')?.classList.add('open');
  document.body.style.overflow = 'hidden';
};

window.buildCloseSheet = function() {
  document.getElementById('build-sheet')?.classList.remove('open');
  document.getElementById('build-sheet-backdrop')?.classList.remove('open');
  document.body.style.overflow = '';
  _pickerSelected = new Set();
  _pickerDayOfWeek = null;
};

window.buildPickerTab = function(tab) {
  _pickerTab = tab;
  _pickerSearch = '';
  const body = document.getElementById('build-sheet-body');
  if (body) body.innerHTML = renderPickerBody();
  // Update tab active states
  document.querySelectorAll('.build-sheet-tab').forEach(t => {
    t.classList.toggle('active', t.textContent.toLowerCase().trim() === tab);
  });
};

window.buildPickerSearch = function(q) {
  _pickerSearch = q;
  const body = document.getElementById('build-sheet-body');
  if (body) body.innerHTML = renderPickerBody();
};

window.buildPickerToggle = function(exerciseId) {
  if (_pickerSelected.has(exerciseId)) _pickerSelected.delete(exerciseId);
  else _pickerSelected.add(exerciseId);
  // Update just the row and button count without full rerender
  const rows = document.querySelectorAll('.ex-picker-row');
  rows.forEach(row => {
    const id = row.getAttribute('onclick')?.match(/'([^']+)'/)?.[1];
    if (id === exerciseId) {
      row.classList.toggle('selected', _pickerSelected.has(exerciseId));
      const check = row.querySelector('.ex-picker-check');
      if (check) check.textContent = _pickerSelected.has(exerciseId) ? '✓' : '';
    }
  });
  const btn = document.querySelector('.build-sheet-footer .btn');
  if (btn) btn.textContent = `Add Selected${_pickerSelected.size > 0 ? ` (${_pickerSelected.size})` : ''}`;
};

window.buildAddSelected = function(programId) {
  if (_pickerDayOfWeek === null || _pickerSelected.size === 0) { buildCloseSheet(); return; }
  const prog = getProgram(programId);
  let template = prog.days.find(d => d.dayOfWeek === _pickerDayOfWeek);
  if (!template) {
    template = makeWorkoutTemplate({ name: DAY_NAMES[_pickerDayOfWeek] + ' Workout', dayOfWeek: _pickerDayOfWeek });
    prog.days.push(template);
  }
  _pickerSelected.forEach(exId => {
    template.slots.push(makeExerciseSlot({ exerciseId: exId }));
  });
  saveProgram(prog);
  syncFirestore(prog);
  buildCloseSheet();
  rerender();
};
```

- [ ] **Step 2: Verify exercise picker**

Expand a day → click "+ Add Exercises" → bottom sheet should slide up with exercise list, search, tabs. Select a few exercises, tap "Add Selected (N)" → exercises appear in the day card.

- [ ] **Step 3: Commit**

```bash
git add js/render/build.js
git commit -m "feat: exercise picker bottom sheet with multi-select, search, library/darebee tabs"
```

---

## Task 7: Darebee Import (Whole Workout)

**Files:**
- Modify: `js/render/build.js` (append)

- [ ] **Step 1: Add import dropdown globals and Darebee import**

```javascript
// ── Import dropdown ───────────────────────────────────────────────────────────
window.buildToggleImportMenu = function(dow) {
  const menu = document.getElementById(`import-menu-${dow}`);
  if (!menu) return;
  const isOpen = menu.classList.contains('open');
  // Close all menus first
  document.querySelectorAll('.build-import-menu').forEach(m => m.classList.remove('open'));
  if (!isOpen) menu.classList.add('open');
};

// Close import menus when clicking outside
document.addEventListener('click', function(e) {
  if (!e.target.closest('.build-import-dropdown')) {
    document.querySelectorAll('.build-import-menu').forEach(m => m.classList.remove('open'));
  }
}, true);

window.buildStartDarebeeImport = function(programId, dow) {
  document.querySelectorAll('.build-import-menu').forEach(m => m.classList.remove('open'));
  _darebeePickerProgId = programId;
  _pickerDayOfWeek = dow;
  _pickerTab = 'darebee';
  _pickerSearch = '';
  _pickerSelected = new Set();
  document.getElementById('build-sheet')?.classList.add('open');
  document.getElementById('build-sheet-backdrop')?.classList.add('open');
  document.body.style.overflow = 'hidden';
  // Update tab UI
  document.querySelectorAll('.build-sheet-tab').forEach(t => {
    t.classList.toggle('active', t.textContent.toLowerCase().trim() === 'darebee');
  });
  const body = document.getElementById('build-sheet-body');
  if (body) body.innerHTML = renderPickerBody();
  const header = document.querySelector('.build-sheet-title');
  if (header) header.textContent = 'Add Darebee Workout';
};

window.buildImportDarebeeWorkout = function(programId, dow, idx) {
  const workouts = typeof DAREBEE_WORKOUTS !== 'undefined' ? DAREBEE_WORKOUTS : [];
  const w = workouts[idx];
  if (!w) return;
  const prog = getProgram(programId);
  let template = prog.days.find(d => d.dayOfWeek === (dow === null ? 0 : +dow));
  if (!template) {
    template = makeWorkoutTemplate({ name: w.name, dayOfWeek: +dow });
    prog.days.push(template);
  }
  // Append (don't replace) exercises
  const parsed = (w.exercises || []).map(ex => parseDarebeeExercise(ex));
  parsed.forEach(p => {
    saveExercise(p.exercise);
    template.slots.push(p.slot);
  });
  saveProgram(prog);
  syncFirestore(prog);
  buildCloseSheet();
  rerender();
};
```

- [ ] **Step 2: Verify Darebee import**

Expand a day → Import ▾ → Browse Darebee → sheet opens on Darebee tab showing workout cards. Click a workout → its exercises append to the day. The day shows increased exercise count.

- [ ] **Step 3: Commit**

```bash
git add js/render/build.js
git commit -m "feat: darebee import — browse in picker sheet, append whole workout to day"
```

---

## Task 8: Text Import (Paste + File)

**Files:**
- Modify: `js/render/build.js` (append)

- [ ] **Step 1: Add text parser and preview functions**

```javascript
// ── Text parser ───────────────────────────────────────────────────────────────
function parseWorkoutText(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const sections = []; // [{ name, exercises: [{ raw, sets, reps, loadKg }] }]
  let current = null;

  for (const line of lines) {
    if (line.startsWith('#')) {
      current = { name: line.replace(/^#+\s*/, ''), exercises: [] };
      sections.push(current);
    } else {
      // Match: ExerciseName 3x10 or 3 x 10 with optional @135lb or @60kg
      const m = line.match(/^(.+?)\s+(\d+)\s*[xX×]\s*(\d+)(?:\s*@([\d.]+)\s*(lb|kg)?)?/);
      if (m) {
        if (!current) { current = { name: 'Workout', exercises: [] }; sections.push(current); }
        let loadKg = null;
        if (m[4]) {
          loadKg = m[5] === 'lb' ? parseFloat(m[4]) / 2.205 : parseFloat(m[4]);
          loadKg = Math.round(loadKg * 10) / 10;
        }
        current.exercises.push({ raw: m[1].trim(), sets: +m[2], reps: +m[3], loadKg });
      }
    }
  }

  return sections;
}

function matchExercises(sections) {
  const all = getAllExercises(state.exercises);
  return sections.map(section => ({
    ...section,
    exercises: section.exercises.map(ex => {
      const exact = all.find(e => e.name.toLowerCase() === ex.raw.toLowerCase());
      if (exact) return { ...ex, match: 'exact', exercise: exact };
      const fuzzy = _fuzzyFindExercise(ex.raw, all);
      if (fuzzy) return { ...ex, match: 'fuzzy', exercise: fuzzy };
      // Create a custom exercise placeholder
      const custom = makeExercise({ name: ex.raw, source: 'custom' });
      return { ...ex, match: 'none', exercise: custom };
    }),
  }));
}

function renderImportPreview(matched) {
  return matched.map(section => `
    <div style="margin-bottom:12px">
      <div style="font-weight:600;font-size:0.85rem;margin-bottom:6px">${section.name}</div>
      ${section.exercises.map(ex => `
        <div class="build-import-preview-row">
          <div class="build-import-preview-dot match-${ex.match}"></div>
          <div style="flex:1">
            <span style="font-weight:500">${ex.raw}</span>
            ${ex.match === 'fuzzy' ? `<span style="color:var(--text-muted);font-size:0.75rem"> → ${ex.exercise.name}</span>` : ''}
            ${ex.match === 'none' ? `<span style="color:var(--text-muted);font-size:0.75rem"> (custom)</span>` : ''}
          </div>
          <span style="font-size:0.72rem;color:var(--text-muted)">${ex.sets}×${ex.reps}${ex.loadKg ? ` @${ex.loadKg}kg` : ''}</span>
        </div>
      `).join('')}
    </div>
  `).join('');
}
```

- [ ] **Step 2: Add renderImportArea() and import globals**

```javascript
// ── Import area (inline within day card) ──────────────────────────────────────
function renderImportArea(programId, dow, template) {
  if (_importMode === 'paste') {
    return `
      <div class="build-import-area open" id="import-area-${dow}">
        <div style="font-size:0.78rem;color:var(--text-muted);margin-bottom:6px">
          Format: <code style="font-size:0.72rem">Exercise Name 3x10</code> or <code style="font-size:0.72rem"># Section Name</code>
        </div>
        <textarea class="build-import-textarea" id="import-text-${dow}"
          placeholder="# Push Day&#10;Bench Press 4x8&#10;Overhead Press 3x10&#10;Tricep Pushdown 3x12"
          oninput="buildPreviewImport('${programId}',${dow})"></textarea>
        <div id="import-preview-${dow}" class="build-import-preview"></div>
        <div style="display:flex;gap:8px;margin-top:8px">
          <button class="btn btn-accent btn-sm" onclick="buildConfirmTextImport('${programId}',${dow})">Confirm Import</button>
          <button class="btn btn-ghost btn-sm" onclick="buildCancelImport()">Cancel</button>
        </div>
      </div>
    `;
  }
  return '';
}

window.buildStartPasteImport = function(programId, dow) {
  document.querySelectorAll('.build-import-menu').forEach(m => m.classList.remove('open'));
  _importOpenDay = dow;
  _importMode = 'paste';
  rerender();
  setTimeout(() => document.getElementById(`import-text-${dow}`)?.focus(), 50);
};

window.buildStartFileImport = function(programId, dow) {
  document.querySelectorAll('.build-import-menu').forEach(m => m.classList.remove('open'));
  // Create hidden file input and trigger it
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.txt,text/plain';
  input.onchange = async function() {
    const file = input.files[0];
    if (!file) return;
    if (file.size > 50 * 1024) { alert('File too large. Max 50KB.'); return; }
    const text = await file.text();
    _importOpenDay = dow;
    _importMode = 'paste';
    rerender();
    setTimeout(() => {
      const ta = document.getElementById(`import-text-${dow}`);
      if (ta) { ta.value = text; buildPreviewImport(programId, dow); }
    }, 50);
  };
  input.click();
};

window.buildPreviewImport = function(programId, dow) {
  const ta = document.getElementById(`import-text-${dow}`);
  const preview = document.getElementById(`import-preview-${dow}`);
  if (!ta || !preview) return;
  const text = ta.value.trim();
  if (!text) { preview.innerHTML = ''; return; }
  const sections = parseWorkoutText(text);
  if (sections.length === 0 || sections.every(s => s.exercises.length === 0)) {
    preview.innerHTML = `<div style="color:var(--text-muted);font-size:0.82rem">No exercises found. Check the format and try again.</div>`;
    return;
  }
  const matched = matchExercises(sections);
  preview.innerHTML = renderImportPreview(matched);
};

window.buildConfirmTextImport = function(programId, dow) {
  const ta = document.getElementById(`import-text-${dow}`);
  if (!ta?.value.trim()) return;
  const sections = parseWorkoutText(ta.value);
  if (sections.length === 0) return;
  const matched = matchExercises(sections);
  const prog = getProgram(programId);

  if (matched.length === 1) {
    // Single section → add to current day
    let template = prog.days.find(d => d.dayOfWeek === dow);
    if (!template) {
      template = makeWorkoutTemplate({ name: matched[0].name, dayOfWeek: dow });
      prog.days.push(template);
    }
    matched[0].exercises.forEach(ex => {
      if (ex.match === 'none') saveExercise(ex.exercise);
      template.slots.push(makeExerciseSlot({
        exerciseId: ex.exercise.id,
        targetSets: ex.sets,
        targetRepsMin: ex.reps,
        targetRepsMax: ex.reps,
        targetLoadKg: ex.loadKg,
      }));
    });
  } else {
    // Multiple sections → map each to next available day
    matched.forEach((section, i) => {
      const targetDow = (dow + i) % 7;
      let template = prog.days.find(d => d.dayOfWeek === targetDow);
      if (!template) {
        template = makeWorkoutTemplate({ name: section.name, dayOfWeek: targetDow });
        prog.days.push(template);
      } else {
        template.name = section.name;
      }
      section.exercises.forEach(ex => {
        if (ex.match === 'none') saveExercise(ex.exercise);
        template.slots.push(makeExerciseSlot({
          exerciseId: ex.exercise.id,
          targetSets: ex.sets,
          targetRepsMin: ex.reps,
          targetRepsMax: ex.reps,
          targetLoadKg: ex.loadKg,
        }));
      });
    });
  }

  saveProgram(prog);
  syncFirestore(prog);
  buildCancelImport();
  rerender();
};

window.buildCancelImport = function() {
  _importOpenDay = null;
  _importMode = null;
  rerender();
};

window.buildDownloadTemplate = function() {
  document.querySelectorAll('.build-import-menu').forEach(m => m.classList.remove('open'));
  const content = `# Push Day
Bench Press 4x8 @60kg
Overhead Press 3x10
Tricep Pushdown 3x12

# Pull Day
Deadlift 3x5 @100kg
Barbell Row 4x8
Lat Pulldown 3x12
Bicep Curl 3x12

# Legs Day
Squat 4x8 @80kg
Romanian Deadlift 3x10
Leg Press 3x12
`;
  const blob = new Blob([content], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'workout-template.txt';
  a.click();
  URL.revokeObjectURL(a.href);
};
```

- [ ] **Step 3: Verify text import**

Expand a day → Import ▾ → Paste Text → textarea appears. Type/paste exercises → preview shows color-coded match dots. Click "Confirm Import" → exercises added to day. Test with multiple `# sections` too.

Upload File: Import ▾ → Upload File → file picker opens → select a `.txt` file → content populates the textarea → preview shown.

- [ ] **Step 4: Commit**

```bash
git add js/render/build.js
git commit -m "feat: text/file import with paste, file upload, fuzzy match preview, multi-section support"
```

---

## Task 9: Final Wiring + Cleanup

**Files:**
- Modify: `js/render/build.js` (ensure `rerender` and `pushSubPage` globals are set at bottom)

- [ ] **Step 1: Ensure bottom globals are present**

The old `build.js` set `window.rerender` and `window.pushSubPage`. The new version imports them directly. Make sure these global re-exports are removed (they'll conflict). Check the bottom of `build.js` for any leftover lines like:

```javascript
window.rerender = function() { import('../router.js').then(r => r.rerender()); };
window.pushSubPage = function(sub) { import('../router.js').then(r => r.pushSubPage(sub)); };
window.popSubPage = function() { import('../router.js').then(r => r.popSubPage()); };
```

If these exist, remove them — the new code imports `rerender` and `pushSubPage` directly at the top.

Also check that the old functions (`newProgram`, `editProgram`, `useProgram`, `importDarebeeWorkout`, etc.) are **not** present in the new file — they're replaced by the new `build*` prefixed functions.

- [ ] **Step 2: Test the full Build tab flow end-to-end**

Walk through these scenarios:
1. Open Build → see program list
2. New Program → type name → click template chip → builder opens with pre-filled days
3. Expand a day → add exercises via picker → verify they appear
4. Edit a slot → change sets/reps → navigate away → come back → values persisted
5. Import ▾ → Browse Darebee → pick a workout → exercises appended
6. Import ▾ → Paste Text → paste multi-section text → preview → confirm → multiple days updated
7. Set as Active → Today tab shows new program
8. Delete program → confirm → returns to list

- [ ] **Step 3: Final commit**

```bash
git add js/render/build.js css/main.css
git commit -m "feat: complete build tab redesign — single-page builder, exercise picker, text import, darebee integration"
```

---

## Task 10: Push to GitHub

- [ ] **Step 1: Push**

```bash
git push origin master
```

- [ ] **Step 2: Verify on GitHub Pages**

Open the deployed app and do a final smoke test of the Build tab.

---

## Implementation Notes

- **Exercise picker DOM updates:** `buildPickerToggle` updates the DOM directly (without rerender) for performance — toggling a checkbox in a long list should feel instant
- **Import dropdown closing:** The `document.addEventListener('click')` listener in Task 7 Step 1 must not be placed inside `renderBuild`, `renderBuilder`, or any function that is called on re-render. It is written at module scope in the plan, which is correct — ES modules are evaluated once (singletons), so the listener registers exactly once. Do not move it inside a function.
- **`_editingProgramId` across tab switches:** The module-level state is preserved when the user navigates away from Build and returns. This means the user lands back in the builder where they left off, which is intentional. If you want to reset to the list view on tab switch, clear `_editingProgramId = null` in `renderBuild()` before the conditional.
- **Multi-section text import wrap-around:** When pasting a text file with multiple `# sections` while editing a specific day (e.g. Wednesday = dow 3), sections are assigned to consecutive days starting from that dow, wrapping at 7. Section 1 → Wed, Section 2 → Thu, etc. This can overwrite existing days without warning — by design for v1.
- **"Tap to change fuzzy match" not implemented:** The spec mentions users can correct individual fuzzy matches in the import preview. This is not implemented in v1 — the preview is read-only. Matched names are shown but not editable. This is an acceptable scope cut for v1.
- **Bottom sheet in template strings:** The sheet HTML is rendered once at the end of `renderBuilder()`. When the picker opens, we toggle CSS classes on the existing DOM elements rather than re-rendering — this is important for smooth animation.
