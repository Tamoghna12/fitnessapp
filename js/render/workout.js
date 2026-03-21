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
