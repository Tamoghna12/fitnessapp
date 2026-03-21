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

let _generated = null;
let _bodyView = 'front'; // 'front' | 'back'

// ── Constants ─────────────────────────────────────────────────────────────────

const MUSCLE_GROUPS = [
  { label: 'Chest',      key: 'chest' },
  { label: 'Back',       key: 'back' },
  { label: 'Shoulders',  key: 'shoulders' },
  { label: 'Biceps',     key: 'biceps' },
  { label: 'Triceps',    key: 'triceps' },
  { label: 'Forearms',   key: 'forearms' },
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

// ── SVG body map ───────────────────────────────────────────────────────────────

// Muscle key → label lookup
const MUSCLE_LABEL = Object.fromEntries(MUSCLE_GROUPS.map(m => [m.key, m.label]));

function muscleClass(key) {
  return `bm-muscle${_config.muscles.includes(key) ? ' selected' : ''}`;
}

function bodyMapFront() {
  return `
  <svg class="body-map-svg" viewBox="0 0 200 430" xmlns="http://www.w3.org/2000/svg">

    <!-- ── Silhouette ── -->
    <!-- Head -->
    <ellipse class="bm-body" cx="100" cy="28" rx="20" ry="24"/>
    <!-- Neck -->
    <rect class="bm-body" x="92" y="51" width="16" height="16" rx="6"/>
    <!-- Torso -->
    <path class="bm-body" d="M60,67 L140,67 C152,67 160,75 160,87 L156,172 L144,202 L100,208 L56,202 L44,172 L40,87 C40,75 48,67 60,67 Z"/>
    <!-- Left upper arm -->
    <path class="bm-body" d="M40,80 L24,88 C16,94 12,110 14,128 L16,164 L36,168 L42,130 L44,90 Z"/>
    <!-- Right upper arm -->
    <path class="bm-body" d="M160,80 L176,88 C184,94 188,110 186,128 L184,164 L164,168 L158,130 L156,90 Z"/>
    <!-- Left forearm -->
    <path class="bm-body" d="M14,166 L6,170 C2,178 2,196 6,214 L12,240 L32,240 L36,170 Z"/>
    <!-- Right forearm -->
    <path class="bm-body" d="M186,166 L194,170 C198,178 198,196 194,214 L188,240 L168,240 L164,170 Z"/>
    <!-- Left hand -->
    <ellipse class="bm-body" cx="14" cy="251" rx="11" ry="14"/>
    <!-- Right hand -->
    <ellipse class="bm-body" cx="186" cy="251" rx="11" ry="14"/>
    <!-- Left thigh -->
    <path class="bm-body" d="M56,206 L78,204 L78,302 L52,306 Z"/>
    <!-- Right thigh -->
    <path class="bm-body" d="M144,206 L122,204 L122,302 L148,306 Z"/>
    <!-- Left calf -->
    <path class="bm-body" d="M50,308 L40,312 L36,390 L54,396 L68,390 L78,312 L74,308 Z"/>
    <!-- Right calf -->
    <path class="bm-body" d="M150,308 L160,312 L164,390 L146,396 L132,390 L122,312 L126,308 Z"/>
    <!-- Left foot -->
    <ellipse class="bm-body" cx="44" cy="400" rx="18" ry="9"/>
    <!-- Right foot -->
    <ellipse class="bm-body" cx="156" cy="400" rx="18" ry="9"/>

    <!-- ── Muscle regions ── -->
    <!-- Chest left -->
    <path class="${muscleClass('chest')}" onclick="genToggleMuscle('chest')"
      d="M62,76 C74,68 90,70 100,74 L100,128 C88,140 64,136 58,122 Z"/>
    <!-- Chest right -->
    <path class="${muscleClass('chest')}" onclick="genToggleMuscle('chest')"
      d="M138,76 C126,68 110,70 100,74 L100,128 C112,140 136,136 142,122 Z"/>

    <!-- Abs -->
    <rect class="${muscleClass('core')}" onclick="genToggleMuscle('core')"
      x="84" y="132" width="32" height="62" rx="12"/>

    <!-- Left oblique -->
    <path class="${muscleClass('core')}" onclick="genToggleMuscle('core')"
      d="M50,92 L64,92 L70,200 L46,192 Z"/>
    <!-- Right oblique -->
    <path class="${muscleClass('core')}" onclick="genToggleMuscle('core')"
      d="M150,92 L136,92 L130,200 L154,192 Z"/>

    <!-- Left shoulder -->
    <ellipse class="${muscleClass('shoulders')}" onclick="genToggleMuscle('shoulders')"
      cx="28" cy="97" rx="19" ry="17"/>
    <!-- Right shoulder -->
    <ellipse class="${muscleClass('shoulders')}" onclick="genToggleMuscle('shoulders')"
      cx="172" cy="97" rx="19" ry="17"/>

    <!-- Left bicep -->
    <ellipse class="${muscleClass('biceps')}" onclick="genToggleMuscle('biceps')"
      cx="18" cy="134" rx="13" ry="28"/>
    <!-- Right bicep -->
    <ellipse class="${muscleClass('biceps')}" onclick="genToggleMuscle('biceps')"
      cx="182" cy="134" rx="13" ry="28"/>

    <!-- Left forearm -->
    <ellipse class="${muscleClass('forearms')}" onclick="genToggleMuscle('forearms')"
      cx="13" cy="207" rx="11" ry="32"/>
    <!-- Right forearm -->
    <ellipse class="${muscleClass('forearms')}" onclick="genToggleMuscle('forearms')"
      cx="187" cy="207" rx="11" ry="32"/>

    <!-- Left quad -->
    <path class="${muscleClass('quads')}" onclick="genToggleMuscle('quads')"
      d="M56,208 L76,206 L76,300 L52,303 Z"/>
    <!-- Right quad -->
    <path class="${muscleClass('quads')}" onclick="genToggleMuscle('quads')"
      d="M144,208 L124,206 L124,300 L148,303 Z"/>

    <!-- Left calf -->
    <ellipse class="${muscleClass('calves')}" onclick="genToggleMuscle('calves')"
      cx="56" cy="352" rx="15" ry="40"/>
    <!-- Right calf -->
    <ellipse class="${muscleClass('calves')}" onclick="genToggleMuscle('calves')"
      cx="144" cy="352" rx="15" ry="40"/>

    <!-- Muscle labels (visible on selected) -->
    ${_config.muscles.includes('chest') ? '<text x="100" y="105" text-anchor="middle" font-size="7" fill="white" font-family="sans-serif" font-weight="700" pointer-events="none">CHEST</text>' : ''}
    ${_config.muscles.includes('core') ? '<text x="100" y="166" text-anchor="middle" font-size="7" fill="white" font-family="sans-serif" font-weight="700" pointer-events="none">CORE</text>' : ''}
    ${_config.muscles.includes('shoulders') ? `
      <text x="28" y="99" text-anchor="middle" font-size="5.5" fill="white" font-family="sans-serif" font-weight="700" pointer-events="none">DELT</text>
      <text x="172" y="99" text-anchor="middle" font-size="5.5" fill="white" font-family="sans-serif" font-weight="700" pointer-events="none">DELT</text>` : ''}
    ${_config.muscles.includes('biceps') ? `
      <text x="18" y="136" text-anchor="middle" font-size="5.5" fill="white" font-family="sans-serif" font-weight="700" pointer-events="none">BIC</text>
      <text x="182" y="136" text-anchor="middle" font-size="5.5" fill="white" font-family="sans-serif" font-weight="700" pointer-events="none">BIC</text>` : ''}
    ${_config.muscles.includes('quads') ? `
      <text x="56" y="257" text-anchor="middle" font-size="5.5" fill="white" font-family="sans-serif" font-weight="700" pointer-events="none">QUAD</text>
      <text x="144" y="257" text-anchor="middle" font-size="5.5" fill="white" font-family="sans-serif" font-weight="700" pointer-events="none">QUAD</text>` : ''}
  </svg>`;
}

function bodyMapBack() {
  return `
  <svg class="body-map-svg" viewBox="0 0 200 430" xmlns="http://www.w3.org/2000/svg">

    <!-- ── Silhouette ── -->
    <!-- Head -->
    <ellipse class="bm-body" cx="100" cy="28" rx="20" ry="24"/>
    <!-- Neck -->
    <rect class="bm-body" x="92" y="51" width="16" height="16" rx="6"/>
    <!-- Torso -->
    <path class="bm-body" d="M60,67 L140,67 C152,67 160,75 160,87 L156,172 L144,202 L100,208 L56,202 L44,172 L40,87 C40,75 48,67 60,67 Z"/>
    <!-- Left upper arm -->
    <path class="bm-body" d="M40,80 L24,88 C16,94 12,110 14,128 L16,164 L36,168 L42,130 L44,90 Z"/>
    <!-- Right upper arm -->
    <path class="bm-body" d="M160,80 L176,88 C184,94 188,110 186,128 L184,164 L164,168 L158,130 L156,90 Z"/>
    <!-- Left forearm -->
    <path class="bm-body" d="M14,166 L6,170 C2,178 2,196 6,214 L12,240 L32,240 L36,170 Z"/>
    <!-- Right forearm -->
    <path class="bm-body" d="M186,166 L194,170 C198,178 198,196 194,214 L188,240 L168,240 L164,170 Z"/>
    <!-- Left hand -->
    <ellipse class="bm-body" cx="14" cy="251" rx="11" ry="14"/>
    <!-- Right hand -->
    <ellipse class="bm-body" cx="186" cy="251" rx="11" ry="14"/>
    <!-- Left thigh -->
    <path class="bm-body" d="M56,206 L78,204 L78,302 L52,306 Z"/>
    <!-- Right thigh -->
    <path class="bm-body" d="M144,206 L122,204 L122,302 L148,306 Z"/>
    <!-- Left calf -->
    <path class="bm-body" d="M50,308 L40,312 L36,390 L54,396 L68,390 L78,312 L74,308 Z"/>
    <!-- Right calf -->
    <path class="bm-body" d="M150,308 L160,312 L164,390 L146,396 L132,390 L122,312 L126,308 Z"/>
    <!-- Left foot -->
    <ellipse class="bm-body" cx="44" cy="400" rx="18" ry="9"/>
    <!-- Right foot -->
    <ellipse class="bm-body" cx="156" cy="400" rx="18" ry="9"/>

    <!-- ── Muscle regions (back) ── -->
    <!-- Traps -->
    <path class="${muscleClass('traps')}" onclick="genToggleMuscle('traps')"
      d="M66,72 L100,67 L134,72 L126,114 L100,122 L74,114 Z"/>

    <!-- Upper back / rhomboids -->
    <rect class="${muscleClass('back')}" onclick="genToggleMuscle('back')"
      x="76" y="116" width="48" height="48" rx="8"/>

    <!-- Lower back -->
    <rect class="${muscleClass('lower back')}" onclick="genToggleMuscle('lower back')"
      x="76" y="166" width="48" height="32" rx="6"/>

    <!-- Left lat -->
    <path class="${muscleClass('back')}" onclick="genToggleMuscle('back')"
      d="M44,94 L68,98 L74,202 L48,196 Z"/>
    <!-- Right lat -->
    <path class="${muscleClass('back')}" onclick="genToggleMuscle('back')"
      d="M156,94 L132,98 L126,202 L152,196 Z"/>

    <!-- Left rear delt -->
    <ellipse class="${muscleClass('shoulders')}" onclick="genToggleMuscle('shoulders')"
      cx="28" cy="94" rx="19" ry="16"/>
    <!-- Right rear delt -->
    <ellipse class="${muscleClass('shoulders')}" onclick="genToggleMuscle('shoulders')"
      cx="172" cy="94" rx="19" ry="16"/>

    <!-- Left tricep -->
    <ellipse class="${muscleClass('triceps')}" onclick="genToggleMuscle('triceps')"
      cx="18" cy="134" rx="13" ry="28"/>
    <!-- Right tricep -->
    <ellipse class="${muscleClass('triceps')}" onclick="genToggleMuscle('triceps')"
      cx="182" cy="134" rx="13" ry="28"/>

    <!-- Left forearm -->
    <ellipse class="${muscleClass('forearms')}" onclick="genToggleMuscle('forearms')"
      cx="13" cy="207" rx="11" ry="32"/>
    <!-- Right forearm -->
    <ellipse class="${muscleClass('forearms')}" onclick="genToggleMuscle('forearms')"
      cx="187" cy="207" rx="11" ry="32"/>

    <!-- Left glute -->
    <path class="${muscleClass('glutes')}" onclick="genToggleMuscle('glutes')"
      d="M52,206 L80,204 L86,258 L52,262 Z"/>
    <!-- Right glute -->
    <path class="${muscleClass('glutes')}" onclick="genToggleMuscle('glutes')"
      d="M148,206 L120,204 L114,258 L148,262 Z"/>

    <!-- Left hamstring -->
    <path class="${muscleClass('hamstrings')}" onclick="genToggleMuscle('hamstrings')"
      d="M52,264 L78,260 L76,302 L50,306 Z"/>
    <!-- Right hamstring -->
    <path class="${muscleClass('hamstrings')}" onclick="genToggleMuscle('hamstrings')"
      d="M148,264 L122,260 L124,302 L150,306 Z"/>

    <!-- Left calf -->
    <ellipse class="${muscleClass('calves')}" onclick="genToggleMuscle('calves')"
      cx="56" cy="352" rx="15" ry="40"/>
    <!-- Right calf -->
    <ellipse class="${muscleClass('calves')}" onclick="genToggleMuscle('calves')"
      cx="144" cy="352" rx="15" ry="40"/>

    <!-- Labels -->
    ${_config.muscles.includes('traps') ? '<text x="100" y="94" text-anchor="middle" font-size="7" fill="white" font-family="sans-serif" font-weight="700" pointer-events="none">TRAPS</text>' : ''}
    ${_config.muscles.includes('back') ? '<text x="100" y="144" text-anchor="middle" font-size="7" fill="white" font-family="sans-serif" font-weight="700" pointer-events="none">BACK</text>' : ''}
    ${_config.muscles.includes('triceps') ? `
      <text x="18" y="136" text-anchor="middle" font-size="5.5" fill="white" font-family="sans-serif" font-weight="700" pointer-events="none">TRI</text>
      <text x="182" y="136" text-anchor="middle" font-size="5.5" fill="white" font-family="sans-serif" font-weight="700" pointer-events="none">TRI</text>` : ''}
    ${_config.muscles.includes('glutes') ? `
      <text x="64" y="234" text-anchor="middle" font-size="5.5" fill="white" font-family="sans-serif" font-weight="700" pointer-events="none">GLUTE</text>
      <text x="136" y="234" text-anchor="middle" font-size="5.5" fill="white" font-family="sans-serif" font-weight="700" pointer-events="none">GLUTE</text>` : ''}
    ${_config.muscles.includes('hamstrings') ? `
      <text x="56" y="282" text-anchor="middle" font-size="5.5" fill="white" font-family="sans-serif" font-weight="700" pointer-events="none">HAMS</text>
      <text x="144" y="282" text-anchor="middle" font-size="5.5" fill="white" font-family="sans-serif" font-weight="700" pointer-events="none">HAMS</text>` : ''}
  </svg>`;
}

// ── Render ────────────────────────────────────────────────────────────────────

export function renderGenerator() {
  if (_generated !== null) return renderResults();

  const total = typeof EXERCISE_LIBRARY !== 'undefined' ? EXERCISE_LIBRARY.length + 15 : 15;
  const selectedTags = _config.muscles.map(key =>
    `<span class="muscle-tag" onclick="genToggleMuscle('${key}')" title="Remove">${MUSCLE_LABEL[key] || key} ×</span>`
  ).join('');

  const bodyMapSvg = _bodyView === 'front' ? bodyMapFront() : bodyMapBack();

  return `
    <div class="page active">
      <div class="db-detail-back" onclick="popSubPage()">← Back</div>

      <div style="margin-bottom:1.5rem">
        <div class="page-title">Generator</div>
        <div class="page-subtitle">${total.toLocaleString()}+ exercises · tap muscles on the body map</div>
      </div>

      <div class="generator-layout">

        <!-- Left: Body Map -->
        <div class="body-map-wrap">
          <div class="body-map-toggle">
            <button class="body-map-toggle-btn${_bodyView === 'front' ? ' active' : ''}"
              onclick="genSetBodyView('front')">Front</button>
            <button class="body-map-toggle-btn${_bodyView === 'back' ? ' active' : ''}"
              onclick="genSetBodyView('back')">Back</button>
          </div>

          ${bodyMapSvg}

          <div class="muscle-tags">
            ${selectedTags || `<span style="font-size:0.7rem;color:var(--text-muted);font-family:'JetBrains Mono',monospace">tap to select</span>`}
          </div>
        </div>

        <!-- Right: Options -->
        <div class="gen-panel">

          <div class="gen-section">
            <div class="gen-section-title">Equipment <span style="opacity:0.55;text-transform:none;letter-spacing:0;font-size:0.9em">— leave empty for any</span></div>
            <div style="display:flex;flex-wrap:wrap;gap:6px">
              ${EQUIPMENT_OPTIONS.map(e => {
                const on = _config.equipment.includes(e.key);
                return `<button class="db-filter-btn${on ? ' active' : ''}" onclick="genToggleEquip('${e.key}')">${e.label}</button>`;
              }).join('')}
            </div>
          </div>

          <div class="gen-section">
            <div class="gen-section-title">Goal</div>
            <div class="goal-grid">
              ${GOALS.map(g => `
                <div class="goal-card${_config.goal === g.value ? ' selected' : ''}" onclick="genSetGoal('${g.value}')">
                  <div class="goal-card-name">${g.label}</div>
                  <div class="goal-card-meta">${g.sets}×${g.repsMin}–${g.repsMax} reps</div>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="gen-section">
            <div class="gen-section-title">Exercises</div>
            <div class="count-control">
              <button class="count-btn" onclick="genAdjustCount(-1)">−</button>
              <div>
                <div class="count-display" id="gen-count-display">${_config.count}</div>
              </div>
              <button class="count-btn" onclick="genAdjustCount(1)">+</button>
              <div class="count-label">exercises<br>in this workout</div>
            </div>
          </div>

          <button class="btn btn-accent"
            style="width:100%;padding:14px;font-size:0.95rem;font-weight:800;letter-spacing:0.5px"
            onclick="runGenerator()">
            ⚡ Generate Workout
          </button>

        </div>
      </div>
    </div>
  `;
}

function renderResults() {
  const goal = GOALS.find(g => g.value === _config.goal) || GOALS[1];

  if (_generated.length === 0) {
    return `
      <div class="page active">
        <div class="db-detail-back" onclick="genBack()">← Back</div>
        <div class="card" style="text-align:center;color:var(--text-muted);padding:2.5rem">
          No exercises found for those filters.<br>
          <button class="btn btn-ghost" style="margin-top:1rem" onclick="genBack()">Adjust filters</button>
        </div>
      </div>`;
  }

  const selectedLabels = _config.muscles.map(k => MUSCLE_LABEL[k] || k).join(', ') || 'Full body';

  return `
    <div class="page active">
      <div class="db-detail-back" onclick="genBack()">← Adjust</div>

      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1.5rem">
        <div>
          <div class="page-title" style="font-size:2rem">${_generated.length} Exercises</div>
          <div style="color:var(--text-secondary);font-size:0.82rem;margin-top:2px">
            ${goal.label} · ${goal.sets}×${goal.repsMin}–${goal.repsMax} · ${selectedLabels}
          </div>
        </div>
        <button class="btn btn-ghost" style="font-size:0.78rem;flex-shrink:0;margin-top:4px" onclick="runGenerator()">↺ Reshuffle</button>
      </div>

      <div class="card">
        ${_generated.map((ex, i) => `
          <div class="result-exercise-row">
            <div class="result-ex-num">${i + 1}</div>
            <div style="width:36px;height:36px;border-radius:8px;background:var(--bg-elevated);display:flex;align-items:center;justify-content:center;font-size:1rem;flex-shrink:0">
              ${equipIcon(ex.equipment)}
            </div>
            <div class="result-ex-info">
              <div class="result-ex-name">${ex.name}</div>
              <div class="result-ex-meta">
                ${ex.muscleGroup ? ex.muscleGroup.split('/')[0].split(',')[0].trim() : ''}${ex.equipment ? ' · ' + ex.equipment : ''}
              </div>
            </div>
            <div class="result-ex-sets">${goal.sets}×${goal.repsMin}–${goal.repsMax}</div>
            <button class="btn btn-ghost" style="font-size:0.72rem;padding:4px 8px;flex-shrink:0"
              onclick="genSwapEx(${i})" title="Swap">↺</button>
          </div>
        `).join('')}
      </div>

      <div style="display:flex;gap:10px;margin-top:0.5rem">
        <button class="btn btn-accent" style="flex:1;padding:14px;font-size:0.92rem;font-weight:800" onclick="genStartWorkout()">
          ▶ Start Workout
        </button>
        <button class="btn btn-ghost" style="padding:14px" onclick="genSave()">Save to Build</button>
      </div>
    </div>
  `;
}

function equipIcon(equipment) {
  const eq = (equipment || '').toLowerCase();
  if (eq.includes('barbell'))  return '🏋';
  if (eq.includes('dumbbell')) return '💪';
  if (eq.includes('cable'))    return '🔗';
  if (eq.includes('machine'))  return '⚙';
  if (eq.includes('kettle'))   return '🫙';
  if (eq.includes('band'))     return '🔴';
  return '🤸';
}

// ── Algorithm ─────────────────────────────────────────────────────────────────

function pickExercises(config) {
  const all = getAllExercises(state.exercises);

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

window.genSetBodyView = function(view) {
  _bodyView = view;
  _rerender();
};

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

window.genAdjustCount = function(delta) {
  _config.count = Math.min(12, Math.max(3, _config.count + delta));
  const el = document.getElementById('gen-count-display');
  if (el) el.textContent = _config.count;
};

// keep old setCount for any inline range inputs
window.genSetCount = function(n) {
  _config.count = n;
  const el = document.getElementById('gen-count-display');
  if (el) el.textContent = n;
};

window.runGenerator = function() {
  _generated = pickExercises(_config);
  _rerender();
};

window.genBack = function() {
  _generated = null;
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
