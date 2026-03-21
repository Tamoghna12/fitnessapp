import { state, saveProgram, saveExercise, updateProfile, saveState } from '../state.js';
import { BUILTIN_PROGRAMS, BUILTIN_EXERCISES, getAllExercises, parseDarebeeExercise, parseAnabolicAliensExercise } from '../data.js';
import { makeProgram, makeWorkoutTemplate, makeExerciseSlot, makeExercise } from '../schema.js';
import { pushSubPage, rerender } from '../router.js';
import { currentUser, db } from '../auth.js';
import { pushDoc } from '../firestore.js';
import { renderGenerator } from './generator.js';

// ── Module-level UI state ─────────────────────────────────────────────────────
let _editingProgramId = null;
let _expandedDays     = new Set();
let _pickerDayOfWeek  = null;
let _pickerTab        = 'library';
let _pickerSearch     = '';
let _pickerSelected   = new Set();
let _editingSlot      = null;
let _importOpenDay    = null;
let _importMode       = null;
let _darebeePickerProgId = null;

// ── Entry point ───────────────────────────────────────────────────────────────
export function renderBuild(subPage) {
  if (subPage?.type === 'generator') return renderGenerator();
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
    ?? getAllExercises(state.exercises).find(e => e.id === exerciseId)?.name
    ?? exerciseId;
}

