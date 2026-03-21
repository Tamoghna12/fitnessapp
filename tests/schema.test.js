import { describe, it, expect } from 'vitest';
import { makeProfile, makeProgram, makeWorkoutLog, makeSetLog, makeExerciseSlot, makeProgressionSuggestion } from '../js/schema.js';

describe('makeProfile', () => {
  it('creates profile with required defaults', () => {
    const p = makeProfile();
    expect(p.level).toBe('beginner');
    expect(p.goals).toEqual([]);
    expect(p.equipment).toEqual([]);
    expect(p.daysPerWeek).toBe(3);
    expect(p.activeProgramId).toBeNull();
    expect(p.onboardingComplete).toBe(false);
  });
  it('merges overrides', () => {
    const p = makeProfile({ level: 'advanced', daysPerWeek: 5 });
    expect(p.level).toBe('advanced');
    expect(p.daysPerWeek).toBe(5);
  });
});

describe('makeExerciseSlot', () => {
  it('has correct defaults', () => {
    const s = makeExerciseSlot({ exerciseId: 'ex1' });
    expect(s.progressionRule).toBe('none');
    expect(s.progressionCadenceWeeks).toBe(1);
    expect(s.lastProgressedWeek).toBeNull();
    expect(s.consecutivePerformanceHoldWeeks).toBe(0);
    expect(s.targetLoadKg).toBeNull();
  });
});

describe('makeWorkoutLog', () => {
  it('is immutable shape — no edit fields', () => {
    const log = makeWorkoutLog({ programId: 'p1', workoutTemplateId: 't1' });
    expect(log.sets).toEqual([]);
    expect(log.sessionRating).toBeNull();
    expect(log.completedAt).toBeNull();
  });
});

describe('makeSetLog', () => {
  it('unstarted set has correct shape', () => {
    const s = makeSetLog({ exerciseId: 'e1', exerciseSlotId: 's1', setNumber: 1 });
    expect(s.completed).toBe(false);
    expect(s.skipped).toBe(false);
    expect(s.weight).toBeNull();
    expect(s.reps).toBeNull();
  });
});
