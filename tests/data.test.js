import { describe, it, expect } from 'vitest';
import { parseDarebeeExercise, recommendProgram } from '../js/data.js';

describe('parseDarebeeExercise', () => {
  it('uses fallback sets when null', () => {
    const ex = parseDarebeeExercise({ name: 'Burpee', sets: null, reps: null, duration: null });
    expect(ex.slot.targetSets).toBe(3);
    expect(ex.slot.targetRepsMin).toBe(10);
    expect(ex.slot.targetRepsMax).toBe(12);
  });

  it('uses duration when reps null', () => {
    const ex = parseDarebeeExercise({ name: 'Plank', sets: null, reps: null, duration: '30 seconds' });
    expect(ex.slot.targetRepsMin).toBe(1);
    expect(ex.slot.targetRepsMax).toBe(1);
    expect(ex.exercise.instructions).toContain('30 seconds');
  });

  it('parses string range reps', () => {
    const ex = parseDarebeeExercise({ name: 'Push-up', sets: 3, reps: '10-15', duration: null });
    expect(ex.slot.targetRepsMin).toBe(10);
    expect(ex.slot.targetRepsMax).toBe(15);
  });

  it('parses single number reps string', () => {
    const ex = parseDarebeeExercise({ name: 'Squat', sets: 3, reps: '20', duration: null });
    expect(ex.slot.targetRepsMin).toBe(20);
    expect(ex.slot.targetRepsMax).toBe(20);
  });
});

describe('recommendProgram', () => {
  it('recommends a program matching goal + level + equipment', () => {
    const profile = { goals: ['strength'], level: 'intermediate', equipment: ['dumbbells'] };
    const result = recommendProgram(profile);
    expect(result).not.toBeNull();
    expect(result.id).toBeTruthy();
  });
});
