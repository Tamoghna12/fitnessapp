import { state, getActiveProgram, getLogsThisWeek, currentISOWeekNumber } from '../state.js';
import { BUILTIN_EXERCISES, getAllExercises } from '../data.js';
import { pushSubPage } from '../router.js';

const DAY_NAMES_SHORT = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const DAY_NAMES_FULL  = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export function renderToday() {
  const program = getActiveProgram();
  if (!program) return renderNoProgram();

  const logsThisWeek   = getLogsThisWeek();
  const allLogs        = Object.values(state.logs).filter(l => l.programId === program.id);
  const doneCount      = logsThisWeek.length;
  const totalDays      = program.days.length;
  const weekNum        = currentISOWeekNumber();
  const todayDow       = (new Date().getDay() + 6) % 7; // 0=Mon
  const todayTemplate  = program.days.find(d => d.dayOfWeek === todayDow);
  const isRestDay      = !todayTemplate;
  const streak         = computeStreak();

  const upcomingDays = program.days
    .filter(d => d.dayOfWeek > todayDow)
    .sort((a, b) => a.dayOfWeek - b.dayOfWeek);
  const nextDay = upcomingDays[0] ?? [...program.days].sort((a, b) => a.dayOfWeek - b.dayOfWeek)[0];

  const suggestion = todayTemplate ? getTodaySuggestion(todayTemplate) : null;
  const greeting   = getGreeting();
  const now = new Date();
  const dateStr = `${DAY_NAMES_FULL[todayDow]}, ${MONTH_NAMES[now.getMonth()]} ${now.getDate()}`;

  // Check if today's workout is already done
  const logsThisWeekByTemplate = {};
  logsThisWeek.forEach(l => { logsThisWeekByTemplate[l.workoutTemplateId] = true; });
  const todayDone = todayTemplate && logsThisWeekByTemplate[todayTemplate.id];

  // ── Week strip ──────────────────────────────────────────────────────────────
  const weekStripHtml = DAY_NAMES_SHORT.map((dayName, dow) => {
    const programDay  = program.days.find(d => d.dayOfWeek === dow);
    const isToday     = dow === todayDow;
    const isPast      = dow < todayDow;
    const isWorkout   = !!programDay;
    const isDone      = programDay && logsThisWeekByTemplate[programDay.id];

    let stateClass = '', inner = '';
    if (isDone) {
      stateClass = 'day-chip--done';
      inner = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
    } else if (isToday && isWorkout) {
      stateClass = 'day-chip--today-workout';
      inner = `<div class="day-chip-dot"></div>`;
    } else if (isToday && !isWorkout) {
      stateClass = 'day-chip--today-rest';
      inner = `<div class="day-chip-dot day-chip-dot--rest"></div>`;
    } else if (isWorkout && !isPast) {
      stateClass = 'day-chip--upcoming';
      inner = `<div class="day-chip-dot day-chip-dot--dim"></div>`;
    } else if (isWorkout && isPast) {
      stateClass = 'day-chip--missed';
      inner = `<div class="day-chip-dot day-chip-dot--missed"></div>`;
    } else {
      stateClass = 'day-chip--rest';
      inner = `<span class="day-chip-dash">—</span>`;
    }
    return `
      <div class="day-chip ${stateClass}" title="${DAY_NAMES_FULL[dow]}${programDay ? ' · ' + programDay.name : ' · Rest'}">
        <div class="day-chip-icon">${inner}</div>
        <div class="day-chip-label">${dayName}</div>
      </div>`;
  }).join('');

  // ── Exercise preview list (today's workout) ─────────────────────────────────
  const exerciseListHtml = todayTemplate ? todayTemplate.slots.map(slot => {
    const name = getExerciseName(slot.exerciseId);
    const muscle = getExerciseMuscle(slot.exerciseId);
    return `
      <div class="dash-exercise-row">
        <div class="dash-exercise-dot"></div>
        <div class="dash-exercise-info">
          <div class="dash-exercise-name">${name}</div>
          <div class="dash-exercise-meta">${slot.targetSets}×${slot.targetRepsMin}${slot.targetRepsMax !== slot.targetRepsMin ? '–' + slot.targetRepsMax : ''}${slot.targetLoadKg ? ' @ ' + slot.targetLoadKg + 'kg' : ''}${muscle ? ' · ' + muscle : ''}</div>
        </div>
      </div>
    `;
  }).join('') : '';

  // ── Last workout summary ────────────────────────────────────────────────────
  const recentLogs = allLogs
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 3);
  const lastWorkoutHtml = recentLogs.length > 0 ? recentLogs.map(log => {
    const tpl = program.days.find(d => d.id === log.workoutTemplateId);
    const d = new Date(log.date);
    const dayStr = `${DAY_NAMES_SHORT[(d.getDay()+6)%7]} ${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`;
    const completedSets = log.sets.filter(s => s.completed).length;
    const totalSets = log.sets.length;
    const rating = log.sessionRating;
    const ratingLabels = ['', 'Rough', 'Tough', 'Solid', 'Great', 'Peak'];
    return `
      <div class="dash-history-row">
        <div class="dash-history-date">${dayStr}</div>
        <div class="dash-history-info">
          <div class="dash-history-name">${tpl?.name || 'Workout'}</div>
          <div class="dash-history-meta">${completedSets}/${totalSets} sets${rating ? ' · ' + ratingLabels[rating] : ''}</div>
        </div>
      </div>
    `;
  }).join('') : `<div style="color:var(--text-muted);font-size:0.82rem;padding:8px 0">No workouts logged yet</div>`;

  // ── Stats row ───────────────────────────────────────────────────────────────
  const totalSessions = allLogs.length;
  const muscleChips = todayTemplate
    ? getMuscleGroups(todayTemplate).map(m => `<span class="muscle-chip">${m}</span>`).join('')
    : '';

  return `
    <div class="page active today-page" style="padding-bottom:80px">

      <!-- Greeting + date -->
      <div class="today-greeting">
        <div class="today-greeting-text">${greeting}</div>
        <div class="today-date-line">
          <span class="today-date">${dateStr}</span>
          <span class="today-week-badge">W${weekNum}</span>
        </div>
      </div>

      <!-- Stats tiles -->
      <div class="dash-stats-row">
        <div class="dash-stat-tile">
          <div class="dash-stat-value">${doneCount}<span class="dash-stat-of">/${totalDays}</span></div>
          <div class="dash-stat-label">This week</div>
        </div>
        <div class="dash-stat-tile">
          <div class="dash-stat-value">${streak}</div>
          <div class="dash-stat-label">Week streak</div>
        </div>
        <div class="dash-stat-tile">
          <div class="dash-stat-value">${totalSessions}</div>
          <div class="dash-stat-label">Total sessions</div>
        </div>
      </div>

      <!-- Week strip -->
      <div class="day-strip-wrap">
        <div class="day-strip">${weekStripHtml}</div>
        <div class="day-strip-meta">
          <span>${program.name}</span>
          <button class="today-change-btn" onclick="navigateTo('build')">Edit</button>
        </div>
      </div>

      <!-- Today's workout card -->
      ${isRestDay ? renderRestCard(nextDay, streak)
        : todayDone ? renderDoneCard(todayTemplate, nextDay)
        : `
        <div class="dash-workout-card">
          <div class="dash-workout-header">
            <div>
              <div class="dash-workout-badge">TODAY'S WORKOUT</div>
              <div class="dash-workout-name">${todayTemplate.name}</div>
              ${muscleChips ? `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:6px">${muscleChips}</div>` : ''}
            </div>
            <button class="dash-start-btn" onclick="startWorkout('${todayTemplate.id}')">
              Start
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3" fill="currentColor" stroke="none"/></svg>
            </button>
          </div>

          ${suggestion ? `
            <div class="dash-suggestion">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>
              ${suggestion}
            </div>
          ` : ''}

          <div class="dash-exercise-list">
            ${exerciseListHtml}
          </div>
        </div>
      `}

      <!-- Recent activity -->
      <div class="dash-section">
        <div class="dash-section-header">
          <span class="dash-section-title">Recent Activity</span>
          <button class="today-change-btn" onclick="navigateTo('train')">View all</button>
        </div>
        ${lastWorkoutHtml}
      </div>

      <!-- Quick actions -->
      <div class="dash-quick-row">
        <button class="dash-quick-btn" onclick="navigateTo('build')">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          Programs
        </button>
        <button class="dash-quick-btn" onclick="navigateTo('calc')">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="16" y2="10"/></svg>
          Calculators
        </button>
        <button class="dash-quick-btn" onclick="navigateTo('me')">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          Profile
        </button>
      </div>

    </div>
  `;
}

