import { makeExercise, makeExerciseSlot, makeWorkoutTemplate, makeProgram } from './schema.js';

// Built-in exercise library
export const BUILTIN_EXERCISES = [
  makeExercise({ id: 'db-floor-press', name: 'DB Floor Press', muscleGroup: 'Chest, Triceps', equipment: 'dumbbells', source: 'builtin' }),
  makeExercise({ id: 'db-bent-row', name: 'DB Bent-Over Row', muscleGroup: 'Back, Biceps', equipment: 'dumbbells', source: 'builtin' }),
  makeExercise({ id: 'db-ohp', name: 'DB Overhead Press', muscleGroup: 'Shoulders, Core', equipment: 'dumbbells', source: 'builtin' }),
  makeExercise({ id: 'db-rdl', name: 'DB Romanian Deadlift', muscleGroup: 'Hamstrings, Glutes', equipment: 'dumbbells', source: 'builtin' }),
  makeExercise({ id: 'db-goblet', name: 'DB Goblet Squat', muscleGroup: 'Quads, Glutes', equipment: 'dumbbells', source: 'builtin' }),
  makeExercise({ id: 'kb-swing', name: 'KB Swing', muscleGroup: 'Posterior Chain', equipment: 'kettlebell', source: 'builtin' }),
  makeExercise({ id: 'pushup', name: 'Push-Up', muscleGroup: 'Chest, Triceps', equipment: 'bodyweight', source: 'builtin' }),
  makeExercise({ id: 'pullup', name: 'Pull-Up', muscleGroup: 'Back, Biceps', equipment: 'pull-up bar', source: 'builtin' }),
  makeExercise({ id: 'db-curl', name: 'DB Bicep Curl', muscleGroup: 'Biceps', equipment: 'dumbbells', source: 'builtin' }),
  makeExercise({ id: 'db-lunge', name: 'DB Lunge', muscleGroup: 'Quads, Glutes', equipment: 'dumbbells', source: 'builtin' }),
  makeExercise({ id: 'db-lateral', name: 'DB Lateral Raise', muscleGroup: 'Side Delts', equipment: 'dumbbells', source: 'builtin' }),
  makeExercise({ id: 'plank', name: 'Plank', muscleGroup: 'Core', equipment: 'bodyweight', source: 'builtin' }),
  makeExercise({ id: 'glute-bridge', name: 'Glute Bridge', muscleGroup: 'Glutes', equipment: 'bodyweight', source: 'builtin' }),
  makeExercise({ id: 'db-skull', name: 'DB Skull Crushers', muscleGroup: 'Triceps', equipment: 'dumbbells', source: 'builtin' }),
  makeExercise({ id: 'db-split', name: 'DB Bulgarian Split Squat', muscleGroup: 'Quads, Glutes', equipment: 'dumbbells', source: 'builtin' }),
];

