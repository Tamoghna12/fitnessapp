import { state, getActiveProgram, getLogsThisWeek, currentISOWeekNumber } from '../state.js';
import { BUILTIN_EXERCISES } from '../data.js';
import { pushSubPage } from '../router.js';

const DAY_NAMES_SHORT = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const DAY_NAMES_FULL  = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export function renderToday() {
  const program = getActiveProgram();
  if (!program) return renderNoProgram();

  const logsThisWeek   = getLogsThisWeek();
  const doneCount      = logsThisWeek.length;
  const totalDays      = program.days.length;
  const weekNum        = currentISOWeekNumber();
  const todayDow       = (new Date().getDay() + 6) % 7; // 0=Mon
  const todayTemplate  = program.days.find(d => d.dayOfWeek === todayDow);
  const isRestDay      = !todayTemplate;
  const streak         = computeStreak();

  // Next workout after today
  const upcomingDays = program.days
    .filter(d => d.dayOfWeek > todayDow)
    .sort((a, b) => a.dayOfWeek - b.dayOfWeek);
  const nextDay = upcomingDays[0] ?? [...program.days].sort((a, b) => a.dayOfWeek - b.dayOfWeek)[0];

  const suggestion = todayTemplate ? getTodaySuggestion(todayTemplate, logsThisWeek) : null;
  const greeting   = getGreeting();
  const name       = state.profile.displayName || '';

  // Week strip — show all 7 days (Mon-Sun), mark program days
  const logsThisWeekByTemplate = {};
  logsThisWeek.forEach(l => { logsThisWeekByTemplate[l.workoutTemplateId] = true; });

  const weekStripHtml = DAY_NAMES_SHORT.map((dayName, dow) => {
    const programDay  = program.days.find(d => d.dayOfWeek === dow);
    const isToday     = dow === todayDow;
    const isPast      = dow < todayDow;
    const isWorkout   = !!programDay;
    const isDone      = programDay && logsThisWeekByTemplate[programDay.id];

    let stateClass = '';
    let inner = '';

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
      // rest day
      stateClass = 'day-chip--rest';
      inner = `<span class="day-chip-dash">—</span>`;
    }

    return `
      <div class="day-chip ${stateClass}" title="${DAY_NAMES_FULL[dow]}${programDay ? ' · ' + programDay.name : ' · Rest'}">
        <div class="day-chip-icon">${inner}</div>
        <div class="day-chip-label">${dayName}</div>
      </div>`;
  }).join('');

  // Today's date display
  const now   = new Date();
  const dateStr = `${DAY_NAMES_FULL[todayDow]}, ${MONTH_NAMES[now.getMonth()]} ${now.getDate()}`;

  // Muscle groups being trained today
  const muscleChips = todayTemplate
    ? getMuscleGroups(todayTemplate).map(m =>
        `<span class="muscle-chip">${m}</span>`
      ).join('')
    : '';

  return `
    <div class="page active today-page">

      <!-- Greeting -->
      <div class="today-greeting">
        <div class="today-greeting-text">${greeting}${name ? `, ${name}` : ''}</div>
        <div class="today-date-line">
          <span class="today-date">${dateStr}</span>
          <span class="today-week-badge">W${weekNum}</span>
        </div>
      </div>

      <!-- Week Strip -->
      <div class="day-strip-wrap">
        <div class="day-strip">${weekStripHtml}</div>
        <div class="day-strip-meta">
          <span>${doneCount} of ${totalDays} done this week</span>
          <span style="color:var(--text-muted);font-size:0.7rem">${program.name}</span>
        </div>
      </div>

      <!-- Main card -->
      ${isRestDay ? renderRestCard(nextDay, streak) : renderWorkoutHero(todayTemplate, suggestion, muscleChips, doneCount, totalDays)}

      <!-- Footer stats -->
      <div class="today-stats">
        ${streak > 0 ? `
          <div class="today-stat-pill today-stat-pill--fire">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.66 11.2C17.43 10.9 17.15 10.64 16.89 10.38C16.22 9.78 15.46 9.35 15.16 8.57C14.84 7.75 15.08 6.8 15.55 6.06C15.91 5.45 16.34 4.9 16.61 4.24C16.87 3.6 16.9 2.87 16.64 2.22C16.38 1.57 15.82 1.06 15.21 0.73C14.6 0.4 13.93 0.21 13.25 0.15C12.57 0.09 11.88 0.15 11.22 0.32C9.52 0.79 8.16 2.01 7.5 3.65C7.17 4.5 7.09 5.42 7.22 6.31C7.35 7.2 7.69 8.04 8.21 8.77C9.28 10.27 10.88 11.31 12.06 12.71C12.64 13.39 13.08 14.17 13.19 15.05C13.3 15.93 13.06 16.83 12.54 17.56C12.26 17.95 11.9 18.28 11.5 18.53C11.1 18.78 10.67 18.96 10.22 19.05C9.3 19.23 8.35 19.08 7.54 18.61C6.73 18.14 6.11 17.37 5.83 16.48C5.56 15.59 5.64 14.63 6.06 13.79C6.28 13.37 6.6 13.01 6.96 12.72C7.32 12.43 7.73 12.21 8.12 11.97C8.28 11.87 8.44 11.77 8.6 11.66C8.42 12.22 8.35 12.81 8.4 13.4C8.45 13.99 8.62 14.57 8.9 15.1C9.27 14.42 9.52 13.68 9.63 12.92C9.74 12.16 9.7 11.38 9.52 10.63C9.34 9.88 9.01 9.17 8.55 8.55C8.38 8.32 8.19 8.1 8 7.89C8.35 8.19 8.66 8.54 8.9 8.93C9.15 9.32 9.31 9.76 9.38 10.21C9.38 10.21 9.83 9.32 10.27 8.16C10.71 7 11 5.57 10.71 4.22C10.99 4.59 11.22 5 11.38 5.44C11.55 5.88 11.64 6.35 11.65 6.82C11.66 7.29 11.59 7.77 11.44 8.22C11.29 8.67 11.07 9.09 10.8 9.46C10.54 9.83 10.24 10.16 9.9 10.45C9.56 10.74 9.19 10.99 8.81 11.2C8.43 11.41 8.03 11.58 7.64 11.79C7.25 12 6.88 12.25 6.54 12.54C5.52 13.41 4.89 14.66 4.79 16C4.69 17.34 5.13 18.66 6 19.7C6.87 20.74 8.12 21.43 9.46 21.61C9.87 21.67 10.28 21.68 10.69 21.66C11.1 21.64 11.51 21.58 11.9 21.48C12.68 21.28 13.42 20.91 14.04 20.4C14.66 19.89 15.16 19.24 15.5 18.5C15.84 17.76 16 16.96 15.97 16.15C15.94 15.34 15.72 14.55 15.33 13.84C15.03 13.29 14.63 12.8 14.15 12.39C14.71 12.95 15.17 13.62 15.47 14.36C15.77 15.1 15.9 15.9 15.85 16.69C15.8 17.48 15.57 18.25 15.17 18.94C14.77 19.63 14.22 20.22 13.56 20.67C13.9 20.47 14.22 20.25 14.51 20C15.5 19.14 16.16 17.95 16.35 16.65C16.54 15.35 16.26 14.02 15.57 12.9C16.3 13.46 16.87 14.22 17.18 15.09C17.49 15.96 17.52 16.9 17.26 17.78C17.82 16.93 18.08 15.91 18 14.9C17.93 13.89 17.51 12.94 16.83 12.22C17.5 12.45 18.03 12.92 18.37 13.53C18.37 13.53 19.27 11.77 17.66 11.2Z"/></svg>
            ${streak}-week streak
          </div>
        ` : ''}
        ${doneCount > 0 ? `
          <div class="today-stat-pill">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            ${doneCount} session${doneCount > 1 ? 's' : ''} this week
          </div>
        ` : ''}
        <button class="today-change-btn" onclick="navigateTo('build')">Change program</button>
      </div>

    </div>
  `;
}

