import { state, saveProgram, saveExercise } from '../state.js';
import { getAllExercises } from '../data.js';
import { makeProgram, makeWorkoutTemplate, makeExerciseSlot } from '../schema.js';
import { navigateTo, pushSubPage, popSubPage } from '../router.js';

// ── Module-level config + result ──────────────────────────────────────────────

let _config = {
  muscles: [],
  equipment: [],
  goal: 'hypertrophy',
  count: 6,
};

let _generated = null; // Exercise[]

// ── Constants ─────────────────────────────────────────────────────────────────

const MUSCLE_GROUPS = [
  { label: 'Chest',      key: 'chest' },
  { label: 'Back',       key: 'back' },
  { label: 'Shoulders',  key: 'shoulders' },
  { label: 'Biceps',     key: 'biceps' },
  { label: 'Triceps',    key: 'triceps' },
  { label: 'Core',       key: 'core' },
  { label: 'Quads',      key: 'quads' },
  { label: 'Hamstrings', key: 'hamstrings' },
  { label: 'Glutes',     key: 'glutes' },
  { label: 'Calves',     key: 'calves' },
  { label: 'Lower Back', key: 'lower back' },
  { label: 'Traps',      key: 'traps' },
];

const EQUIPMENT_OPTIONS = [
  { label: 'Dumbbells',       key: 'dumbbells' },
  { label: 'Barbell',         key: 'barbell' },
  { label: 'Bodyweight',      key: 'bodyweight' },
  { label: 'Kettlebell',      key: 'kettlebell' },
  { label: 'Cables',          key: 'cable' },
  { label: 'Machine',         key: 'machine' },
  { label: 'Resistance Band', key: 'resistance band' },
  { label: 'Pull-up Bar',     key: 'pull-up bar' },
];

const GOALS = [
  { label: 'Strength',    value: 'strength',    sets: 5, repsMin: 3,  repsMax: 5,  step: 2.5 },
  { label: 'Hypertrophy', value: 'hypertrophy', sets: 4, repsMin: 8,  repsMax: 12, step: 2.5 },
  { label: 'Endurance',   value: 'endurance',   sets: 3, repsMin: 15, repsMax: 20, step: 0   },
  { label: 'General',     value: 'general',     sets: 3, repsMin: 10, repsMax: 15, step: 2.5 },
];

// ── Render ────────────────────────────────────────────────────────────────────

export function renderGenerator() {
  const total = typeof EXERCISE_LIBRARY !== 'undefined' ? EXERCISE_LIBRARY.length + 15 : 15;

  return `
    <div class="page active">
      <div class="db-detail-back" onclick="popSubPage()">← Back</div>
      <div class="page-title">Workout Generator</div>
      <div class="page-subtitle">Choose your targets — we'll pull from ${total.toLocaleString()}+ exercises</div>

      <div class="card">
        <div class="section-label" style="margin-bottom:0.75rem">
          Target Muscles
          <span style="color:var(--text-muted);font-size:0.78em;text-transform:none;letter-spacing:0;font-weight:400"> — pick any</span>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:1.5rem">
          ${MUSCLE_GROUPS.map(m => {
            const on = _config.muscles.includes(m.key);
            return `<button class="db-filter-btn${on ? ' active' : ''}" onclick="genToggleMuscle('${m.key}')">${m.label}</button>`;
          }).join('')}
        </div>

        <div class="section-label" style="margin-bottom:0.75rem">
          Equipment
          <span style="color:var(--text-muted);font-size:0.78em;text-transform:none;letter-spacing:0;font-weight:400"> — leave empty for any</span>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:1.5rem">
          ${EQUIPMENT_OPTIONS.map(e => {
            const on = _config.equipment.includes(e.key);
            return `<button class="db-filter-btn${on ? ' active' : ''}" onclick="genToggleEquip('${e.key}')">${e.label}</button>`;
          }).join('')}
        </div>

        <div class="section-label" style="margin-bottom:0.75rem">Goal</div>
        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:1.5rem">
          ${GOALS.map(g => {
            const on = _config.goal === g.value;
            return `
              <button class="db-filter-btn${on ? ' active' : ''}" onclick="genSetGoal('${g.value}')"
                style="display:flex;flex-direction:column;align-items:flex-start;gap:2px;padding:8px 14px">
                <span>${g.label}</span>
                <span style="font-family:'JetBrains Mono',monospace;font-size:0.68em;opacity:0.65">${g.sets}×${g.repsMin}–${g.repsMax} reps</span>
              </button>`;
          }).join('')}
        </div>

        <div class="section-label" style="margin-bottom:0.5rem" id="gen-count-label">
          Exercises: <span style="color:var(--text-primary)">${_config.count}</span>
        </div>
        <input type="range" min="3" max="10" value="${_config.count}"
          oninput="genSetCount(+this.value)"
          style="width:100%;margin-bottom:1.5rem;accent-color:var(--accent);cursor:pointer">

        <button class="btn btn-accent"
          style="width:100%;padding:14px;font-size:0.95rem;font-weight:800;letter-spacing:0.5px"
          onclick="runGenerator()">
          ⚡ Generate Workout
        </button>
      </div>

      ${_generated !== null ? renderResults() : ''}
    </div>
  `;
}

