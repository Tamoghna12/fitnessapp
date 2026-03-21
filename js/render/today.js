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

  // Build week-strip: one dot per program day, by day-of-week order
  const sortedDays = [...program.days].sort((a, b) => a.dayOfWeek - b.dayOfWeek);
  const { start: weekStart, end: weekEnd } = currentISOWeekBounds();
  const logsThisWeekByTemplate = {};
  getLogsThisWeek().forEach(l => { logsThisWeekByTemplate[l.workoutTemplateId] = true; });
  const weekStripHtml = sortedDays.map(d => {
    const done = logsThisWeekByTemplate[d.id];
    const isToday = d.dayOfWeek === todayDow;
    const cls = done ? 'done' : isToday ? 'today' : '';
    return `<div class="week-dot ${cls}" title="${DAY_NAMES[d.dayOfWeek]} · ${d.name}"></div>`;
  }).join('');

  return `
    <div class="page active">
      <div style="margin-bottom:0.25rem;color:var(--text-secondary);font-size:0.82rem;font-weight:500">
        ${greeting}${name ? `, ${name}` : ''}
      </div>
      <div style="display:flex;align-items:baseline;justify-content:space-between;margin-bottom:1rem">
        <div style="display:flex;align-items:baseline;gap:14px">
          <div class="page-title" style="margin:0">Week ${weekNum}</div>
          <div style="color:var(--text-secondary);font-size:0.85rem">${doneCount}/${totalDays} done</div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;flex-shrink:0">
          <span style="font-size:0.72rem;color:var(--text-muted)">${program.name}</span>
          <button class="btn btn-ghost" style="font-size:0.68rem;padding:3px 9px" onclick="navigateTo('build')">Change</button>
        </div>
      </div>

      <div class="week-strip">${weekStripHtml}</div>

      ${isRestDay ? renderRestDay(nextDay) : renderWorkoutCard(todayTemplate, suggestion, weekNum)}

      ${nextDay && !isRestDay ? `
        <div style="color:var(--text-muted);font-size:0.78rem;margin-top:0.75rem;text-align:center;font-family:'JetBrains Mono',monospace;letter-spacing:0.5px">
          ${doneCount < totalDays - 1 ? `rest tomorrow · ` : ''}next: ${nextDay.name} ${DAY_NAMES[nextDay.dayOfWeek]}
        </div>
      ` : ''}
    </div>
  `;
}

function renderWorkoutCard(template, suggestion, weekNum) {
  return `
    <div class="card card--glow" style="cursor:pointer" onclick="startWorkout('${template.id}')">
      <div class="card-header">
        <div>
          <div class="card-title">${template.name}</div>
          <div style="color:var(--text-secondary);font-size:0.78rem;font-family:'JetBrains Mono',monospace;letter-spacing:0.5px;margin-top:2px">
            ${template.slots.length} exercises · week ${weekNum}
          </div>
        </div>
        <span class="card-badge badge-strength">Today</span>
      </div>
      ${suggestion ? `<div class="ex-hint" style="display:block;margin-bottom:14px">↑ ${suggestion}</div>` : ''}
      <button class="btn btn-accent" style="width:100%;font-size:0.95rem;padding:13px;letter-spacing:1px" onclick="event.stopPropagation();startWorkout('${template.id}')">
        START WORKOUT
      </button>
    </div>
  `;
}

function renderRestDay(nextDay) {
  const streak = computeStreak();
  return `
    <div class="card card--success" style="text-align:center;padding:2rem 1.5rem">
      <div style="font-size:2.8rem;margin-bottom:10px">🧘</div>
      <div class="card-title" style="justify-content:center;margin-bottom:6px">REST DAY</div>
      ${streak > 1 ? `
        <div style="display:inline-flex;align-items:center;gap:6px;font-family:'JetBrains Mono',monospace;font-size:0.72rem;color:var(--accent-amber);background:rgba(251,191,36,0.08);border:1px solid rgba(251,191,36,0.15);padding:4px 12px;border-radius:20px;margin-bottom:10px">
          🔥 ${streak}-week streak
        </div>
      ` : ''}
      <div style="color:var(--text-secondary);font-size:0.82rem;margin-top:6px">
        ${nextDay ? `next up: ${nextDay.name} on ${DAY_NAMES[nextDay.dayOfWeek]}` : 'great work this week!'}
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