function syncFirestore(prog) {
  if (currentUser && db) pushDoc(db, currentUser.uid, 'programs', prog);
}

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// ── Build Home ────────────────────────────────────────────────────────────────
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

      ${renderCommunitySection()}
    </div>
  `;
}

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
  _editingSlot = null;
  _importOpenDay = null;
  _importMode = null;
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
  _editingSlot = null;
  rerender();
};

// ── Community workouts section on Build home ─────────────────────────────────
let _communityFilter = 'all';

function renderCommunitySection() {
  const workouts = typeof COMMUNITY_WORKOUTS !== 'undefined' ? COMMUNITY_WORKOUTS : [];
  if (workouts.length === 0) return '';

  const equipTypes = [...new Set(workouts.map(w => w.equipment))];
  const filtered = _communityFilter === 'all'
    ? workouts
    : workouts.filter(w => w.equipment === _communityFilter);

  return `
    <div class="section-label" style="margin:1.25rem 0 8px">Community Workouts</div>
    <div style="font-size:0.78rem;color:var(--text-muted);margin-bottom:10px">50 quick workouts — tap to add as a program</div>
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px">
      <button class="me-chip ${_communityFilter === 'all' ? 'active' : ''}" onclick="buildCommunityFilter('all')">All</button>
      ${equipTypes.map(e => `
        <button class="me-chip ${_communityFilter === e ? 'active' : ''}" onclick="buildCommunityFilter('${e}')">
          ${e.charAt(0).toUpperCase() + e.slice(1)}
        </button>
      `).join('')}
    </div>
    ${filtered.map(w => {
      const formatTag = w.format === 'tabata' ? 'TABATA' : w.duration + 'min';
      return `
        <div class="build-prog-card" onclick="buildImportCommunityAsProgram('${w.id}')">
          <div>
            <div class="build-prog-name">${w.name}</div>
            <div class="build-prog-meta">${w.exercises.length} exercises · ${formatTag} · ${w.muscles}</div>
          </div>
          <span style="color:var(--text-muted);font-size:0.85rem">+ Add</span>
        </div>
      `;
    }).join('')}
  `;
}

window.buildCommunityFilter = function(filter) {
  _communityFilter = filter;
  rerender();
};

window.buildImportCommunityAsProgram = function(workoutId) {
  const workouts = typeof COMMUNITY_WORKOUTS !== 'undefined' ? COMMUNITY_WORKOUTS : [];
  const w = workouts.find(x => x.id === workoutId);
  if (!w) return;

  const parsed = (w.exercises || []).map(ex => parseAnabolicAliensExercise(ex, w.equipment));
  parsed.forEach(p => saveExercise(p.exercise));

  const prog = makeProgram({
    id: `${w.id}-${Date.now()}`,
    name: w.name,
    totalWeeks: 8,
    isTemplate: false,
    days: [
      makeWorkoutTemplate({
        name: w.name,
        dayOfWeek: 0,
        slots: parsed.map(p => p.slot),
      }),
    ],
  });

  saveProgram(prog);
  syncFirestore(prog);
  _editingProgramId = prog.id;
  _expandedDays = new Set();
  _editingSlot = null;
  rerender();
};

window.buildCreateFromTemplate = function(tplKey) {
  const nameInput = document.getElementById('build-new-prog-name');
  const name = nameInput?.value.trim() || _TEMPLATES[tplKey]?.name || 'My Program';
  const tpl = _TEMPLATES[tplKey];
  const prog = makeProgram({ name });
  if (tpl && tpl.days.length > 0) {
    prog.days = tpl.days.map(d => makeWorkoutTemplate({
      name: d.name,
      dayOfWeek: d.dow,
      slots: (d.exercises || []).map(exName => {
        const ex = _findExercise(exName);
        if (!ex) return null;
        return makeExerciseSlot({
          exerciseId: ex.id,
          targetSets: d.sets || 3,
          targetRepsMin: d.repsMin || 8,
          targetRepsMax: d.repsMax || 12,
        });
      }).filter(Boolean),
    }));
  }
  saveProgram(prog);
  _editingProgramId = prog.id;
  _expandedDays = new Set();
  _editingSlot = null;
  rerender();
};

// ── Template data ─────────────────────────────────────────────────────────────
function _findExercise(name) {
  const all = getAllExercises(state.exercises);
  const exact = all.find(e => e.name.toLowerCase() === name.toLowerCase());
  if (exact) return exact;
  const fuzzy = _fuzzyFindExercise(name, all);
  if (!fuzzy) console.warn('[build] No exercise match for:', name);
  return fuzzy;
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

// ── Builder ───────────────────────────────────────────────────────────────────
function renderBuilder(programId) {
  const prog = getProgram(programId);
  const activeId = state.profile.activeProgramId;
  const isActive = prog.id === activeId;

  const dayCards = DAY_NAMES.map((dayName, dow) => {
    const template = prog.days.find(d => d.dayOfWeek === dow);
    const isExpanded = _expandedDays.has(dow);
    const isRest = !template;

    const slotList = template ? template.slots.map(slot => {
      const isEditingThisSlot = _editingSlot?.slotId === slot.id;
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
              ${isEditingThisSlot ? 'Done' : 'Edit'}
            </button>
            <button class="build-slot-btn danger" onclick="buildDeleteSlot('${programId}','${template.id}','${slot.id}')">✕</button>
          </div>
        </div>
        ${isEditingThisSlot ? renderSlotEditor(programId, template.id, slot) : ''}
      `;
    }).join('') : '';

    const importAreaHtml = (_importOpenDay === dow && _importMode === 'paste')
      ? renderImportArea(programId, dow) : '';

    return `
      <div class="build-day-card ${isExpanded ? 'expanded' : ''} ${isRest ? 'rest' : ''}" id="build-day-${dow}">
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
                    <button onclick="buildStartAAImport('${programId}',${dow})">Browse Community Workouts</button>
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

      <div style="display:flex;align-items:center;gap:12px;margin-bottom:1rem;flex-wrap:wrap">
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
        ${!isActive
          ? `<button class="btn btn-accent" onclick="buildSetActive('${programId}')">Set as Active</button>`
          : `<span style="font-size:0.82rem;color:#059669;font-weight:600;padding:8px 0">✓ Active Program</span>`}
        <button class="btn btn-ghost" style="color:var(--accent)" onclick="buildDeleteProgram('${programId}')">Delete Program</button>
      </div>

      <!-- Bottom sheet for exercise picker -->
      <div class="build-sheet-backdrop" id="build-sheet-backdrop" onclick="buildCloseSheet()"></div>
      <div class="build-sheet" id="build-sheet">
        <div class="build-sheet-handle"></div>
        <div class="build-sheet-header">
          <span class="build-sheet-title" id="build-sheet-title">Add Exercises</span>
          <button class="build-sheet-close" onclick="buildCloseSheet()">✕</button>
        </div>
        <div class="build-sheet-tabs">
          <button class="build-sheet-tab ${_pickerTab === 'library' ? 'active' : ''}" data-tab="library" onclick="buildPickerTab('library')">Library</button>
          <button class="build-sheet-tab ${_pickerTab === 'darebee' ? 'active' : ''}" data-tab="darebee" onclick="buildPickerTab('darebee')">Darebee</button>
          <button class="build-sheet-tab ${_pickerTab === 'aa' ? 'active' : ''}" data-tab="aa" onclick="buildPickerTab('aa')">Community</button>
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

// ── Builder globals ───────────────────────────────────────────────────────────
window.buildGoHome = function() {
  _editingProgramId = null;
  _expandedDays = new Set();
  _editingSlot = null;
  _importOpenDay = null;
  _importMode = null;
  rerender();
};

window.buildToggleDay = function(dow) {
  if (_expandedDays.has(dow)) _expandedDays.delete(dow);
  else _expandedDays.add(dow);
  _editingSlot = null;
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
  syncFirestore(prog);
};

window.buildUpdateProgWeeks = function(programId, weeks) {
  const prog = getProgram(programId);
  prog.totalWeeks = weeks;
  saveProgram(prog);
  syncFirestore(prog);
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

// ── Exercise picker sheet ─────────────────────────────────────────────────────
function renderPickerBody() {
  if (_pickerTab === 'darebee') return renderDarebeePickerBody();
  if (_pickerTab === 'aa') return renderAAPickerBody();

  const all = getAllExercises(state.exercises);
  const q = _pickerSearch.toLowerCase();
  const filtered = q
    ? all.filter(ex =>
        ex.name.toLowerCase().includes(q) ||
        ex.muscleGroup.toLowerCase().includes(q) ||
        (ex.equipment || '').toLowerCase().includes(q)
      )
    : all;

  const groups = {};
  filtered.slice(0, 100).forEach(ex => {
    const g = ex.muscleGroup || 'Other';
    if (!groups[g]) groups[g] = [];
    groups[g].push(ex);
  });

  if (Object.keys(groups).length === 0) {
    return `<div style="color:var(--text-muted);font-size:0.85rem;padding:16px 0">No exercises found.</div>`;
  }

  return Object.entries(groups).map(([group, exes]) => `
    <div class="ex-picker-group-label">${group}</div>
    ${exes.map(ex => {
      const sel = _pickerSelected.has(ex.id);
      return `
        <div class="ex-picker-row ${sel ? 'selected' : ''}" data-ex-id="${ex.id}" onclick="buildPickerToggle('${ex.id}')">
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

  if (filtered.length === 0) {
    return `<div style="color:var(--text-muted);font-size:0.85rem;padding:16px 0">No workouts found.</div>`;
  }

  return filtered.slice(0, 80).map(w => {
    const idx = workouts.indexOf(w);
    return `
      <div class="db-card" style="margin-bottom:6px" onclick="buildImportDarebeeWorkout('${_darebeePickerProgId}',${_pickerDayOfWeek},${idx})">
        <div class="db-card-name">${w.name}</div>
        <div class="db-card-meta">
          <span class="db-stars">${'★'.repeat(w.difficulty||3)}${'☆'.repeat(5-(w.difficulty||3))}</span>
          <span class="db-type-tag">${w.type}</span>
        </div>
      </div>
    `;
  }).join('');
}

function renderAAPickerBody() {
  const workouts = typeof COMMUNITY_WORKOUTS !== 'undefined' ? COMMUNITY_WORKOUTS : [];
  const q = _pickerSearch.toLowerCase();
  const filtered = q
    ? workouts.filter(w =>
        w.name.toLowerCase().includes(q) ||
        w.muscles.toLowerCase().includes(q) ||
        w.equipment.toLowerCase().includes(q)
      )
    : workouts;

  if (filtered.length === 0) {
    return `<div style="color:var(--text-muted);font-size:0.85rem;padding:16px 0">No workouts found.</div>`;
  }

  // Group by equipment
  const groups = {};
  filtered.forEach(w => {
    const g = w.equipment.charAt(0).toUpperCase() + w.equipment.slice(1);
    if (!groups[g]) groups[g] = [];
    groups[g].push(w);
  });

  return Object.entries(groups).map(([group, ww]) => `
    <div class="ex-picker-group-label">${group}</div>
    ${ww.map(w => {
      const formatTag = w.format === 'tabata' ? 'TABATA' : `${w.duration}min`;
      return `
        <div class="db-card" style="margin-bottom:6px" onclick="buildImportAAWorkout('${_darebeePickerProgId}',${_pickerDayOfWeek},'${w.id}')">
          <div class="db-card-name">${w.name}</div>
          <div class="db-card-meta">
            <span class="db-type-tag">${formatTag}</span>
            <span style="color:var(--text-secondary);font-size:0.75rem">${w.muscles}</span>
            <span style="color:var(--text-muted);font-size:0.72rem">${w.exercises.length} exercises</span>
          </div>
        </div>
      `;
    }).join('')}
  `).join('');
}

window.buildOpenPicker = function(programId, dow) {
  _pickerDayOfWeek = dow;
  _pickerTab = 'library';
  _pickerSearch = '';
  _pickerSelected = new Set();
  _darebeePickerProgId = programId;
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
  document.querySelectorAll('.build-sheet-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.tab === tab);
  });
  const searchInput = document.querySelector('.build-sheet-search input');
  if (searchInput) searchInput.value = '';
};

window.buildPickerSearch = function(q) {
  _pickerSearch = q;
  const body = document.getElementById('build-sheet-body');
  if (body) body.innerHTML = renderPickerBody();
};

window.buildPickerToggle = function(exerciseId) {
  if (_pickerSelected.has(exerciseId)) _pickerSelected.delete(exerciseId);
  else _pickerSelected.add(exerciseId);
  // Update the row DOM directly for performance
  const row = document.querySelector(`.ex-picker-row[data-ex-id="${exerciseId}"]`);
  if (row) {
    const sel = _pickerSelected.has(exerciseId);
    row.classList.toggle('selected', sel);
    const check = row.querySelector('.ex-picker-check');
    if (check) check.textContent = sel ? '✓' : '';
  }
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

// ── Import dropdown ───────────────────────────────────────────────────────────
window.buildToggleImportMenu = function(dow) {
  const menu = document.getElementById(`import-menu-${dow}`);
  if (!menu) return;
  const isOpen = menu.classList.contains('open');
  document.querySelectorAll('.build-import-menu').forEach(m => m.classList.remove('open'));
  if (!isOpen) menu.classList.add('open');
};

// Close import menus when clicking outside — registered once at module scope
document.addEventListener('click', function(e) {
  if (!e.target.closest('.build-import-dropdown')) {
    document.querySelectorAll('.build-import-menu').forEach(m => m.classList.remove('open'));
  }
}, true);

window.buildStartDarebeeImport = function(programId, dow) {
  document.querySelectorAll('.build-import-menu').forEach(m => m.classList.remove('open'));
  _darebeePickerProgId = programId;
  _pickerDayOfWeek = +dow;
  _pickerTab = 'darebee';
  _pickerSearch = '';
  _pickerSelected = new Set();
  document.getElementById('build-sheet')?.classList.add('open');
  document.getElementById('build-sheet-backdrop')?.classList.add('open');
  document.body.style.overflow = 'hidden';
  document.querySelectorAll('.build-sheet-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.tab === 'darebee');
  });
  const body = document.getElementById('build-sheet-body');
  if (body) body.innerHTML = renderDarebeePickerBody();
  const title = document.getElementById('build-sheet-title');
  if (title) title.textContent = 'Browse Darebee';
};

window.buildImportDarebeeWorkout = function(programId, dow, idx) {
  const workouts = typeof DAREBEE_WORKOUTS !== 'undefined' ? DAREBEE_WORKOUTS : [];
  const w = workouts[idx];
  if (!w) return;
  const prog = getProgram(programId);
  const targetDow = dow !== null ? +dow : 0;
  let template = prog.days.find(d => d.dayOfWeek === targetDow);
  if (!template) {
    template = makeWorkoutTemplate({ name: w.name, dayOfWeek: targetDow });
    prog.days.push(template);
  }
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

// ── Community workouts import ─────────────────────────────────────────────────
window.buildStartAAImport = function(programId, dow) {
  document.querySelectorAll('.build-import-menu').forEach(m => m.classList.remove('open'));
  _darebeePickerProgId = programId;
  _pickerDayOfWeek = +dow;
  _pickerTab = 'aa';
  _pickerSearch = '';
  _pickerSelected = new Set();
  document.getElementById('build-sheet')?.classList.add('open');
  document.getElementById('build-sheet-backdrop')?.classList.add('open');
  document.body.style.overflow = 'hidden';
  document.querySelectorAll('.build-sheet-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.tab === 'aa');
  });
  const body = document.getElementById('build-sheet-body');
  if (body) body.innerHTML = renderAAPickerBody();
  const title = document.getElementById('build-sheet-title');
  if (title) title.textContent = 'Browse Community Workouts';
};

window.buildImportAAWorkout = function(programId, dow, workoutId) {
  const workouts = typeof COMMUNITY_WORKOUTS !== 'undefined' ? COMMUNITY_WORKOUTS : [];
  const w = workouts.find(x => x.id === workoutId);
  if (!w) return;
  const prog = getProgram(programId);
  const targetDow = dow !== null ? +dow : 0;
  let template = prog.days.find(d => d.dayOfWeek === targetDow);
  if (!template) {
    template = makeWorkoutTemplate({ name: w.name, dayOfWeek: targetDow });
    prog.days.push(template);
  }
  const parsed = (w.exercises || []).map(ex => parseAnabolicAliensExercise(ex, w.equipment));
  parsed.forEach(p => {
    saveExercise(p.exercise);
    template.slots.push(p.slot);
  });
  saveProgram(prog);
  syncFirestore(prog);
  buildCloseSheet();
  rerender();
};

// ── Text parser ───────────────────────────────────────────────────────────────
function parseWorkoutText(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const sections = [];
  let current = null;

  for (const line of lines) {
    if (line.startsWith('#')) {
      current = { name: line.replace(/^#+\s*/, ''), exercises: [] };
      sections.push(current);
    } else {
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

function renderImportArea(programId, dow) {
  return `
    <div class="build-import-area open">
      <div style="font-size:0.78rem;color:var(--text-muted);margin-bottom:6px">
        Format: <code style="font-size:0.72rem">Exercise Name 3x10</code> or use <code style="font-size:0.72rem"># Section Name</code> headers
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

window.buildStartPasteImport = function(programId, dow) {
  document.querySelectorAll('.build-import-menu').forEach(m => m.classList.remove('open'));
  _importOpenDay = dow;
  _importMode = 'paste';
  rerender();
  setTimeout(() => document.getElementById(`import-text-${dow}`)?.focus(), 50);
};

window.buildStartFileImport = function(programId, dow) {
  document.querySelectorAll('.build-import-menu').forEach(m => m.classList.remove('open'));
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
    }, 80);
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
    // Multiple sections → assign to consecutive days starting from dow
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
