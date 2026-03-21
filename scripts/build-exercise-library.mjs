/**
 * One-shot build script: fetches free-exercise-db + wger and writes exercise-library.js
 *
 * Run once with: node scripts/build-exercise-library.mjs
 *
 * Sources:
 *   1. yuhonas/free-exercise-db  — 800+ exercises, public domain
 *      Fields: name, primaryMuscles, secondaryMuscles, equipment, instructions, level, category, force, mechanic
 *   2. wger REST API              — additional exercises with muscle/equipment IDs
 *      Requires paginated fetching + ID→name lookup tables
 */

import { writeFileSync } from 'fs';

// ── Lookup tables ────────────────────────────────────────────────────────────

const EQUIPMENT_MAP = {
  'body only':       'bodyweight',
  'dumbbell':        'dumbbells',
  'barbell':         'barbell',
  'kettlebells':     'kettlebell',
  'cable':           'cable',
  'machine':         'machine',
  'bands':           'resistance band',
  'band':            'resistance band',
  'e-z curl bar':    'barbell',
  'exercise ball':   'exercise ball',
  'foam roll':       'bodyweight',
  'medicine ball':   'medicine ball',
  'other':           'other',
  'none':            'bodyweight',
};

const MUSCLE_MAP = {
  'abdominals':    'Core',
  'abductors':     'Abductors',
  'adductors':     'Adductors',
  'biceps':        'Biceps',
  'calves':        'Calves',
  'chest':         'Chest, Pecs',
  'forearms':      'Forearms',
  'glutes':        'Glutes',
  'hamstrings':    'Hamstrings',
  'lats':          'Lats',
  'lower back':    'Lower Back',
  'middle back':   'Back',
  'neck':          'Neck',
  'quadriceps':    'Quads',
  'shoulders':     'Shoulders',
  'traps':         'Traps',
  'triceps':       'Triceps',
  'upper back':    'Upper Back',
};

// wger muscle IDs (from /api/v2/muscle/)
const WGER_MUSCLE = {
  1: 'Biceps',  2: 'Shoulders',  3: 'Serratus', 4: 'Chest, Pecs',
  5: 'Triceps', 6: 'Core',       7: 'Calves',   8: 'Glutes',
  9: 'Traps',  10: 'Quads',     11: 'Hamstrings', 12: 'Lats',
  13: 'Biceps', 14: 'Core',     15: 'Calves',
};

// wger equipment IDs (from /api/v2/equipment/)
const WGER_EQUIP = {
  1: 'barbell', 2: 'barbell', 3: 'dumbbells', 4: 'bodyweight',
  5: 'bodyweight', 6: 'pull-up bar', 7: 'bodyweight',
  8: 'bodyweight', 9: 'bodyweight', 10: 'kettlebell', 11: 'resistance band',
};