// ── Sub-renders ────────────────────────────────────────────────────────────────

function renderWorkoutHero(template, suggestion, muscleChips, doneCount, totalDays) {
  const pct = totalDays > 0 ? Math.round((doneCount / totalDays) * 100) : 0;
  return `
    <div class="workout-hero" onclick="startWorkout('${template.id}')">
      <div class="workout-hero-inner">
        <div class="workout-hero-top">
          <div>
            <div class="workout-hero-badge">TODAY</div>
            <div class="workout-hero-name">${template.name}</div>
            <div class="workout-hero-meta">${template.slots.length} exercise${template.slots.length !== 1 ? 's' : ''}</div>
          </div>
          <div class="workout-hero-ring">
            <svg width="56" height="56" viewBox="0 0 56 56">
              <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="4"/>
              <circle cx="28" cy="28" r="22" fill="none" stroke="white" stroke-width="4"
                stroke-dasharray="${Math.round(2 * Math.PI * 22 * pct / 100)} ${Math.round(2 * Math.PI * 22)}"
                stroke-linecap="round" transform="rotate(-90 28 28)"/>
            </svg>
            <div class="workout-hero-ring-text">${pct}%</div>
          </div>
        </div>

        ${muscleChips ? `<div class="workout-hero-muscles">${muscleChips}</div>` : ''}

        ${suggestion ? `
          <div class="workout-hero-hint">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>
            ${suggestion}
          </div>
        ` : ''}

        <button class="workout-hero-cta" onclick="event.stopPropagation();startWorkout('${template.id}')">
          Start Workout
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </button>
      </div>
    </div>
  `;
}

