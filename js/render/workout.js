import { state, getActiveProgram, saveLog, saveProgram, currentISOWeekNumber } from '../state.js';
import { makeWorkoutLog, makeSetLog } from '../schema.js';
import { popSubPage, rerender } from '../router.js';
import { currentUser, db } from '../auth.js';
import { pushDoc } from '../firestore.js';
import { BUILTIN_EXERCISES, getAllExercises } from '../data.js';

// Active session state (in-memory only, not persisted until finish)
let session = null;

export function startSession(templateId) {
  let program = getActiveProgram();
  let template = program?.days.find(d => d.id === templateId);

  // Fall back to searching all saved programs (e.g. generated one-off workouts)
  if (!template) {
    for (const prog of Object.values(state.programs)) {
      template = prog.days.find(d => d.id === templateId);
      if (template) { program = prog; break; }
    }
  }
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

  const exName = getExName(slot.exerciseId, slot.id);
  const loadHint = slot.targetLoadKg ? `Try ${slot.targetLoadKg}kg ↑` : '';

  return `
    <div class="page active">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">
        <div>
          <div style="font-family:'Bebas Neue',sans-serif;font-size:1.4rem;letter-spacing:2px;line-height:1">${template.name}</div>
          <div style="font-family:'JetBrains Mono',monospace;font-size:0.62rem;color:var(--text-muted);letter-spacing:1px">WEEK ${currentISOWeekNumber()}</div>
        </div>
        <button class="btn btn-accent" style="letter-spacing:1px" onclick="finishWorkout()">Finish</button>
      </div>

      <div style="margin-bottom:1.25rem">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
          <span style="font-family:'JetBrains Mono',monospace;font-size:0.65rem;color:var(--text-muted);letter-spacing:1px">${currentSlotIdx + 1} / ${total}</span>
          <span style="font-family:'JetBrains Mono',monospace;font-size:0.65rem;color:var(--text-muted)">${pct}%</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill" style="width:${pct}%"></div>
        </div>
      </div>

      <div class="card card--glow">
        <div class="ex-header">
          <div class="ex-name">${exName}</div>
          <div class="ex-target">${targetSets} × ${slot.targetRepsMin}–${slot.targetRepsMax} reps</div>
          ${loadHint ? `<div class="ex-hint">${loadHint}</div>` : ''}
        </div>

        <div style="display:grid;grid-template-columns:28px 1fr 1fr 1fr 44px;gap:8px;padding:0 12px 6px;font-family:'JetBrains Mono',monospace;font-size:0.6rem;color:var(--text-muted);letter-spacing:1px;text-transform:uppercase">
          <span style="text-align:center">#</span>
          <span style="text-align:center">Last</span>
          <span style="text-align:center">kg</span>
          <span style="text-align:center">reps</span>
          <span style="text-align:center">✓</span>
        </div>

        <div class="set-rows">
          ${Array.from({ length: targetSets }, (_, i) => {
            const existing = currentSets.find(s => s.setNumber === i + 1);
            const lastSet = lastSets[i];
            return `
              <div class="set-row ${existing?.completed ? 'completed' : ''}">
                <span class="set-num">${i + 1}</span>
                <span class="set-prev">${lastSet ? `${lastSet.weight||'—'}×${lastSet.reps||'—'}` : '—'}</span>
                <input class="set-input" type="number" placeholder="kg" step="0.5"
                  value="${existing?.weight || ''}"
                  onchange="logSet('${slot.id}', '${slot.exerciseId}', ${i+1}, 'weight', this.value)">
                <input class="set-input" type="number" placeholder="reps"
                  value="${existing?.reps || ''}"
                  onchange="logSet('${slot.id}', '${slot.exerciseId}', ${i+1}, 'reps', this.value)">
                <input type="checkbox" class="set-check" ${existing?.completed ? 'checked' : ''}
                  onchange="markComplete('${slot.id}', '${slot.exerciseId}', ${i+1}, this.checked)">
              </div>
            `;
          }).join('')}
        </div>

        <button class="btn btn-ghost" style="margin-top:4px;font-size:0.78rem;width:100%"
          onclick="addSet('${slot.id}', '${slot.exerciseId}', ${targetSets + currentSets.filter(s=>s.setNumber > slot.targetSets).length + 1})">
          + add set
        </button>
      </div>

      <div style="display:flex;gap:8px;margin-top:1rem;flex-wrap:wrap">
        <button class="btn btn-ghost" style="font-size:0.78rem" onclick="swapExercise('${slot.id}', '${slot.exerciseId}')">⇄ Swap</button>
        <button class="btn btn-ghost" style="font-size:0.78rem" onclick="skipExercise('${slot.id}', '${slot.exerciseId}', ${targetSets})">↷ Skip</button>
        <div style="flex:1"></div>
        ${currentSlotIdx > 0 ? `<button class="btn btn-ghost" style="font-size:0.78rem" onclick="prevSlot()">← Prev</button>` : ''}
        ${currentSlotIdx < total - 1 ? `<button class="btn btn-accent" style="font-size:0.78rem;letter-spacing:0.5px" onclick="nextSlot()">Next →</button>` : ''}
      </div>

      <div class="card" style="margin-top:1rem">
        <div class="section-label" style="margin-bottom:10px">Session notes</div>
        <textarea class="notes-area" placeholder="How does it feel?"
          onchange="updateNotes(this.value)">${session.log.notes}</textarea>
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

function getExName(exerciseId, slotId) {
  // Check for session-scoped swap override
  if (slotId && session) {
    const swap = [...session.swaps].reverse().find(s => s.slotId === slotId);
    if (swap) return swap.newName;
  }
  if (state.exercises[exerciseId]) return state.exercises[exerciseId].name;
  const builtin = BUILTIN_EXERCISES.find(e => e.id === exerciseId);
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
  // Record the swap — session-scoped, no mutation of live state objects
  const originalName = getExName(originalExerciseId, slotId);
  session.swaps.push({ slotId, originalExerciseId, newExerciseId, originalName, newName });
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

window.updateNotes = function(val) {
  if (session) session.log.notes = val;
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
  // Capture notes before replacing innerHTML destroys the textarea
  const notesEl = document.querySelector('.notes-area');
  if (notesEl) session.log.notes = notesEl.value;

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
