import { state, getActiveProgram, saveProgram, saveExercise, updateProfile } from '../state.js';
import { BUILTIN_PROGRAMS, BUILTIN_EXERCISES, getAllExercises, parseDarebeeExercise } from '../data.js';
import { makeProgram, makeWorkoutTemplate, makeExerciseSlot, makeExercise } from '../schema.js';
import { pushSubPage, popSubPage, currentSubPage, rerender } from '../router.js';
import { currentUser, db } from '../auth.js';
import { pushDoc } from '../firestore.js';
import { renderGenerator } from './generator.js';

export function renderBuild(subPage) {
  if (subPage?.type === 'program-editor') return renderProgramEditor(subPage.programId);
  if (subPage?.type === 'workout-editor') return renderWorkoutEditor(subPage.programId, subPage.templateId);
  if (subPage?.type === 'darebee-browser') return renderDarebeeBrowser();
  if (subPage?.type === 'generator') return renderGenerator();
  return renderBuildHome();
}

function renderBuildHome() {
  const userPrograms = Object.values(state.programs);
  const allPrograms = [...BUILTIN_PROGRAMS, ...userPrograms.filter(p => !p.isTemplate)];

  return `
    <div class="page active">
      <div class="page-title">Build</div>

      <div style="display:flex;gap:10px;margin-bottom:1.5rem;flex-wrap:wrap">
        <button class="btn btn-accent" onclick="pushSubPage({type:'generator'})">⚡ Generate Workout</button>
        <button class="btn btn-ghost" onclick="newProgram()">+ New Program</button>
        <button class="btn btn-ghost" onclick="pushSubPage({type:'darebee-browser'})">Browse Darebee</button>
      </div>

      <div class="card">
        <div class="section-label" style="margin-bottom:1rem">Programs</div>
        ${allPrograms.map(p => {
          const isActive = p.id === state.profile.activeProgramId;
          return `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid var(--border-subtle)">
              <div>
                <div style="display:flex;align-items:center;gap:8px;font-weight:500">
                  ${p.name}
                  ${isActive ? `<span style="font-size:0.65rem;background:rgba(0,229,160,.15);color:var(--accent-secondary);padding:2px 7px;border-radius:4px;font-weight:600">ACTIVE</span>` : ''}
                  ${p.isTemplate ? `<span style="font-size:0.65rem;color:var(--text-muted)">(template)</span>` : ''}
                </div>
                <div style="font-size:0.78rem;color:var(--text-muted)">${p.days.length} days · ${p.totalWeeks} weeks</div>
              </div>
              <div style="display:flex;gap:8px;flex-shrink:0">
                ${!isActive ? `<button class="btn btn-accent" style="font-size:0.78rem;padding:4px 12px" onclick="useProgram('${p.id}')">Use</button>` : ''}
                <button class="btn btn-ghost" style="font-size:0.78rem;padding:4px 10px" onclick="editProgram('${p.id}')">Edit</button>
              </div>
            </div>
          `;
        }).join('')}
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

function exPickerRow(ex, programId, templateId) {
  return `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border-subtle);cursor:pointer"
      onclick="addExerciseToSlot('${programId}','${templateId}','${ex.id}')">
      <div>
        <div style="font-weight:500;font-size:0.9rem">${ex.name}</div>
        <div style="font-size:0.75rem;color:var(--text-muted)">${ex.muscleGroup}${ex.equipment ? ' · ' + ex.equipment : ''}</div>
      </div>
      <span style="font-size:0.7rem;color:var(--text-muted);white-space:nowrap;margin-left:8px">${ex.source}</span>
    </div>
  `;
}

window.filterExPicker = function(query, programId, templateId) {
  const all = getAllExercises(state.exercises);
  const q = query.toLowerCase();
  const filtered = q
    ? all.filter(ex =>
        ex.name.toLowerCase().includes(q) ||
        ex.muscleGroup.toLowerCase().includes(q) ||
        (ex.equipment || '').toLowerCase().includes(q)
      )
    : all.slice(0, 50);
  const list = document.getElementById('ex-picker-list');
  if (!list) return;
  list.innerHTML = filtered.slice(0, 50).map(ex => exPickerRow(ex, programId, templateId)).join('');
};

window.openExercisePicker = function(programId, templateId) {
  const all = getAllExercises(state.exercises);
  const el = document.getElementById('main-content');
  el.innerHTML = `
    <div class="page active">
      <div class="db-detail-back" onclick="rerender()">← Back</div>
      <div class="page-title">Add Exercise</div>
      <input class="db-search" type="text" placeholder="Search by name, muscle, or equipment…"
        oninput="filterExPicker(this.value,'${programId}','${templateId}')"
        style="margin-bottom:0.5rem;width:100%">
      <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:1rem">${all.length.toLocaleString()} exercises available</div>
      <div id="ex-picker-list">
        ${all.slice(0, 50).map(ex => exPickerRow(ex, programId, templateId)).join('')}
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
