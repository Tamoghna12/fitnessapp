import { makeProfile } from './schema.js';
// NOTE: darebee-data.js is loaded via <script> tag in index.html as a global (DAREBEE_WORKOUTS)
// before app.js loads, so it is available as window.DAREBEE_WORKOUTS in all modules.

const STORAGE_KEY = 'iron-protocol-v2';
const MAX_LOG_WEEKS = 8;

// In-memory state
export let state = {
  profile: makeProfile(),
  programs: {},      // id → Program
  logs: {},          // id → WorkoutLog
  suggestions: {},   // id → ProgressionSuggestion
  exercises: {},     // id → Exercise (custom only; built-ins in data.js)
  lastSyncAt: null,
};

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) Object.assign(state, JSON.parse(raw));
  } catch { /* corrupt storage — start fresh */ }
}

export function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    if (e.name === 'QuotaExceededError') evictOldLogs();
  }
}

function evictOldLogs() {
  const cutoff = Date.now() - MAX_LOG_WEEKS * 7 * 24 * 60 * 60 * 1000;
  for (const [id, log] of Object.entries(state.logs)) {
    if (new Date(log.date).getTime() < cutoff) delete state.logs[id];
  }
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
}

export function updateProfile(patch) {
  state.profile = { ...state.profile, ...patch, updatedAt: new Date().toISOString() };
  saveState();
}

export function saveProgram(program) {
  state.programs[program.id] = { ...program, updatedAt: new Date().toISOString() };
  saveState();
}

export function saveLog(log) {
  // WorkoutLogs are immutable — only write once
  if (!state.logs[log.id]) {
    state.logs[log.id] = log;
    saveState();
  }
}

export function saveSuggestion(suggestion) {
  state.suggestions[suggestion.id] = suggestion;
  saveState();
}

export function saveExercise(exercise) {
  state.exercises[exercise.id] = exercise;
  saveState();
}

export function getActiveProgram() {
  return state.programs[state.profile.activeProgramId] ?? null;
}

/** Returns WorkoutLog entries for active program in current ISO week */
export function getLogsThisWeek() {
  const pid = state.profile.activeProgramId;
  if (!pid) return [];
  const { start, end } = currentISOWeekBounds();
  return Object.values(state.logs).filter(l =>
    l.programId === pid &&
    new Date(l.date) >= start &&
    new Date(l.date) <= end
  );
}

export function currentISOWeekBounds() {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { start: monday, end: sunday };
}

export function currentISOWeekNumber() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
}
