import { state, getActiveProgram, getLogsThisWeek, currentISOWeekNumber, currentISOWeekBounds } from '../state.js';
import { BUILTIN_EXERCISES } from '../data.js';
import { pushSubPage } from '../router.js';

const DAY_NAMES = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

export function renderToday() {
  const program = getActiveProgram();
  if (!program) return renderNoProgram();

  const logsThisWeek = getLogsThisWeek();
  const doneCount = logsThisWeek.length;
  const totalDays = program.days.length;
  const weekNum = currentISOWeekNumber();

  const todayDow = (new Date().getDay() + 6) % 7; // 0=Mon
  const todayTemplate = program.days.find(d => d.dayOfWeek === todayDow);
  const isRestDay = !todayTemplate;

  // Next workout
  const upcomingDays = program.days
    .filter(d => d.dayOfWeek > todayDow)
    .sort((a, b) => a.dayOfWeek - b.dayOfWeek);
  const nextDay = upcomingDays[0] ?? [...program.days].sort((a, b) => a.dayOfWeek - b.dayOfWeek)[0];

  // Best suggestion for today's workout
  const suggestion = todayTemplate ? getTodaySuggestion(todayTemplate, logsThisWeek) : null;

  const greeting = getGreeting();
  const name = state.profile.displayName || '';

  return `
    <div class="page active">
      <div style="margin-bottom:0.5rem;color:var(--text-secondary);font-size:0.9rem">
        ${greeting}${name ? `, ${name}` : ''}
      </div>
      <div style="display:flex;align-items:baseline;gap:16px;margin-bottom:1.5rem">
        <div class="page-title" style="margin:0">Week ${weekNum}</div>
        <div style="color:var(--text-secondary);font-size:0.9rem">${doneCount} of ${totalDays} days done</div>
      </div>

      ${isRestDay ? renderRestDay(nextDay) : renderWorkoutCard(todayTemplate, suggestion, weekNum)}

      ${nextDay && !isRestDay ? `
        <div style="color:var(--text-muted);font-size:0.82rem;margin-top:1rem;text-align:center">
          ${doneCount < totalDays - 1 ? `Rest tomorrow · ` : ''}Next: ${nextDay.name} ${DAY_NAMES[nextDay.dayOfWeek]}
        </div>
      ` : ''}
    </div>
  `;
}

function renderWorkoutCard(template, suggestion, weekNum) {
  return `
    <div class="card" style="cursor:pointer;border-color:var(--accent)" onclick="startWorkout('${template.id}')">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px">
        <div>
          <div style="font-size:1.2rem;font-weight:700">${template.name}</div>
          <div style="color:var(--text-secondary);font-size:0.85rem">${template.slots.length} exercises · Week ${weekNum}</div>
        </div>
      </div>
      ${suggestion ? `
        <div style="background:var(--bg-elevated);border-radius:var(--radius-sm);padding:10px 14px;margin-bottom:14px;font-size:0.85rem;color:var(--accent-secondary)">
          💡 ${suggestion}
        </div>
      ` : ''}
      <button class="btn btn-accent" style="width:100%;font-size:1rem;padding:14px" onclick="event.stopPropagation();startWorkout('${template.id}')">
        Start Workout
      </button>
    </div>
  `;
}

function renderRestDay(nextDay) {
  const streak = computeStreak();
  return `
    <div class="card" style="text-align:center;padding:2rem">
      <div style="font-size:3rem;margin-bottom:12px">🧘</div>
      <div style="font-size:1.1rem;font-weight:600;margin-bottom:8px">Rest Day</div>
      ${streak > 1 ? `<div style="color:var(--accent-amber);font-size:0.9rem">🔥 ${streak} week streak</div>` : ''}
      <div style="color:var(--text-secondary);font-size:0.85rem;margin-top:8px">
        ${nextDay ? `Next up: ${nextDay.name} on ${DAY_NAMES[nextDay.dayOfWeek]}` : 'Great work this week!'}
      </div>
    </div>
  `;
}

function renderNoProgram() {
  return `
    <div class="page active" style="text-align:center;padding:3rem 1rem">
      <div style="font-size:3rem;margin-bottom:16px">🏋</div>
      <div class="page-title">No program active</div>
      <div class="page-subtitle" style="margin-bottom:2rem">Pick a program to get started</div>
      <button class="btn btn-accent" onclick="navigateTo('build')">Browse Programs</button>
    </div>
  `;
}

function getTodaySuggestion(template, logsThisWeek) {
  // Find last week's log for this template
  const lastLog = Object.values(state.logs)
    .filter(l => l.workoutTemplateId === template.id)
    .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

  if (!lastLog) return null;

  // Find highest-load exercise that's going up
  for (const slot of template.slots) {
    const prevSets = lastLog.sets.filter(s => s.exerciseSlotId === slot.id && s.completed);
    if (!prevSets.length || !slot.targetLoadKg) continue;
    const prevLoad = Math.max(...prevSets.map(s => s.weight || 0));
    if (slot.targetLoadKg > prevLoad) {
      const ex = getExerciseName(slot.exerciseId);
      return `${ex}: try ${slot.targetLoadKg}kg today ↑`;
    }
  }
  return null;
}

function getExerciseName(exerciseId) {
  if (state.exercises[exerciseId]) return state.exercises[exerciseId].name;
  const builtin = BUILTIN_EXERCISES.find(e => e.id === exerciseId);
  if (builtin) return builtin.name;
  return exerciseId;
}

function computeStreak() {
  const pid = state.profile.activeProgramId;
  if (!pid) return 0;
  const logs = Object.values(state.logs).filter(l => l.programId === pid);
  if (!logs.length) return 0;

  // Get ISO week number for an arbitrary date
  function isoWeek(date) {
    const d = new Date(date);
    d.setHours(0,0,0,0);
    d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
    const week1 = new Date(d.getFullYear(), 0, 4);
    return 1 + Math.round(((d - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
  }

  // Build set of (year-week) strings that have at least one log
  const weekKeys = new Set(logs.map(l => {
    const d = new Date(l.date);
    return `${d.getFullYear()}-${isoWeek(d)}`;
  }));

  // Count consecutive weeks going backwards from current week
  let streak = 0;
  const now = new Date();
  for (let i = 0; i < 52; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() - i * 7);
    const key = `${d.getFullYear()}-${isoWeek(d)}`;
    if (weekKeys.has(key)) streak++;
    else if (i > 0) break; // gap found — stop
  }
  return streak;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

// Global handlers
window.startWorkout = function(templateId) {
  pushSubPage({ type: 'workout', templateId });
};

window.navigateTo = function(tab) {
  import('../router.js').then(r => r.navigateTo(tab));
};
