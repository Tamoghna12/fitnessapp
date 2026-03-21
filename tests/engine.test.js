import { describe, it, expect } from 'vitest';
import { computeSignal, applyProgressionRule, generateSuggestions } from '../js/engine.js';
import { makeExerciseSlot, makeSetLog, makeWorkoutLog } from '../js/schema.js';

describe('computeSignal', () => {
  const slot = makeExerciseSlot({ targetSets: 4, targetRepsMax: 8 }); // target = 32 reps

  it('Hit when all reps logged', () => {
    const sets = Array.from({ length: 4 }, (_, i) =>
      makeSetLog({ setNumber: i+1, reps: 8, completed: true, skipped: false })
    );
    expect(computeSignal(slot, sets)).toBe('hit');
  });

  it('Partial when 1-2 reps missed', () => {
    const sets = [
      makeSetLog({ reps: 8, completed: true, skipped: false }),
      makeSetLog({ reps: 8, completed: true, skipped: false }),
      makeSetLog({ reps: 8, completed: true, skipped: false }),
      makeSetLog({ reps: 7, completed: true, skipped: false }), // 1 missed
    ];
    expect(computeSignal(slot, sets)).toBe('partial');
  });

  it('Missed when 3+ reps missed', () => {
    const sets = [
      makeSetLog({ reps: 8, completed: true, skipped: false }),
      makeSetLog({ reps: 5, completed: true, skipped: false }), // 3 missed
      makeSetLog({ reps: 8, completed: true, skipped: false }),
      makeSetLog({ reps: 8, completed: true, skipped: false }),
    ];
    expect(computeSignal(slot, sets)).toBe('missed');
  });

  it('Skipped when all sets are skipped', () => {
    const sets = Array.from({ length: 4 }, () =>
      makeSetLog({ completed: false, skipped: true })
    );
    expect(computeSignal(slot, sets)).toBe('skipped');
  });

  it('excludes skipped sets from rep count', () => {
    const sets = [
      makeSetLog({ reps: 8, completed: true, skipped: false }),
      makeSetLog({ completed: false, skipped: true }),
      makeSetLog({ reps: 8, completed: true, skipped: false }),
      makeSetLog({ reps: 8, completed: true, skipped: false }),
    ];
    // Only 3 sets × 8 = 24 logged vs target 32 → missed 8 → 'missed'
    expect(computeSignal(slot, sets)).toBe('missed');
  });
});

describe('applyProgressionRule', () => {
  it('weight rule increases targetLoadKg', () => {
    const slot = makeExerciseSlot({ progressionRule: 'weight', targetLoadKg: 20, progressionStepKg: 2.5 });
    const result = applyProgressionRule(slot, 'hit', 5);
    expect(result.targetLoadKg).toBe(22.5);
  });

  it('reps rule increases targetRepsMax up to ceiling', () => {
    const slot = makeExerciseSlot({ progressionRule: 'reps', targetRepsMin: 8, targetRepsMax: 10, targetLoadKg: 20, progressionStepKg: 2.5 });
    const result = applyProgressionRule(slot, 'hit', 5);
    expect(result.targetRepsMax).toBe(11);
    expect(result.targetLoadKg).toBe(20); // no load change yet
  });

  it('reps rule resets and increases load at ceiling', () => {
    const slot = makeExerciseSlot({ progressionRule: 'reps', targetRepsMin: 8, targetRepsMax: 12, targetLoadKg: 20, progressionStepKg: 2.5 });
    // ceiling = targetRepsMin + 4 = 12; already at ceiling
    const result = applyProgressionRule(slot, 'hit', 5);
    expect(result.targetRepsMax).toBe(8); // reset to current targetRepsMin
    expect(result.targetLoadKg).toBe(22.5);
  });

  it('double rule increases both load and reps', () => {
    const slot = makeExerciseSlot({ progressionRule: 'double', targetLoadKg: 20, targetRepsMax: 10, progressionStepKg: 2.5 });
    const result = applyProgressionRule(slot, 'hit', 5);
    expect(result.targetLoadKg).toBe(22.5);
    expect(result.targetRepsMax).toBe(11);
  });

  it('deload rounds to nearest 0.5kg', () => {
    const slot = makeExerciseSlot({ progressionRule: 'weight', targetLoadKg: 21, progressionStepKg: 2.5 });
    const result = applyProgressionRule(slot, 'missed', 5);
    // 21 × 0.9 = 18.9 → rounds to 19.0
    expect(result.targetLoadKg).toBe(19);
  });

  it('null-load slot always holds regardless of signal', () => {
    const slot = makeExerciseSlot({ targetLoadKg: null, progressionRule: 'weight' });
    const result = applyProgressionRule(slot, 'missed', 5);
    expect(result.targetLoadKg).toBeNull();
    expect(result.suggestedChange).toBe('hold');
  });

  it('cadence hold fires when cadence not elapsed', () => {
    const slot = makeExerciseSlot({ progressionRule: 'weight', targetLoadKg: 20, lastProgressedWeek: 4, progressionCadenceWeeks: 2 });
    const result = applyProgressionRule(slot, 'hit', 5); // currentWeek=5, 5-4=1 < 2
    expect(result.targetLoadKg).toBe(20); // no change
    expect(result.cadenceHold).toBe(true);
  });

  it('streak counter increments on partial', () => {
    const slot = makeExerciseSlot({ consecutivePerformanceHoldWeeks: 1, targetLoadKg: 20, progressionRule: 'weight' });
    const result = applyProgressionRule(slot, 'partial', 5);
    expect(result.consecutivePerformanceHoldWeeks).toBe(2);
  });

  it('streak counter increments on missed', () => {
    const slot = makeExerciseSlot({ consecutivePerformanceHoldWeeks: 1, targetLoadKg: 20, progressionRule: 'weight', progressionStepKg: 2.5 });
    const result = applyProgressionRule(slot, 'missed', 5);
    expect(result.consecutivePerformanceHoldWeeks).toBe(2);
    expect(result.suggestedChange).toBe('deload');
  });

  it('streak counter resets on hit', () => {
    const slot = makeExerciseSlot({ consecutivePerformanceHoldWeeks: 2, targetLoadKg: 20, progressionRule: 'weight', progressionStepKg: 2.5 });
    const result = applyProgressionRule(slot, 'hit', 5);
    expect(result.consecutivePerformanceHoldWeeks).toBe(0);
  });

  it('streak counter resets to 0 on skipped', () => {
    const slot = makeExerciseSlot({ consecutivePerformanceHoldWeeks: 2, targetLoadKg: 20, progressionRule: 'weight' });
    const result = applyProgressionRule(slot, 'skipped', 5);
    expect(result.consecutivePerformanceHoldWeeks).toBe(0);
  });
});

