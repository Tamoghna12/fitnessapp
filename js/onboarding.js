import { state, updateProfile } from './state.js';
import { recommendProgram, BUILTIN_PROGRAMS } from './data.js';
import { navigateTo, rerender } from './router.js';
import { saveProgram } from './state.js';

// Module-level answers accumulator — avoids embedding state in HTML attributes
let _answers = {};

export function checkOnboarding() {
  if (state.profile.onboardingComplete) {
    navigateTo('today');
    return;
  }
  showOnboarding();
}

function showOnboarding() {
  const el = document.getElementById('main-content');
  if (!el) return;
  _answers = {};
  // Hide nav during onboarding
  const nav = document.getElementById('main-nav');
  if (nav) nav.style.display = 'none';
  el.innerHTML = renderStep(1);
}

function renderStep(step) {
  const steps = [
    {
      q: "What's your main goal?",
      key: 'goals',
      multi: false,
      options: [
        { label: 'Build Strength', value: 'strength' },
        { label: 'Build Muscle', value: 'hypertrophy' },
        { label: 'Lose Fat', value: 'fat_loss' },
        { label: 'General Fitness', value: 'general' },
      ],
    },
    {
      q: 'Your experience level?',
      key: 'level',
      multi: false,
      options: [
        { label: 'New to training', value: 'beginner' },
        { label: '6 months – 2 years', value: 'intermediate' },
        { label: '2+ years', value: 'advanced' },
      ],
    },
    {
      q: 'What equipment do you have? (select all)',
      key: 'equipment',
      multi: true,
      options: [
        { label: 'Dumbbells', value: 'dumbbells' },
        { label: 'Barbell', value: 'barbell' },
        { label: 'Kettlebell', value: 'kettlebell' },
        { label: 'Pull-up bar', value: 'pull-up bar' },
        { label: 'Bodyweight only', value: 'bodyweight' },
        { label: 'Full gym', value: 'gym' },
      ],
    },
    {
      q: 'How many days per week?',
      key: 'daysPerWeek',
      multi: false,
      options: [2,3,4,5,6].map(n => ({ label: `${n} days`, value: n })),
    },
  ];

  const s = steps[step - 1];
  const selected = _answers[s.key];

  const optionsHtml = s.multi
    ? `
      <div style="display:flex;flex-wrap:wrap;gap:12px">
        ${s.options.map(opt => {
          const isSelected = Array.isArray(selected) && selected.includes(opt.value);
          return `
            <button class="onb-btn" onclick="onboardingToggle(${step}, '${s.key}', ${JSON.stringify(opt.value).replace(/"/g, '&quot;')})"
              style="background:var(--bg-card);border:2px solid ${isSelected ? 'var(--accent)' : 'var(--border)'};border-radius:var(--radius);padding:12px 20px;color:var(--text-primary);font-size:0.95rem;cursor:pointer;transition:var(--transition)">
              ${isSelected ? '✓ ' : ''}${opt.label}
            </button>
          `;
        }).join('')}
      </div>
      <button class="btn btn-accent" style="margin-top:1.5rem;min-width:120px" onclick="onboardingNext(${step})">Next →</button>
    `
    : `
      <div style="display:flex;flex-wrap:wrap;gap:12px">
        ${s.options.map(opt => `
          <button class="onb-btn" onclick="onboardingSelect(${step}, '${s.key}', ${JSON.stringify(opt.value).replace(/"/g, '&quot;')})"
            style="background:var(--bg-card);border:2px solid var(--border);border-radius:var(--radius);padding:12px 20px;color:var(--text-primary);font-size:0.95rem;cursor:pointer;transition:var(--transition)">
            ${opt.label}
          </button>
        `).join('')}
      </div>
    `;

  return `
    <div class="page active" style="max-width:600px;margin:0 auto;padding:2rem 1rem">
      <div class="page-title" style="color:var(--accent)">Welcome to Iron Protocol</div>
      <div class="page-subtitle" style="margin-bottom:2rem">Step ${step} of ${steps.length}</div>
      <div style="font-size:1.1rem;font-weight:600;margin-bottom:1.5rem">${s.q}</div>
      ${optionsHtml}
    </div>
  `;
}

// Single-select: record value and advance
window.onboardingSelect = function(step, key, value) {
  _answers[key] = value;
  _advanceStep(step);
};

// Multi-select: toggle value in array and re-render step
window.onboardingToggle = function(step, key, value) {
  if (!Array.isArray(_answers[key])) _answers[key] = [];
  const idx = _answers[key].indexOf(value);
  if (idx >= 0) {
    _answers[key].splice(idx, 1);
  } else {
    _answers[key].push(value);
  }
  document.getElementById('main-content').innerHTML = renderStep(step);
};

// Advance from multi-select step after user clicks Next
window.onboardingNext = function(step) {
  _advanceStep(step);
};

function _advanceStep(step) {
  const totalSteps = 4;
  if (step < totalSteps) {
    document.getElementById('main-content').innerHTML = renderStep(step + 1);
    return;
  }

  // Final step — save profile + recommend program
  const profilePatch = {
    goals: Array.isArray(_answers.goals) ? _answers.goals : (_answers.goals ? [_answers.goals] : ['general']),
    level: _answers.level || 'beginner',
    equipment: Array.isArray(_answers.equipment) ? _answers.equipment : (_answers.equipment ? [_answers.equipment] : []),
    daysPerWeek: _answers.daysPerWeek || 3,
    onboardingComplete: true,
  };
  updateProfile(profilePatch);

  const rec = recommendProgram(profilePatch);
  // Deep-clone the template as user's own copy so built-in templates are not mutated
  const userProg = JSON.parse(JSON.stringify({ ...rec, id: `${rec.id}-${Date.now()}`, isTemplate: false }));
  saveProgram(userProg);
  updateProfile({ activeProgramId: userProg.id });

  const nav = document.getElementById('main-nav');
  if (nav) nav.style.display = '';
  navigateTo('today');
}