// Built-in program templates
export const BUILTIN_PROGRAMS = [
  makeProgram({
    id: 'iron-protocol',
    name: 'Iron Protocol',
    totalWeeks: 12,
    isTemplate: true,
    days: [
      makeWorkoutTemplate({
        id: 'upper-a', name: 'Upper Body A', dayOfWeek: 0,
        slots: [
          makeExerciseSlot({ exerciseId: 'db-floor-press', targetSets: 4, targetRepsMin: 6, targetRepsMax: 8, targetLoadKg: 20, targetLoadDescriptor: 'heavy', progressionRule: 'weight', progressionStepKg: 2.5 }),
          makeExerciseSlot({ exerciseId: 'db-bent-row', targetSets: 4, targetRepsMin: 6, targetRepsMax: 8, targetLoadKg: 22, targetLoadDescriptor: 'heavy', progressionRule: 'weight', progressionStepKg: 2.5 }),
          makeExerciseSlot({ exerciseId: 'db-ohp', targetSets: 3, targetRepsMin: 8, targetRepsMax: 10, targetLoadKg: 14, targetLoadDescriptor: 'moderate', progressionRule: 'weight', progressionStepKg: 2.5 }),
          makeExerciseSlot({ exerciseId: 'db-curl', targetSets: 3, targetRepsMin: 10, targetRepsMax: 12, targetLoadKg: 10, targetLoadDescriptor: 'moderate', progressionRule: 'reps', progressionStepKg: 2.5 }),
          makeExerciseSlot({ exerciseId: 'db-skull', targetSets: 3, targetRepsMin: 10, targetRepsMax: 12, targetLoadKg: 8, targetLoadDescriptor: 'moderate', progressionRule: 'reps', progressionStepKg: 2.5 }),
          makeExerciseSlot({ exerciseId: 'db-lateral', targetSets: 3, targetRepsMin: 12, targetRepsMax: 15, targetLoadKg: 6, targetLoadDescriptor: 'light', progressionRule: 'reps', progressionStepKg: 2 }),
        ],
      }),
      makeWorkoutTemplate({
        id: 'lower-a', name: 'Lower Body A', dayOfWeek: 1,
        slots: [
          makeExerciseSlot({ exerciseId: 'db-goblet', targetSets: 4, targetRepsMin: 6, targetRepsMax: 8, targetLoadKg: 24, targetLoadDescriptor: 'heavy', progressionRule: 'weight', progressionStepKg: 2.5 }),
          makeExerciseSlot({ exerciseId: 'db-rdl', targetSets: 4, targetRepsMin: 8, targetRepsMax: 10, targetLoadKg: 22, targetLoadDescriptor: 'heavy', progressionRule: 'weight', progressionStepKg: 2.5 }),
          makeExerciseSlot({ exerciseId: 'kb-swing', targetSets: 4, targetRepsMin: 12, targetRepsMax: 15, targetLoadKg: 16, targetLoadDescriptor: 'moderate', progressionRule: 'weight', progressionStepKg: 2 }),
          makeExerciseSlot({ exerciseId: 'db-split', targetSets: 3, targetRepsMin: 8, targetRepsMax: 10, targetLoadKg: 14, targetLoadDescriptor: 'moderate', progressionRule: 'weight', progressionStepKg: 2.5 }),
          makeExerciseSlot({ exerciseId: 'glute-bridge', targetSets: 3, targetRepsMin: 12, targetRepsMax: 15, targetLoadKg: null, progressionRule: 'reps' }),
        ],
      }),
    ],
  }),
  makeProgram({
    id: 'full-body-3x',
    name: 'Full Body 3×/Week',
    totalWeeks: 8,
    isTemplate: true,
    days: [
      makeWorkoutTemplate({
        id: 'fb-a', name: 'Full Body A', dayOfWeek: 0,
        slots: [
          makeExerciseSlot({ exerciseId: 'db-goblet', targetSets: 3, targetRepsMin: 8, targetRepsMax: 10, targetLoadKg: 16, progressionRule: 'weight', progressionStepKg: 2.5 }),
          makeExerciseSlot({ exerciseId: 'pushup', targetSets: 3, targetRepsMin: 8, targetRepsMax: 12, targetLoadKg: null, progressionRule: 'reps' }),
          makeExerciseSlot({ exerciseId: 'db-bent-row', targetSets: 3, targetRepsMin: 8, targetRepsMax: 10, targetLoadKg: 14, progressionRule: 'weight', progressionStepKg: 2.5 }),
          makeExerciseSlot({ exerciseId: 'plank', targetSets: 3, targetRepsMin: 1, targetRepsMax: 1, targetLoadKg: null, progressionRule: 'none' }),
        ],
      }),
      makeWorkoutTemplate({
        id: 'fb-b', name: 'Full Body B', dayOfWeek: 2,
        slots: [
          makeExerciseSlot({ exerciseId: 'db-rdl', targetSets: 3, targetRepsMin: 8, targetRepsMax: 10, targetLoadKg: 14, progressionRule: 'weight', progressionStepKg: 2.5 }),
          makeExerciseSlot({ exerciseId: 'db-ohp', targetSets: 3, targetRepsMin: 8, targetRepsMax: 10, targetLoadKg: 10, progressionRule: 'weight', progressionStepKg: 2.5 }),
          makeExerciseSlot({ exerciseId: 'db-lunge', targetSets: 3, targetRepsMin: 8, targetRepsMax: 10, targetLoadKg: 10, progressionRule: 'weight', progressionStepKg: 2.5 }),
          makeExerciseSlot({ exerciseId: 'glute-bridge', targetSets: 3, targetRepsMin: 12, targetRepsMax: 15, targetLoadKg: null, progressionRule: 'reps' }),
        ],
      }),
      makeWorkoutTemplate({
        id: 'fb-c', name: 'Full Body C', dayOfWeek: 4,
        slots: [
          makeExerciseSlot({ exerciseId: 'db-goblet', targetSets: 3, targetRepsMin: 8, targetRepsMax: 10, targetLoadKg: 16, progressionRule: 'weight', progressionStepKg: 2.5 }),
          makeExerciseSlot({ exerciseId: 'db-bent-row', targetSets: 3, targetRepsMin: 8, targetRepsMax: 10, targetLoadKg: 14, progressionRule: 'weight', progressionStepKg: 2.5 }),
          makeExerciseSlot({ exerciseId: 'pushup', targetSets: 3, targetRepsMin: 8, targetRepsMax: 12, targetLoadKg: null, progressionRule: 'reps' }),
          makeExerciseSlot({ exerciseId: 'plank', targetSets: 3, targetRepsMin: 1, targetRepsMax: 1, targetLoadKg: null, progressionRule: 'none' }),
        ],
      }),
    ],
  }),
];