function renderResults() {
  const goal = GOALS.find(g => g.value === _config.goal) || GOALS[1];

  if (_generated.length === 0) {
    return `
      <div class="card" style="text-align:center;color:var(--text-muted);padding:2rem">
        No exercises found for those filters.<br>Try fewer restrictions or different muscle groups.
      </div>`;
  }

  return `
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">
        <div>
          <div style="font-weight:700;font-size:1rem">${_generated.length} exercises</div>
          <div style="font-size:0.78rem;color:var(--text-muted)">${goal.label} · ${goal.sets}×${goal.repsMin}–${goal.repsMax} reps</div>
        </div>
        <button class="btn btn-ghost" style="font-size:0.78rem;padding:6px 12px" onclick="runGenerator()">↺ Shuffle All</button>
      </div>

      ${_generated.map((ex, i) => `
        <div style="display:flex;align-items:center;gap:10px;padding:11px 0;border-bottom:1px solid var(--border-subtle)">
          <div style="font-family:'JetBrains Mono',monospace;font-size:0.65rem;color:var(--text-muted);width:18px;text-align:right;flex-shrink:0">${i + 1}</div>
          <div style="flex:1;min-width:0">
            <div style="font-weight:600;font-size:0.88rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${ex.name}</div>
            <div style="font-size:0.72rem;color:var(--text-muted);margin-top:1px">
              ${ex.muscleGroup ? ex.muscleGroup.split('/')[0].split(',')[0].trim() : ''}${ex.equipment ? ' · ' + ex.equipment : ''}
            </div>
          </div>
          <div style="font-family:'JetBrains Mono',monospace;font-size:0.75rem;color:var(--accent-secondary);white-space:nowrap;flex-shrink:0">
            ${goal.sets}×${goal.repsMin}–${goal.repsMax}
          </div>
          <button class="btn btn-ghost" style="font-size:0.72rem;padding:4px 8px;flex-shrink:0" title="Swap exercise"
            onclick="genSwapEx(${i})">↺</button>
        </div>
      `).join('')}

      <div style="display:flex;gap:10px;margin-top:1.5rem">
        <button class="btn btn-accent" style="flex:1;padding:12px;font-size:0.95rem" onclick="genStartWorkout()">
          ▶ Start Now
        </button>
        <button class="btn btn-ghost" style="padding:12px" onclick="genSave()">Save to Build</button>
      </div>
    </div>
  `;
}

// ── Algorithm ─────────────────────────────────────────────────────────────────