// wger category IDs (from /api/v2/exercisecategory/)
const WGER_CATEGORY = {
  8: 'Arms', 9: 'Legs', 10: 'Abs', 11: 'Chest',
  12: 'Back', 13: 'Shoulders', 14: 'Calves', 15: 'Cardio',
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function slug(name) {
  return 'ex-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function mapEquipment(raw) {
  if (!raw) return 'bodyweight';
  const key = (Array.isArray(raw) ? raw[0] : raw).toLowerCase().trim();
  return EQUIPMENT_MAP[key] ?? key;
}

function mapMuscles(arr) {
  if (!arr || !arr.length) return '';
  return arr.map(m => MUSCLE_MAP[m.toLowerCase()] ?? m).join(', ');
}

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

// ── Source 1: free-exercise-db ───────────────────────────────────────────────

async function fetchFreeExerciseDB() {
  console.log('Fetching free-exercise-db...');
  const url = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';
  const raw = await fetchJSON(url);
  console.log(`  → ${raw.length} exercises`);

  return raw.map(ex => ({
    id: slug(ex.name),
    name: ex.name,
    muscleGroup: [
      mapMuscles(ex.primaryMuscles),
      mapMuscles(ex.secondaryMuscles),
    ].filter(Boolean).join(' / '),
    primaryMuscles: (ex.primaryMuscles || []).map(m => MUSCLE_MAP[m.toLowerCase()] ?? m),
    secondaryMuscles: (ex.secondaryMuscles || []).map(m => MUSCLE_MAP[m.toLowerCase()] ?? m),
    equipment: mapEquipment(ex.equipment),
    instructions: (ex.instructions || []).join(' '),
    level: ex.level || 'beginner',
    category: ex.category || '',
    force: ex.force || '',
    mechanic: ex.mechanic || '',
    source: 'free-exercise-db',
  }));
}

// ── Source 2: wger ───────────────────────────────────────────────────────────

async function fetchWger() {
  console.log('Fetching wger exercises (paginated)...');

  // First, get all English exercise names from the translation endpoint
  const translations = {};
  let transUrl = 'https://wger.de/api/v2/exercise/?format=json&language=2&limit=100&offset=0';
  let pageCount = 0;

  // We'll use the exercise search to get names for exercises we can resolve
  // Primary strategy: fetch exercise names via the exercise list with alias check
  // Wger's /exercise/ endpoint has 'translations' inside exerciseinfo
  // Try fetching exerciseinfo for a batch approach

  // Fetch all exercises (IDs + metadata)
  const exercises = [];
  let url = 'https://wger.de/api/v2/exercise/?format=json&language=2&limit=100&offset=0';

  while (url) {
    const page = await fetchJSON(url);
    exercises.push(...page.results);
    url = page.next;
    pageCount++;
    if (pageCount % 3 === 0) console.log(`  wger page ${pageCount}, ${exercises.length} so far...`);
  }
  console.log(`  → ${exercises.length} raw wger exercises`);

  // Fetch names via exerciseinfo for the first exercise to check structure
  // Since exerciseinfo endpoint may not be available, fall back to name lookup via search
  // Strategy: use the exercise IDs we have and fetch names via exercise search
  // But to keep it simple, we'll try exerciseinfo for each exercise in batches

  const namedExercises = [];
  const batchSize = 20;

  for (let i = 0; i < Math.min(exercises.length, 300); i += batchSize) {
    const batch = exercises.slice(i, i + batchSize);
    await Promise.all(batch.map(async ex => {
      try {
        const info = await fetchJSON(`https://wger.de/api/v2/exerciseinfo/${ex.id}/?format=json`);
        const translation = info.translations?.find(t => t.language === 2);
        if (!translation?.name) return;

        const muscles = [
          ...(info.muscles || []).map(m => WGER_MUSCLE[m.id] ?? m.name_en ?? ''),
        ].filter(Boolean);
        const secondary = [
          ...(info.muscles_secondary || []).map(m => WGER_MUSCLE[m.id] ?? m.name_en ?? ''),
        ].filter(Boolean);
        const equip = info.equipment?.[0]
          ? WGER_EQUIP[info.equipment[0].id] ?? 'bodyweight'
          : 'bodyweight';
        const cat = info.category ? WGER_CATEGORY[info.category.id] ?? '' : '';

        namedExercises.push({
          id: slug(translation.name),
          name: translation.name,
          muscleGroup: [...muscles, ...secondary].filter(Boolean).join(', ') || cat,
          primaryMuscles: muscles,
          secondaryMuscles: secondary,
          equipment: equip,
          instructions: translation.description
            ? translation.description.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
            : '',
          level: 'intermediate',
          category: cat,
          force: '',
          mechanic: '',
          source: 'wger',
        });
      } catch {
        // exerciseinfo not available for this ID — skip
      }
    }));
    console.log(`  wger exerciseinfo: ${namedExercises.length} resolved so far...`);
  }

  console.log(`  → ${namedExercises.length} wger exercises with names`);
  return namedExercises;
}

// ── Merge + deduplicate ──────────────────────────────────────────────────────

function merge(freeExDB, wgerExercises) {
  const seen = new Set();
  const out = [];

  // Normalise name for dedup comparison
  const norm = name => name.toLowerCase().replace(/[^a-z0-9]/g, '');

  for (const ex of [...freeExDB, ...wgerExercises]) {
    const key = norm(ex.name);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(ex);
  }

  // Sort by name
  out.sort((a, b) => a.name.localeCompare(b.name));
  return out;
}

// ── Write output ─────────────────────────────────────────────────────────────

function writeOutput(exercises) {
  const json = JSON.stringify(exercises, null, 0);
  const content = `// Auto-generated by scripts/build-exercise-library.mjs
// Sources: free-exercise-db (public domain) + wger REST API (open data)
// Generated: ${new Date().toISOString()}
// Total exercises: ${exercises.length}
//
// Loaded as a non-module script tag in index.html (before app.js)
// Exposes: window.EXERCISE_LIBRARY

window.EXERCISE_LIBRARY = ${json};
`;

  writeFileSync('exercise-library.js', content);
  console.log(`\nWrote exercise-library.js (${exercises.length} exercises, ${Math.round(content.length / 1024)}KB)`);
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  try {
    const [freeExDB, wgerExercises] = await Promise.all([
      fetchFreeExerciseDB(),
      fetchWger(),
    ]);

    const merged = merge(freeExDB, wgerExercises);
    console.log(`\nMerged: ${merged.length} unique exercises`);

    writeOutput(merged);
  } catch (err) {
    console.error('Build failed:', err);
    process.exit(1);
  }
}

main();