export function parseDarebeeExercise(dbEx) {
  const exercise = makeExercise({
    id: `db-${dbEx.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`,
    name: dbEx.name,
    muscleGroup: dbEx.muscles || '',
    equipment: dbEx.equip || 'bodyweight',
    instructions: dbEx.notes || '',
    source: 'darebee',
  });

  const targetSets = dbEx.sets != null ? Number(dbEx.sets) : 3;

  let targetRepsMin = 10, targetRepsMax = 12;
  let instructions = exercise.instructions;

  if (dbEx.reps != null) {
    const repsStr = String(dbEx.reps).trim();
    if (repsStr.includes('-')) {
      const [a, b] = repsStr.split('-').map(Number);
      targetRepsMin = a; targetRepsMax = b;
    } else {
      const n = parseInt(repsStr, 10);
      if (!isNaN(n)) targetRepsMin = targetRepsMax = n;
    }
  } else if (dbEx.duration != null) {
    targetRepsMin = 1; targetRepsMax = 1;
    instructions = instructions ? `${instructions} (${dbEx.duration})` : String(dbEx.duration);
    exercise.instructions = instructions;
  }

  const slot = makeExerciseSlot({
    exerciseId: exercise.id,
    targetSets,
    targetRepsMin,
    targetRepsMax,
    targetLoadKg: null,
    progressionRule: 'none',
  });

  return { exercise, slot };
}

export function recommendProgram(profile) {
  const { goals = [], level, equipment = [] } = profile;

  const scored = BUILTIN_PROGRAMS.map(p => {
    let score = 0;
    if (level === 'beginner' && p.id === 'full-body-3x') score += 3;
    if (level === 'intermediate' && p.id === 'iron-protocol') score += 3;
    if (level === 'advanced' && p.id === 'iron-protocol') score += 2;
    if (goals.includes('strength') && p.id === 'iron-protocol') score += 2;
    if (equipment.includes('dumbbells')) score += 1;
    return { program: p, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.program ?? BUILTIN_PROGRAMS[0];
}

export function getAllExercises(customExercises = {}) {
  const darebeeExercises = (typeof DAREBEE_WORKOUTS !== 'undefined' ? DAREBEE_WORKOUTS : [])
    .flatMap(w => (w.exercises || []).map(ex => parseDarebeeExercise(ex).exercise));

  // exercise-library.js (free-exercise-db + wger), loaded as global before app.js
  const libraryExercises = (typeof EXERCISE_LIBRARY !== 'undefined' ? EXERCISE_LIBRARY : [])
    .map(ex => makeExercise({
      id: ex.id,
      name: ex.name,
      muscleGroup: ex.muscleGroup || '',
      equipment: ex.equipment || 'bodyweight',
      instructions: ex.instructions || '',
      source: ex.source || 'library',
    }));

  // Deduplicate by name (builtin takes precedence, then library, then darebee, then custom)
  const seen = new Set();
  const out = [];
  for (const ex of [...BUILTIN_EXERCISES, ...libraryExercises, ...darebeeExercises, ...Object.values(customExercises)]) {
    const key = ex.name.toLowerCase();
    if (!seen.has(key)) { seen.add(key); out.push(ex); }
  }
  return out;
}