function pickExercises(config) {
  const all = getAllExercises(state.exercises);

  // Filter by equipment if any selected
  const byEquip = config.equipment.length > 0
    ? all.filter(ex => {
        const eq = (ex.equipment || '').toLowerCase();
        return config.equipment.some(e => eq.includes(e));
      })
    : all;

  if (!byEquip.length) return [];

  const selected = [];
  const usedIds = new Set();

  if (config.muscles.length > 0) {
    // Evenly distribute slots across selected muscle groups
    const slotsPerMuscle = Math.max(1, Math.round(config.count / config.muscles.length));

    for (const muscle of config.muscles) {
      const matches = byEquip.filter(ex => {
        if (usedIds.has(ex.id)) return false;
        const mg = (ex.muscleGroup || '').toLowerCase();
        const pm = (ex.primaryMuscles || []).join(' ').toLowerCase();
        return mg.includes(muscle) || pm.includes(muscle);
      });

      shuffle(matches);

      for (const ex of matches.slice(0, slotsPerMuscle)) {
        if (selected.length >= config.count) break;
        selected.push(ex);
        usedIds.add(ex.id);
      }
    }
  }

  // Fill remaining slots from the filtered pool
  if (selected.length < config.count) {
    const pool = byEquip.filter(ex => !usedIds.has(ex.id));
    shuffle(pool);
    for (const ex of pool) {
      if (selected.length >= config.count) break;
      selected.push(ex);
    }
  }

  return selected.slice(0, config.count);
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

// Saves generated exercises to state.exercises so workout session can resolve names
function persistExercises() {
  for (const ex of (_generated || [])) {
    if (!state.exercises[ex.id]) saveExercise(ex);
  }
}

function buildTemplate(name, goal) {
  return makeWorkoutTemplate({
    name,
    dayOfWeek: (new Date().getDay() + 6) % 7,
    slots: (_generated || []).map(ex => makeExerciseSlot({
      exerciseId: ex.id,
      targetSets: goal.sets,
      targetRepsMin: goal.repsMin,
      targetRepsMax: goal.repsMax,
      targetLoadKg: null,
      progressionRule: goal.step > 0 ? 'reps' : 'none',
      progressionStepKg: goal.step,
    })),
  });
}

// ── Global handlers ───────────────────────────────────────────────────────────

window.genToggleMuscle = function(key) {
  const idx = _config.muscles.indexOf(key);
  if (idx >= 0) _config.muscles.splice(idx, 1);
  else _config.muscles.push(key);
  _rerender();
};

window.genToggleEquip = function(key) {
  const idx = _config.equipment.indexOf(key);
  if (idx >= 0) _config.equipment.splice(idx, 1);
  else _config.equipment.push(key);
  _rerender();
};

window.genSetGoal = function(goal) {
  _config.goal = goal;
  _rerender();
};

window.genSetCount = function(n) {
  _config.count = n;
  // Update label inline without full rerender
  const label = document.getElementById('gen-count-label');
  if (label) label.innerHTML = `Exercises: <span style="color:var(--text-primary)">${n}</span>`;
};

window.runGenerator = function() {
  _generated = pickExercises(_config);
  _rerender();
};

window.genSwapEx = function(idx) {
  if (!_generated || idx >= _generated.length) return;
  const all = getAllExercises(state.exercises);
  const byEquip = _config.equipment.length > 0
    ? all.filter(ex => _config.equipment.some(e => (ex.equipment || '').toLowerCase().includes(e)))
    : all;

  const current = _generated[idx];
  const usedIds = new Set(_generated.map(e => e.id));

  // Prefer same primary muscle group, fall back to any available
  const primaryMuscle = (current.muscleGroup || '').split(/[,/]/)[0].toLowerCase().trim();
  const sameMuscle = byEquip.filter(ex => !usedIds.has(ex.id) &&
    (ex.muscleGroup || '').toLowerCase().includes(primaryMuscle));
  const pool = sameMuscle.length ? sameMuscle : byEquip.filter(ex => !usedIds.has(ex.id));

  if (!pool.length) return;
  _generated[idx] = pool[Math.floor(Math.random() * pool.length)];
  _rerender();
};

window.genStartWorkout = function() {
  if (!_generated?.length) return;
  const goal = GOALS.find(g => g.value === _config.goal) || GOALS[1];
  persistExercises();
  const template = buildTemplate(`${goal.label} Workout`, goal);
  const prog = makeProgram({
    name: 'Generated Workout',
    totalWeeks: 1,
    isTemplate: false,
    days: [template],
  });
  saveProgram(prog);
  navigateTo('today');
  pushSubPage({ type: 'workout', templateId: template.id });
};

window.genSave = function() {
  if (!_generated?.length) return;
  const goal = GOALS.find(g => g.value === _config.goal) || GOALS[1];
  persistExercises();
  const template = buildTemplate(`${goal.label} Workout`, goal);
  const prog = makeProgram({
    name: `Generated ${goal.label} Program`,
    totalWeeks: 4,
    isTemplate: false,
    days: [template],
  });
  saveProgram(prog);
  popSubPage();
};

function _rerender() {
  const el = document.getElementById('main-content');
  if (el) el.innerHTML = renderGenerator();
}
