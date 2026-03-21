import { state, updateProfile } from './state.js';
import { recommendProgram, BUILTIN_PROGRAMS } from './data.js';
import { navigateTo, rerender } from './router.js';
import { saveProgram } from './state.js';

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
  // Hide nav during onboarding
  document.getElementById('main-nav').style.display = 'none';
  el.innerHTML = renderStep(1, {});
}

function renderStep(step, answers) {
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
  const answersJson = JSON.stringify(answers).replace(/'/g, '&#39;');

  return `
    <div class="page active" style="max-width:600px;margin:0 auto;padding:2rem 1rem">
      <div class="page-title" style="color:var(--accent)">Welcome to Iron Protocol</div>
      <div class="page-subtitle" style="margin-bottom:2rem">Step ${step} of ${steps.length}</div>
      <div style="font-size:1.1rem;font-weight:600;margin-bottom:1.5rem">${s.q}</div>
      <div style="display:flex;flex-wrap:wrap;gap:12px">
        ${s.options.map(opt => `
          <button class="onb-btn" onclick="onboardingSelect(${step}, '${s.key}', ${JSON.stringify(opt.value)}, ${s.multi}, '${answersJson}')"
            style="background:var(--bg-card);border:2px solid var(--border);border-radius:var(--radius);padding:12px 20px;color:var(--text-primary);font-size:0.95rem;cursor:pointer;transition:var(--transition)">
            ${opt.label}
          </button>
        `).join('')}
      </div>
    </div>
  `;
}

// Exposed globally for inline onclick
window.onboardingSelect = function(step, key, value, multi, answersJson) {
  const answers = JSON.parse(answersJson);
  if (multi) {
    answers[key] = answers[key] ? [...answers[key], value] : [value];
  } else {
    answers[key] = value;
  }

  const totalSteps = 4;
  if (step < totalSteps) {
    document.getElementById('main-content').innerHTML = renderStep(step + 1, answers);
    return;
  }

  // Final step — save profile + recommend program
  const profilePatch = {
    goals: Array.isArray(answers.goals) ? answers.goals : [answers.goals],
    level: answers.level || 'beginner',
    equipment: Array.isArray(answers.equipment) ? answers.equipment : [answers.equipment],
    daysPerWeek: answers.daysPerWeek || 3,
    onboardingComplete: true,
  };
  updateProfile(profilePatch);

  const rec = recommendProgram(profilePatch);
  // Deep-clone the template as user's own copy
  const userProg = { ...rec, id: `${rec.id}-${Date.now()}`, isTemplate: false };
  saveProgram(userProg);
  updateProfile({ activeProgramId: userProg.id });

  document.getElementById('main-nav').style.display = '';
  navigateTo('today');
};
