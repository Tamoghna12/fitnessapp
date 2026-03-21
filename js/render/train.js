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