describe('generateSuggestions', () => {
  it('none rule on Hit generates no suggestion', () => {
    const slot = makeExerciseSlot({ id: 's1', progressionRule: 'none', targetSets: 3, targetRepsMax: 10 });
    const program = { id: 'p1', days: [{ slots: [slot] }] };
    const sets = Array.from({ length: 3 }, (_, i) =>
      makeSetLog({ exerciseSlotId: 's1', setNumber: i+1, reps: 10, completed: true, skipped: false })
    );
    const log = makeWorkoutLog({ programId: 'p1', sets });
    const suggestions = generateSuggestions(program, [log], 5);
    expect(suggestions).toHaveLength(0);
  });

  it('skipped exercise generates no suggestion', () => {
    const slot = makeExerciseSlot({ id: 's1', progressionRule: 'weight', targetSets: 3, targetRepsMax: 10, targetLoadKg: 20 });
    const program = { id: 'p1', days: [{ slots: [slot] }] };
    const sets = Array.from({ length: 3 }, () =>
      makeSetLog({ exerciseSlotId: 's1', skipped: true, completed: false })
    );
    const log = makeWorkoutLog({ programId: 'p1', sets });
    const suggestions = generateSuggestions(program, [log], 5);
    expect(suggestions).toHaveLength(0);
  });
});

describe('reps-progression newTargetRepsMax acceptance', () => {
  it('applyProgressionRule reps rule sets newTargetRepsMax below ceiling', () => {
    const slot = makeExerciseSlot({ progressionRule: 'reps', targetRepsMin: 8, targetRepsMax: 10, targetLoadKg: 20, progressionStepKg: 2.5 });
    const result = applyProgressionRule(slot, 'hit', 5);
    expect(result.newTargetRepsMax).toBe(11);
    expect(result.targetRepsMax).toBe(11);
  });

  it('applyProgressionRule double rule sets newTargetRepsMax', () => {
    const slot = makeExerciseSlot({ progressionRule: 'double', targetRepsMin: 8, targetRepsMax: 10, targetLoadKg: 20, progressionStepKg: 2.5 });
    const result = applyProgressionRule(slot, 'hit', 5);
    expect(result.newTargetRepsMax).toBe(11);
    expect(result.targetLoadKg).toBe(22.5);
  });

  it('generateSuggestions carries newTargetRepsMax for reps rule', () => {
    const slot = makeExerciseSlot({ id: 's1', progressionRule: 'reps', targetRepsMin: 8, targetRepsMax: 10, targetSets: 3, targetLoadKg: 20, progressionStepKg: 2.5 });
    const program = { id: 'p1', days: [{ slots: [slot] }] };
    const sets = Array.from({ length: 3 }, (_, i) =>
      makeSetLog({ exerciseSlotId: 's1', setNumber: i+1, reps: 10, completed: true, skipped: false })
    );
    const log = makeWorkoutLog({ programId: 'p1', sets });
    const suggestions = generateSuggestions(program, [log], 5);
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].newTargetRepsMax).toBe(11);
  });
});
