import { makeProgressionSuggestion } from './schema.js';

/** Round to nearest 0.5 */
function roundHalf(n) { return Math.round(n * 2) / 2; }

export function computeSignal(slot, sets) {
  const activeSets = sets.filter(s => !s.skipped);
  if (activeSets.length === 0) return 'skipped';

  const loggedReps = activeSets.reduce((sum, s) => sum + (s.reps || 0), 0);
  const targetReps = slot.targetSets * slot.targetRepsMax;
  const missed = Math.max(0, targetReps - loggedReps);

  if (missed === 0) return 'hit';
  if (missed <= 2) return 'partial';
  return 'missed';
}

export function applyProgressionRule(slot, signal, currentWeek) {
  const next = { ...slot };
  next.suggestedChange = 'hold';
  next.cadenceHold = false;
  next.streakWarning = false;

  if (signal === 'skipped') {
    next.consecutivePerformanceHoldWeeks = 0; // reset on skipped per spec
    return next;
  }

  // Null-load guard — always hold
  if (slot.targetLoadKg === null) {
    next.suggestedChange = 'hold';
    return next;
  }

  if (signal === 'missed') {
    next.targetLoadKg = roundHalf(slot.targetLoadKg * 0.9);
    next.suggestedChange = 'deload';
    next.consecutivePerformanceHoldWeeks = slot.consecutivePerformanceHoldWeeks + 1; // spec: Missed increments streak
    if (next.consecutivePerformanceHoldWeeks >= 3) next.streakWarning = true;
    return next;
  }

  if (signal === 'partial') {
    next.suggestedChange = 'hold';
    next.consecutivePerformanceHoldWeeks = slot.consecutivePerformanceHoldWeeks + 1;
    if (next.consecutivePerformanceHoldWeeks >= 3) next.streakWarning = true;
    return next;
  }

  // signal === 'hit'
  next.consecutivePerformanceHoldWeeks = 0; // reset on hit

  if (slot.progressionRule === 'none') {
    next.suggestedChange = 'hold';
    return next;
  }

  // Cadence check
  const weeksSinceProg = currentWeek - (slot.lastProgressedWeek ?? 0);
  if (slot.lastProgressedWeek !== null && weeksSinceProg < slot.progressionCadenceWeeks) {
    next.cadenceHold = true;
    next.suggestedChange = 'hold';
    return next;
  }

  // Apply rule
  const rule = slot.progressionRule === 'adaptive' ? 'weight' : slot.progressionRule;

  if (rule === 'weight') {
    next.targetLoadKg = slot.targetLoadKg + slot.progressionStepKg;
    next.lastProgressedWeek = currentWeek;
    next.suggestedChange = 'increase';
    next.newTargetRepsMax = null;
  } else if (rule === 'reps') {
    const ceiling = slot.targetRepsMin + 4;
    if (slot.targetRepsMax >= ceiling) {
      next.targetRepsMax = slot.targetRepsMin;
      next.targetLoadKg = slot.targetLoadKg + slot.progressionStepKg;
    } else {
      next.targetRepsMax = slot.targetRepsMax + 1;
    }
    next.newTargetRepsMax = next.targetRepsMax;
    next.lastProgressedWeek = currentWeek;
    next.suggestedChange = 'increase';
  } else if (rule === 'double') {
    next.targetLoadKg = slot.targetLoadKg + slot.progressionStepKg;
    next.targetRepsMax = slot.targetRepsMax + 1;
    next.newTargetRepsMax = next.targetRepsMax;
    next.lastProgressedWeek = currentWeek;
    next.suggestedChange = 'increase';
  }

  return next;
}

export function generateSuggestions(program, weekLogs, currentWeek) {
  const suggestions = [];

  for (const day of program.days) {
    for (const slot of day.slots) {
      const sets = weekLogs.flatMap(log =>
        log.sets.filter(s => s.exerciseSlotId === slot.id)
      );

      const signal = computeSignal(slot, sets);
      if (signal === 'skipped') continue; // skipped = no action, no suggestion
      const next = applyProgressionRule(slot, signal, currentWeek);

      // 'none' rule on Hit generates no suggestion
      if (slot.progressionRule === 'none' && signal === 'hit') continue;

      suggestions.push(makeProgressionSuggestion({
        programId: program.id,
        exerciseSlotId: slot.id,
        weekNumber: currentWeek,
        suggestedChange: next.suggestedChange,
        newTargetKg: next.targetLoadKg ?? null,
        newTargetRepsMax: next.newTargetRepsMax ?? null,
        reason: buildReason(signal, next),
      }));
    }
  }

  return suggestions;
}

function buildReason(signal, next) {
  if (next.streakWarning) return 'Same weight 3+ weeks — consider a technique check or rep range change.';
  if (next.cadenceHold) return 'Progressed recently — holding this week per cadence setting.';
  const map = {
    hit: 'All target reps hit — time to progress.',
    partial: 'Missed 1–2 reps — holding to consolidate.',
    missed: 'Missed 3+ reps — deloading to rebuild strength.',
    skipped: 'Exercise was skipped this week.',
  };
  return map[signal] ?? '';
}