function renderRestCard(nextDay, streak) {
  return `
    <div class="rest-hero">
      <div class="rest-hero-emoji">🧘</div>
      <div class="rest-hero-title">Rest Day</div>
      ${streak > 1 ? `
        <div class="rest-streak-badge">🔥 ${streak}-week streak</div>
      ` : ''}
      <div class="rest-hero-sub">
        ${nextDay ? `Next: ${nextDay.name} on ${DAY_NAMES_SHORT[nextDay.dayOfWeek]}` : 'Great work this week!'}
      </div>
    </div>
  `;
}

function renderNoProgram() {
  return `
    <div class="page active today-page">
      <div class="today-greeting">
        <div class="today-greeting-text">${getGreeting()}</div>
        <div class="today-date-line">
          <span class="today-date">Let's get started</span>
        </div>
      </div>
      <div class="no-program-card">
        <div class="no-program-icon">🏋</div>
        <div class="no-program-title">No program active</div>
        <div class="no-program-sub">Choose a program to see your workouts here</div>
        <button class="btn btn-accent" style="margin-top:1.5rem;padding:13px 28px;font-size:0.95rem;font-weight:800" onclick="navigateTo('build')">
          Browse Programs
        </button>
      </div>
    </div>
  `;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function getMuscleGroups(template) {
  const groups = new Set();
  for (const slot of template.slots) {
    const ex = state.exercises[slot.exerciseId]
      || BUILTIN_EXERCISES.find(e => e.id === slot.exerciseId);
    if (!ex) continue;
    const mg = ex.muscleGroup || ex.category || '';
    mg.split(/[,/]/).forEach(m => {
      const t = m.trim().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      if (t) groups.add(t);
    });
    if (groups.size >= 4) break;
  }
  return [...groups].slice(0, 4);
}

function getTodaySuggestion(template, logsThisWeek) {
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

function getExerciseName(exerciseId) {
  if (state.exercises[exerciseId]) return state.exercises[exerciseId].name;
  const builtin = BUILTIN_EXERCISES.find(e => e.id === exerciseId);
  return builtin ? builtin.name : exerciseId;
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

window.navigateTo = function(tab) {
  import('../router.js').then(r => r.navigateTo(tab));
};
