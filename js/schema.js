function uid() { return Math.random().toString(36).slice(2, 10); }

export function makeProfile(overrides = {}) {
  return {
    level: 'beginner',
    goals: [],
    equipment: [],
    daysPerWeek: 3,
    activeProgramId: null,
    onboardingComplete: false,
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

export function makeExerciseSlot(overrides = {}) {
  return {
    id: uid(),
    exerciseId: '',
    targetSets: 3,
    targetRepsMin: 8,
    targetRepsMax: 12,
    targetLoadDescriptor: null,
    targetLoadKg: null,
    progressionRule: 'none',
    progressionStepKg: 2.5,
    progressionCadenceWeeks: 1,
    lastProgressedWeek: null,
    consecutivePerformanceHoldWeeks: 0,
    ...overrides,
  };
}

export function makeWorkoutTemplate(overrides = {}) {
  return {
    id: uid(),
    name: '',
    dayOfWeek: 0,
    slots: [],
    ...overrides,
  };
}

export function makeProgram(overrides = {}) {
  return {
    id: uid(),
    name: '',
    totalWeeks: 8,
    isTemplate: false,
    updatedAt: new Date().toISOString(),
    days: [],
    ...overrides,
  };
}

export function makeWorkoutLog(overrides = {}) {
  return {
    id: uid(),
    date: new Date().toISOString(),
    programId: '',
    workoutTemplateId: '',
    sets: [],
    notes: '',
    sessionRating: null,
    completedAt: null,
    ...overrides,
  };
}

export function makeSetLog(overrides = {}) {
  return {
    exerciseId: '',
    exerciseSlotId: '',
    setNumber: 1,
    weight: null,
    reps: null,
    completed: false,
    skipped: false,
    ...overrides,
  };
}

export function makeProgressionSuggestion(overrides = {}) {
  return {
    id: uid(),
    programId: '',
    exerciseSlotId: '',
    weekNumber: 0,
    suggestedChange: 'hold',
    newTargetKg: null,
    newTargetRepsMax: null,
    reason: '',
    accepted: null,
    ...overrides,
  };
}

export function makeExercise(overrides = {}) {
  return {
    id: uid(),
    name: '',
    muscleGroup: '',
    equipment: '',
    instructions: '',
    source: 'custom',
    ...overrides,
  };
}