// ── Sub-renders ────────────────────────────────────────────────────────────────

function renderDoneCard(todayTemplate, nextDay) {
  return `
    <div class="dash-done-card">
      <div class="dash-done-check">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
      <div class="dash-done-title">${todayTemplate.name} — Done!</div>
      <div class="dash-done-sub">
        ${nextDay ? `Next: <strong>${nextDay.name}</strong> on ${DAY_NAMES_SHORT[nextDay.dayOfWeek]}` : 'Great work this week!'}
      </div>
    </div>
  `;
}

function renderRestCard(nextDay, streak) {
  return `
    <div class="rest-hero">
      <div class="rest-hero-emoji">🧘</div>
      <div class="rest-hero-title">Rest Day</div>
      ${streak > 1 ? `<div class="rest-streak-badge">${streak}-week streak</div>` : ''}
      <div class="rest-hero-sub">
        ${nextDay ? `Next: <strong>${nextDay.name}</strong> on ${DAY_NAMES_SHORT[nextDay.dayOfWeek]}` : 'Great work this week!'}
      </div>
    </div>
  `;
}

function renderNoProgram() {
  return `
    <div class="page active today-page" style="padding-bottom:80px">
      <div class="today-greeting">
        <div class="today-greeting-text">${getGreeting()}</div>
        <div class="today-date-line">
          <span class="today-date">Let's get started</span>
        </div>
      </div>
      <div class="no-program-card">
        <div class="no-program-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        </div>
        <div class="no-program-title">No program active</div>
        <div class="no-program-sub">Choose or create a program to start training</div>
        <button class="btn btn-accent" style="margin-top:1.5rem;padding:13px 28px;font-size:0.95rem;font-weight:700" onclick="navigateTo('build')">
          Browse Programs
        </button>
      </div>

      <!-- Quick actions even without a program -->
      <div class="dash-quick-row" style="margin-top:1.5rem">
        <button class="dash-quick-btn" onclick="navigateTo('build')">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          Programs
        </button>
        <button class="dash-quick-btn" onclick="navigateTo('calc')">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="16" y2="10"/></svg>
          Calculators
        </button>
        <button class="dash-quick-btn" onclick="navigateTo('me')">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          Profile
        </button>
      </div>
    </div>
  `;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function getMuscleGroups(template) {
  const groups = new Set();
  for (const slot of template.slots) {
    const ex = findExercise(slot.exerciseId);
    if (!ex) continue;
    const mg = ex.muscleGroup || '';
    mg.split(/[,/]/).forEach(m => {
      const t = m.trim().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      if (t) groups.add(t);
    });
    if (groups.size >= 4) break;
  }
  return [...groups].slice(0, 4);
}

function findExercise(exerciseId) {
  if (state.exercises[exerciseId]) return state.exercises[exerciseId];
  const b = BUILTIN_EXERCISES.find(e => e.id === exerciseId);
  if (b) return b;
  return getAllExercises(state.exercises).find(e => e.id === exerciseId) || null;
}

function getExerciseName(exerciseId) {
  const ex = findExercise(exerciseId);
  return ex ? ex.name : exerciseId;
}

function getExerciseMuscle(exerciseId) {
  const ex = findExercise(exerciseId);
  if (!ex) return '';
  const mg = ex.muscleGroup || '';
  // Return just the first muscle group for compact display
  const first = mg.split(/[,/]/)[0]?.trim() || '';
  return first;
}

function getTodaySuggestion(template) {
  const lastLog = Object.values(state.logs)
    .filter(l => l.workoutTemplateId === template.id)
    .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
  if (!lastLog) return null;
  for (const slot of template.slots) {
    const prevSets = lastLog.sets.filter(s => s.exerciseSlotId === slot.id && s.completed);
    if (!prevSets.length || !slot.targetLoadKg) continue;
    const prevLoad = Math.max(...prevSets.map(s => s.weight || 0));
    if (slot.targetLoadKg > prevLoad) {
      const ex = getExerciseName(slot.exerciseId);
      return `${ex}: try ${slot.targetLoadKg}kg`;
    }
  }
  return null;
}

function computeStreak() {
  const pid = state.profile.activeProgramId;
  if (!pid) return 0;
  const logs = Object.values(state.logs).filter(l => l.programId === pid);
  if (!logs.length) return 0;
  function isoWeek(date) {
    const d = new Date(date);
    d.setHours(0,0,0,0);
    d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
    const week1 = new Date(d.getFullYear(), 0, 4);
    return 1 + Math.round(((d - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
  }
  const weekKeys = new Set(logs.map(l => {
    const d = new Date(l.date);
    return `${d.getFullYear()}-${isoWeek(d)}`;
  }));
  let streak = 0;
  const now = new Date();
  for (let i = 0; i < 52; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() - i * 7);
    const key = `${d.getFullYear()}-${isoWeek(d)}`;
    if (weekKeys.has(key)) streak++;
    else if (i > 0) break;
  }
  return streak;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

// ── Global handlers ────────────────────────────────────────────────────────────
window.startWorkout = function(templateId) {
  pushSubPage({ type: 'workout', templateId });
};

