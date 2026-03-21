/**
 * Community Workout Library
 * 50 workouts across bodyweight, dumbbell, barbell, kettlebell, resistance band
 *
 * Format: Two workout types:
 *   - "timed" (5 min): 5 exercises × 60s each, no rest between
 *   - "tabata" (4 min): 4 exercises × 20s work / 10s rest
 *   - "timed-10" (10 min): 10 exercises × 45s work / 15s rest
 *
 * Difficulty levels control rounds + rest between rounds.
 */

// eslint-disable-next-line no-unused-vars
var COMMUNITY_WORKOUTS = [

  // ──────────────────────────────────────────────────────────
  //  BODYWEIGHT / AT HOME (No Equipment)
  // ──────────────────────────────────────────────────────────

  {
    id: 'cw-abs-obliques',
    name: '5-Min Abs & Obliques',
    equipment: 'bodyweight',
    muscles: 'Abs, Obliques',
    format: 'timed',
    duration: 5,
    exercises: [
      { name: 'Rising Flutters', duration: '30s', muscles: 'Lower Abs' },
      { name: 'Rockers', duration: '30s', muscles: 'Abs' },
      { name: 'Toe Touchers', duration: '30s', muscles: 'Upper Abs' },
      { name: 'Penguins', duration: '30s', muscles: 'Obliques' },
      { name: 'Legs Extended Crunches', duration: '30s', muscles: 'Upper Abs' },
      { name: 'Touch and Gos', duration: '30s', muscles: 'Abs' },
      { name: 'Hip Thrusts', duration: '30s', muscles: 'Lower Abs' },
      { name: 'Bikes', duration: '30s', muscles: 'Obliques' },
      { name: 'Leg Crunches', duration: '30s', muscles: 'Abs' },
      { name: 'Busters', duration: '30s', muscles: 'Abs' },
    ],
    levels: { beginner: { rounds: 3, restMin: 3 }, intermediate: { rounds: 4, restMin: 2 }, advanced: { rounds: 4, restMin: 1 } },
  },

  {
    id: 'cw-obliques',
    name: '5-Min Oblique Workout',
    equipment: 'bodyweight',
    muscles: 'Obliques',
    format: 'timed',
    duration: 5,
    exercises: [
      { name: 'Penguins', duration: '60s', muscles: 'Obliques' },
      { name: 'Side Sky Touches', duration: '60s', muscles: 'Obliques, Upper Abs' },
      { name: 'Bikes', duration: '60s', muscles: 'Obliques' },
      { name: 'Starfish', duration: '60s', muscles: 'Obliques' },
      { name: 'Side Leg Raises', duration: '60s', muscles: 'Obliques' },
    ],
    levels: { beginner: { rounds: 3, restMin: 3 }, intermediate: { rounds: 4, restMin: 2 }, advanced: { rounds: 4, restMin: 1 } },
  },

  {
    id: 'cw-upper-abs-tabata',
    name: '4-Min Upper Abs Tabata',
    equipment: 'bodyweight',
    muscles: 'Upper Abs',
    format: 'tabata',
    duration: 4,
    exercises: [
      { name: '90 Degrees Sit Up to Toes', duration: '20s', muscles: 'Upper Abs' },
      { name: 'Speed Crunches', duration: '20s', muscles: 'Upper Abs' },
      { name: 'Legs Extended Crunches', duration: '20s', muscles: 'Upper Abs' },
      { name: 'Sky Touches', duration: '20s', muscles: 'Upper Abs' },
    ],
    levels: { beginner: { rounds: 4, restMin: 2.25 }, intermediate: { rounds: 5, restMin: 1.5 }, advanced: { rounds: 5, restMin: 0.75 } },
  },

  {
    id: 'cw-lower-abs',
    name: '5-Min Lower Ab Workout',
    equipment: 'bodyweight',
    muscles: 'Lower Abs',
    format: 'timed',
    duration: 5,
    exercises: [
      { name: 'Reverse Crunches', duration: '60s', muscles: 'Lower Abs' },
      { name: 'Hip Overs', duration: '60s', muscles: 'Lower Abs' },
      { name: 'Hip Thrusts', duration: '60s', muscles: 'Lower Abs' },
      { name: 'Leg Raises', duration: '60s', muscles: 'Lower Abs' },
      { name: 'Flutter Kicks', duration: '60s', muscles: 'Lower Abs' },
    ],
    levels: { beginner: { rounds: 3, restMin: 3 }, intermediate: { rounds: 4, restMin: 2 }, advanced: { rounds: 4, restMin: 1 } },
  },

  {
    id: 'cw-middle-abs',
    name: '5-Min Middle Ab Workout',
    equipment: 'bodyweight',
    muscles: 'Abs, Core',
    format: 'timed',
    duration: 5,
    exercises: [
      { name: 'C-Sit Hold', duration: '60s', muscles: 'Abs' },
      { name: 'Suitcase', duration: '60s', muscles: 'Abs' },
      { name: 'Mid Crunchers', duration: '60s', muscles: 'Abs' },
      { name: 'Touch and Gos', duration: '60s', muscles: 'Abs' },
      { name: 'Busters', duration: '60s', muscles: 'Abs' },
    ],
    levels: { beginner: { rounds: 3, restMin: 3 }, intermediate: { rounds: 4, restMin: 2 }, advanced: { rounds: 4, restMin: 1 } },
  },

  {
    id: 'cw-core-isometric',
    name: '5-Min Core Workout',
    equipment: 'bodyweight',
    muscles: 'Core, Abs',
    format: 'timed',
    duration: 5,
    exercises: [
      { name: 'Plank', duration: '60s', muscles: 'Core' },
      { name: '6-Inch Hold', duration: '60s', muscles: 'Lower Abs' },
      { name: 'Head Up Hold', duration: '60s', muscles: 'Upper Abs' },
      { name: 'Side Plank', duration: '60s', muscles: 'Obliques' },
      { name: 'C-Sit Hold', duration: '60s', muscles: 'Abs' },
    ],
    levels: { beginner: { rounds: 3, restMin: 3 }, intermediate: { rounds: 4, restMin: 2 }, advanced: { rounds: 4, restMin: 1 } },
  },

  {
    id: 'cw-tabata-obliques',
    name: '4-Min Tabata Oblique Workout',
    equipment: 'bodyweight',
    muscles: 'Obliques, Core',
    format: 'tabata',
    duration: 4,
    exercises: [
      { name: 'Bikes', duration: '20s', muscles: 'Obliques' },
      { name: 'Upright Windshield Wipers', duration: '20s', muscles: 'Obliques' },
      { name: 'Alternating Side Sky Touches', duration: '20s', muscles: 'Obliques' },
      { name: 'Russian Twists', duration: '20s', muscles: 'Obliques' },
    ],
    levels: { beginner: { rounds: 4, restMin: 2.25 }, intermediate: { rounds: 5, restMin: 1.5 }, advanced: { rounds: 5, restMin: 0.75 } },
  },

  {
    id: 'cw-bw-chest',
    name: '5-Min At Home Chest',
    equipment: 'bodyweight',
    muscles: 'Chest',
    format: 'timed',
    duration: 5,
    exercises: [
      { name: 'Side-to-Side Push-Up', duration: '60s', muscles: 'Chest' },
      { name: 'Hands Elevated Push-Up', duration: '60s', muscles: 'Chest' },
      { name: 'Reverse Grip Push-Up', duration: '60s', muscles: 'Upper Chest' },
      { name: 'Push-Up Hold', duration: '60s', muscles: 'Chest' },
      { name: 'Pec Crusher', duration: '60s', muscles: 'Chest' },
    ],
    levels: { beginner: { rounds: 3, restMin: 3 }, intermediate: { rounds: 4, restMin: 2 }, advanced: { rounds: 4, restMin: 1 } },
  },

  {
    id: 'cw-bw-back',
    name: '5-Min At Home Back',
    equipment: 'bodyweight',
    muscles: 'Back, Lats',
    format: 'timed',
    duration: 5,
    exercises: [
      { name: 'Reverse Snow Angels', duration: '60s', muscles: 'Lats' },
      { name: 'Seal Push-Ups', duration: '60s', muscles: 'Lats' },
      { name: 'Pulse Rows', duration: '60s', muscles: 'Lats, Rhomboids' },
      { name: 'Reachers', duration: '60s', muscles: 'Traps' },
      { name: 'Supermans', duration: '60s', muscles: 'Lower Back' },
    ],
    levels: { beginner: { rounds: 3, restMin: 3 }, intermediate: { rounds: 4, restMin: 2 }, advanced: { rounds: 4, restMin: 1 } },
  },

  {
    id: 'cw-bw-shoulders',
    name: '5-Min At Home Shoulders',
    equipment: 'bodyweight',
    muscles: 'Shoulders, Deltoids',
    format: 'timed',
    duration: 5,
    exercises: [
      { name: 'Plank-Ups', duration: '60s', muscles: 'Rear Delts' },
      { name: 'Prayer Pushes', duration: '60s', muscles: 'Front Delts' },
      { name: 'Circle Pulls', duration: '60s', muscles: 'Side Delts' },
      { name: 'Scissors', duration: '60s', muscles: 'Front Delts' },
      { name: 'Y-Ups', duration: '60s', muscles: 'Deltoids' },
    ],
    levels: { beginner: { rounds: 3, restMin: 3 }, intermediate: { rounds: 4, restMin: 2 }, advanced: { rounds: 4, restMin: 1 } },
  },

  {
    id: 'cw-bw-triceps',
    name: '5-Min At Home Triceps',
    equipment: 'bodyweight',
    muscles: 'Triceps',
    format: 'timed',
    duration: 5,
    exercises: [
      { name: 'Bodyweight Skull Crushers', duration: '60s', muscles: 'Triceps' },
      { name: 'Inner Handed Push-Ups', duration: '60s', muscles: 'Triceps' },
      { name: 'Triangle Push-Up Iso Hold', duration: '60s', muscles: 'Triceps' },
      { name: 'Body Extension', duration: '60s', muscles: 'Triceps' },
      { name: 'Bodyweight Tension Dips', duration: '60s', muscles: 'Triceps' },
    ],
    levels: { beginner: { rounds: 3, restMin: 3 }, intermediate: { rounds: 4, restMin: 2 }, advanced: { rounds: 4, restMin: 1 } },
  },

  {
    id: 'cw-tabata-biceps-bw',
    name: '4-Min At Home Bicep HIIT',
    equipment: 'bodyweight',
    muscles: 'Biceps',
    format: 'tabata',
    duration: 4,
    exercises: [
      { name: 'Alternating Angled Outer Leg Curl', duration: '20s', muscles: 'Biceps' },
      { name: 'Grabbing Reverse Curl', duration: '20s', muscles: 'Biceps' },
      { name: 'Close Leg Curl', duration: '20s', muscles: 'Biceps' },
      { name: 'Alternating Upright Leg Curl', duration: '20s', muscles: 'Biceps' },
    ],
    levels: { beginner: { rounds: 4, restMin: 2.25 }, intermediate: { rounds: 5, restMin: 1.5 }, advanced: { rounds: 5, restMin: 0.75 } },
  },

  {
    id: 'cw-tabata-back-bw',
    name: '4-Min At Home Back Tabata',
    equipment: 'bodyweight',
    muscles: 'Back, Lats',
    format: 'tabata',
    duration: 4,
    exercises: [
      { name: 'Super Rocks', duration: '20s', muscles: 'Back' },
      { name: 'Flappers', duration: '20s', muscles: 'Back' },
      { name: 'Alternating Bring Backs', duration: '20s', muscles: 'Lats' },
      { name: 'Reverse Snow Angels', duration: '20s', muscles: 'Lats' },
    ],
    levels: { beginner: { rounds: 4, restMin: 2.25 }, intermediate: { rounds: 5, restMin: 1.5 }, advanced: { rounds: 5, restMin: 0.75 } },
  },

  {
    id: 'cw-bw-quads',
    name: '5-Min Bodyweight Quads',
    equipment: 'bodyweight',
    muscles: 'Quads',
    format: 'timed',
    duration: 5,
    exercises: [
      { name: 'Jump Squat', duration: '60s', muscles: 'Quads' },
      { name: 'Close to Wide Squat Jumps', duration: '60s', muscles: 'Quads' },
      { name: 'Speed Squat', duration: '60s', muscles: 'Quads' },
      { name: 'Squat Pulses', duration: '60s', muscles: 'Quads' },
      { name: 'Squat Hold', duration: '60s', muscles: 'Quads' },
    ],
    levels: { beginner: { rounds: 3, restMin: 3 }, intermediate: { rounds: 4, restMin: 2 }, advanced: { rounds: 4, restMin: 1 } },
  },

  {
    id: 'cw-bw-legs',
    name: '5-Min At Home Legs',
    equipment: 'bodyweight',
    muscles: 'Quads, Glutes, Hamstrings, Calves',
    format: 'timed',
    duration: 5,
    exercises: [
      { name: 'Bulgarian Split Squat', duration: '60s', muscles: 'Quads, Glutes' },
      { name: 'Plie Squat Pulses', duration: '60s', muscles: 'Quads, Glutes' },
      { name: 'Switch Lunges', duration: '60s', muscles: 'Quads, Glutes' },
      { name: 'Straight-Legged Hip Raise', duration: '60s', muscles: 'Hamstrings, Glutes' },
      { name: 'Stiff Calf Jumps', duration: '60s', muscles: 'Calves' },
    ],
    levels: { beginner: { rounds: 3, restMin: 3 }, intermediate: { rounds: 4, restMin: 2 }, advanced: { rounds: 4, restMin: 1 } },
  },

  {
    id: 'cw-bw-hip-glutes',
    name: '5-Min Hip & Glute Workout',
    equipment: 'bodyweight',
    muscles: 'Hips, Glutes',
    format: 'timed',
    duration: 5,
    exercises: [
      { name: 'Donkey Hydrants', duration: '60s', muscles: 'Glutes' },
      { name: 'Hip Drives', duration: '60s', muscles: 'Glutes' },
      { name: 'Hip Bridges', duration: '60s', muscles: 'Glutes' },
      { name: '1-Legged Hip Thrust', duration: '60s', muscles: 'Glutes' },
      { name: 'Lunge Kickbacks', duration: '60s', muscles: 'Glutes' },
    ],
    levels: { beginner: { rounds: 3, restMin: 3 }, intermediate: { rounds: 4, restMin: 2 }, advanced: { rounds: 4, restMin: 1 } },
  },

  {
    id: 'cw-bw-calves',
    name: '5-Min At Home Calves',
    equipment: 'bodyweight',
    muscles: 'Calves',
    format: 'timed',
    duration: 5,
    exercises: [
      { name: 'Speed Calf Raises', duration: '60s', muscles: 'Calves' },
      { name: 'Outer Calf Raises', duration: '60s', muscles: 'Calves' },
      { name: 'Inner Calf Raises', duration: '60s', muscles: 'Calves' },
      { name: 'Heel-Ups', duration: '60s', muscles: 'Calves' },
      { name: 'Calf Squats', duration: '60s', muscles: 'Calves' },
    ],
    levels: { beginner: { rounds: 3, restMin: 3 }, intermediate: { rounds: 4, restMin: 2 }, advanced: { rounds: 4, restMin: 1 } },
  },

  {
    id: 'cw-bw-traps',
    name: '5-Min At Home Traps',
    equipment: 'bodyweight',
    muscles: 'Traps',
    format: 'timed',
    duration: 5,
    exercises: [
      { name: 'Upright Prayer Rows', duration: '60s', muscles: 'Traps' },
      { name: 'Pull Behind Shrugs', duration: '60s', muscles: 'Traps' },
      { name: 'Take Offs', duration: '60s', muscles: 'Traps' },
      { name: 'Floppy Divers', duration: '60s', muscles: 'Traps' },
      { name: 'Leg Shrugs', duration: '60s', muscles: 'Traps' },
    ],
    levels: { beginner: { rounds: 3, restMin: 3 }, intermediate: { rounds: 4, restMin: 2 }, advanced: { rounds: 4, restMin: 1 } },
  },

  {
    id: 'cw-bw-forearms',
    name: '5-Min At Home Forearms',
    equipment: 'bodyweight',
    muscles: 'Forearms',
    format: 'timed',
    duration: 5,
    exercises: [
      { name: 'Cherry Pickers', duration: '60s', muscles: 'Forearms' },
      { name: 'Inner Wrist Curls', duration: '60s', muscles: 'Forearms' },
      { name: 'Forward Reverse Wrist Curls', duration: '60s', muscles: 'Forearms' },
      { name: '180 Degree Rotations', duration: '60s', muscles: 'Forearms' },
      { name: 'Frontal Rotations', duration: '60s', muscles: 'Forearms' },
    ],
    levels: { beginner: { rounds: 3, restMin: 3 }, intermediate: { rounds: 4, restMin: 2 }, advanced: { rounds: 4, restMin: 1 } },
  },

  {
    id: 'cw-tabata-forearms',
    name: '4-Min Tabata Forearms',
    equipment: 'bodyweight',
    muscles: 'Forearms',
    format: 'tabata',
    duration: 4,
    exercises: [
      { name: 'Rear Roasters', duration: '20s', muscles: 'Forearms' },
      { name: 'Frontal Fryers', duration: '20s', muscles: 'Forearms' },
      { name: 'Push Spreads', duration: '20s', muscles: 'Forearms' },
      { name: 'Blasters', duration: '20s', muscles: 'Forearms' },
    ],
    levels: { beginner: { rounds: 4, restMin: 2.25 }, intermediate: { rounds: 5, restMin: 1.5 }, advanced: { rounds: 5, restMin: 0.75 } },
  },

  {
    id: 'cw-tabata-cardio',
    name: '4-Min Fat Burning Cardio Tabata',
    equipment: 'bodyweight',
    muscles: 'Full Body',
    format: 'tabata',
    duration: 4,
    exercises: [
      { name: 'Power Push-Ups', duration: '20s', muscles: 'Chest, Full Body' },
      { name: 'High Knee In Jumps', duration: '20s', muscles: 'Quads, Cardio' },
      { name: 'Switch Lunges', duration: '20s', muscles: 'Quads, Glutes' },
      { name: 'Close In & Outs', duration: '20s', muscles: 'Core, Cardio' },
    ],
    levels: { beginner: { rounds: 4, restMin: 2.25 }, intermediate: { rounds: 5, restMin: 1.5 }, advanced: { rounds: 5, restMin: 0.75 } },
  },

  {
    id: 'cw-bw-upper-body-10',
    name: '10-Min Upper Body (No Equipment)',
    equipment: 'bodyweight',
    muscles: 'Chest, Back, Shoulders, Arms',
    format: 'timed',
    duration: 10,
    exercises: [
      { name: 'Close to Wide Push-Ups', duration: '45s', muscles: 'Chest' },
      { name: 'Reverse Snow Angels', duration: '45s', muscles: 'Back' },
      { name: 'Plank Ups', duration: '45s', muscles: 'Shoulders' },
      { name: 'Lying Bicep Leg Curls', duration: '45s', muscles: 'Biceps' },
      { name: 'Side to Side Push-Ups', duration: '45s', muscles: 'Chest' },
      { name: 'BW Skull Crushers', duration: '45s', muscles: 'Triceps' },
      { name: 'Pulse Rows', duration: '45s', muscles: 'Back' },
      { name: 'Wrist Curls', duration: '45s', muscles: 'Forearms' },
      { name: 'Angled Downward Shoulder Push-Ups', duration: '45s', muscles: 'Shoulders' },
      { name: 'Superman Hold', duration: '45s', muscles: 'Back' },
    ],
    levels: { beginner: { rounds: 3, restMin: 3 }, intermediate: { rounds: 4, restMin: 2 }, advanced: { rounds: 4, restMin: 1 } },
  },

  // ──────────────────────────────────────────────────────────
  //  DUMBBELL
  // ──────────────────────────────────────────────────────────

  {
    id: 'cw-db-forearms',
    name: '5-Min DB Forearm Workout',
    equipment: 'dumbbells',
    muscles: 'Forearms',
    format: 'timed',
    duration: 5,
    exercises: [
      { name: 'Finger Wrist Curls', duration: '60s', muscles: 'Forearm Flexors' },
      { name: 'Fronted Rear Rotations', duration: '60s', muscles: 'Forearm Rotators' },
      { name: 'Speed 180 Side Rotations', duration: '60s', muscles: 'Forearm Pronators' },
      { name: 'Side Reverse Wrist Curls', duration: '60s', muscles: 'Forearm Extensors' },
      { name: 'Reared Front Rotations', duration: '60s', muscles: 'Forearm Rotators' },
    ],
    levels: { beginner: { rounds: 3, restMin: 3 }, intermediate: { rounds: 4, restMin: 2 }, advanced: { rounds: 4, restMin: 1 } },
  },

  {
    id: 'cw-tabata-db-biceps',
    name: '4-Min Tabata DB Biceps',
    equipment: 'dumbbells',
    muscles: 'Biceps',
    format: 'tabata',
    duration: 4,
    exercises: [
      { name: 'Reverse Zottman Curl', duration: '20s', muscles: 'Biceps' },
      { name: 'Inward Curl', duration: '20s', muscles: 'Biceps' },
      { name: 'Zottman Curl', duration: '20s', muscles: 'Biceps' },
      { name: 'Hammer Straight Curl', duration: '20s', muscles: 'Biceps' },
    ],
    levels: { beginner: { rounds: 4, restMin: 2.25 }, intermediate: { rounds: 5, restMin: 1.5 }, advanced: { rounds: 5, restMin: 0.75 } },
  },

  {
    id: 'cw-db-biceps',
    name: '5-Min DB Bicep Workout',
    equipment: 'dumbbells',
    muscles: 'Biceps',
    format: 'timed',
    duration: 5,
    exercises: [
      { name: 'Wide Curl', duration: '60s', muscles: 'Biceps' },
      { name: 'Hammer Curl', duration: '60s', muscles: 'Biceps' },
      { name: 'Drag Curl', duration: '60s', muscles: 'Biceps' },
      { name: 'Reverse Curl', duration: '60s', muscles: 'Biceps' },
      { name: 'Straight Curl', duration: '60s', muscles: 'Biceps' },
    ],
    levels: { beginner: { rounds: 3, restMin: 3 }, intermediate: { rounds: 4, restMin: 2 }, advanced: { rounds: 4, restMin: 1 } },
  },

  {
    id: 'cw-tabata-db-triceps',
    name: '4-Min Tabata DB Triceps',
    equipment: 'dumbbells',
    muscles: 'Triceps',
    format: 'tabata',
    duration: 4,
    exercises: [
      { name: 'Close Grip Skull Crusher', duration: '20s', muscles: 'Triceps' },
      { name: 'Tate Closed Press', duration: '20s', muscles: 'Triceps' },
      { name: 'Triple Threat Kickbacks', duration: '20s', muscles: 'Triceps' },
      { name: 'Palms Forward Overhead Extension', duration: '20s', muscles: 'Triceps' },
    ],
    levels: { beginner: { rounds: 4, restMin: 2.25 }, intermediate: { rounds: 5, restMin: 1.5 }, advanced: { rounds: 5, restMin: 0.75 } },
  },

  {
    id: 'cw-tabata-db-chest',
    name: '4-Min Tabata DB Chest',
    equipment: 'dumbbells',
    muscles: 'Chest',
    format: 'tabata',
    duration: 4,
    exercises: [
      { name: 'Floor Bench Twisters', duration: '20s', muscles: 'Chest' },
      { name: 'Lying Hammer Fly', duration: '20s', muscles: 'Chest' },
      { name: 'Lying Upward Fly', duration: '20s', muscles: 'Chest' },
      { name: 'Lying Valley Press', duration: '20s', muscles: 'Chest' },
    ],
    levels: { beginner: { rounds: 4, restMin: 2.25 }, intermediate: { rounds: 5, restMin: 1.5 }, advanced: { rounds: 5, restMin: 0.75 } },
  },

  {
    id: 'cw-db-chest',
    name: '5-Min DB Chest Workout',
    equipment: 'dumbbells',
    muscles: 'Chest',
    format: 'timed',
    duration: 5,
    exercises: [
      { name: 'Valley Press', duration: '60s', muscles: 'Chest' },
      { name: 'Standing Upward Fly', duration: '60s', muscles: 'Upper Chest' },
      { name: 'Reverse Wide Bench Press', duration: '60s', muscles: 'Chest' },
      { name: 'Lying Regular Fly', duration: '60s', muscles: 'Chest' },
      { name: 'Regular Wide Bench Press', duration: '60s', muscles: 'Chest' },
    ],
    levels: { beginner: { rounds: 3, restMin: 3 }, intermediate: { rounds: 4, restMin: 2 }, advanced: { rounds: 4, restMin: 1 } },
  },

  {
    id: 'cw-db-shoulders',
    name: '5-Min DB Shoulder Workout',
    equipment: 'dumbbells',
    muscles: 'Shoulders, Deltoids',
    format: 'timed',
    duration: 5,
    exercises: [
      { name: 'Rear Delt Fly', duration: '60s', muscles: 'Rear Delts' },
      { name: 'Side Lateral Raise', duration: '60s', muscles: 'Side Delts' },
      { name: 'Front Raise', duration: '60s', muscles: 'Front Delts' },
      { name: 'Upright Row', duration: '60s', muscles: 'Shoulders' },
      { name: 'Arnold Press', duration: '60s', muscles: 'Shoulders' },
    ],
    levels: { beginner: { rounds: 3, restMin: 3 }, intermediate: { rounds: 4, restMin: 2 }, advanced: { rounds: 4, restMin: 1 } },
  },

  {
    id: 'cw-db-back',
    name: '5-Min DB Back Workout',
    equipment: 'dumbbells',
    muscles: 'Back, Traps, Lats',
    format: 'timed',
    duration: 5,
    exercises: [
      { name: 'Overhead Shrugs', duration: '60s', muscles: 'Traps' },
      { name: 'Bent Over Row (Palms Forward)', duration: '60s', muscles: 'Lats' },
      { name: 'Y-Backs', duration: '60s', muscles: 'Lower Back' },
      { name: 'Straight Arm Pullover', duration: '60s', muscles: 'Lats' },
      { name: 'Weighted Superman', duration: '60s', muscles: 'Lower Back' },
    ],
    levels: { beginner: { rounds: 3, restMin: 3 }, intermediate: { rounds: 4, restMin: 2 }, advanced: { rounds: 4, restMin: 1 } },
  },

  {
    id: 'cw-db-traps',
    name: '5-Min DB Trap Workout',
    equipment: 'dumbbells',
    muscles: 'Traps',
    format: 'timed',
    duration: 5,
    exercises: [
      { name: 'Speed Front Shrugs', duration: '60s', muscles: 'Traps' },
      { name: 'Close Upright Row', duration: '60s', muscles: 'Traps' },
      { name: 'Back Shrug', duration: '60s', muscles: 'Traps' },
      { name: 'Lateral Raise Trap Squeeze', duration: '60s', muscles: 'Traps' },
      { name: 'Overhead Shrug', duration: '60s', muscles: 'Traps' },
    ],
    levels: { beginner: { rounds: 3, restMin: 2 }, intermediate: { rounds: 4, restMin: 2 }, advanced: { rounds: 4, restMin: 1 } },
  },

  {
    id: 'cw-db-legs',
    name: '5-Min DB Leg Workout',
    equipment: 'dumbbells',
    muscles: 'Quads, Hamstrings, Glutes, Calves',
    format: 'timed',
    duration: 5,
    exercises: [
      { name: 'Alternating Lunges', duration: '60s', muscles: 'Quads, Glutes' },
      { name: 'Jump Squats', duration: '60s', muscles: 'Quads' },
      { name: 'Straight Legged Deadlift', duration: '60s', muscles: 'Hamstrings' },
      { name: 'Goblet Squat', duration: '60s', muscles: 'Quads, Glutes' },
      { name: 'Plie Squat Hold Calf Raises', duration: '60s', muscles: 'Calves, Glutes' },
    ],
    levels: { beginner: { rounds: 3, restMin: 3 }, intermediate: { rounds: 4, restMin: 2 }, advanced: { rounds: 4, restMin: 1 } },
  },

  {
    id: 'cw-db-calves',
    name: '5-Min DB Calf Workout',
    equipment: 'dumbbells',
    muscles: 'Calves',
    format: 'timed',
    duration: 5,
    exercises: [
      { name: 'Triple Threats', duration: '60s', muscles: 'Calves' },
      { name: 'Stiff Calf Jumps', duration: '60s', muscles: 'Calves' },
      { name: 'Downward Outer Calf Raises', duration: '60s', muscles: 'Calves' },
      { name: 'Calf Squat', duration: '60s', muscles: 'Calves' },
      { name: 'Tip Toe Pulses', duration: '60s', muscles: 'Calves' },
    ],
    levels: { beginner: { rounds: 3, restMin: 3 }, intermediate: { rounds: 4, restMin: 2 }, advanced: { rounds: 4, restMin: 1 } },
  },

  // ──────────────────────────────────────────────────────────
  //  BARBELL
  // ──────────────────────────────────────────────────────────

  {
    id: 'cw-bb-shoulders',
    name: '5-Min Barbell Shoulders',
    equipment: 'barbell',
    muscles: 'Shoulders, Deltoids',
    format: 'timed',
    duration: 5,
    exercises: [
      { name: 'Front Raise', duration: '60s', muscles: 'Front Delts' },
      { name: 'Overhead Press', duration: '60s', muscles: 'Shoulders' },
      { name: 'Landmine Face Pull', duration: '60s', muscles: 'Rear Delts' },
      { name: 'Landmine Bent Arm Side Raise', duration: '60s', muscles: 'Side Delts' },
      { name: 'Over Behind Press', duration: '60s', muscles: 'Shoulders' },
    ],
    levels: { beginner: { rounds: 3, restMin: 3 }, intermediate: { rounds: 4, restMin: 2 }, advanced: { rounds: 4, restMin: 1 } },
  },

  {
    id: 'cw-bb-biceps',
    name: '5-Min Barbell Biceps',
    equipment: 'barbell',
    muscles: 'Biceps',
    format: 'timed',
    duration: 5,
    exercises: [
      { name: 'Regular Curl', duration: '60s', muscles: 'Biceps' },
      { name: 'Reverse Curl', duration: '60s', muscles: 'Biceps, Forearms' },
      { name: 'Drag Curl', duration: '60s', muscles: 'Biceps' },
      { name: 'Cross Arm Landmine Curl', duration: '60s', muscles: 'Biceps' },
      { name: 'Landmine Concentration Curl', duration: '60s', muscles: 'Biceps' },
    ],
    levels: { beginner: { rounds: 3, restMin: 3 }, intermediate: { rounds: 4, restMin: 2 }, advanced: { rounds: 4, restMin: 1 } },
  },

  {
    id: 'cw-bb-triceps',
    name: '5-Min Barbell Triceps',
    equipment: 'barbell',
    muscles: 'Triceps',
    format: 'timed',
    duration: 5,
    exercises: [
      { name: 'Overhead Extension', duration: '60s', muscles: 'Triceps' },
      { name: '1-Arm Landmine Extension', duration: '60s', muscles: 'Triceps' },
      { name: '1-Arm Landmine Kickback', duration: '60s', muscles: 'Triceps' },
      { name: 'Skull Crushers', duration: '60s', muscles: 'Triceps' },
      { name: 'Close Grip Bench Press', duration: '60s', muscles: 'Triceps' },
    ],
    levels: { beginner: { rounds: 3, restMin: 3 }, intermediate: { rounds: 4, restMin: 2 }, advanced: { rounds: 4, restMin: 1 } },
  },

  {
    id: 'cw-bb-chest',
    name: '5-Min Barbell Chest',
    equipment: 'barbell',
    muscles: 'Chest',
    format: 'timed',
    duration: 5,
    exercises: [
      { name: 'Standing Alternating Landmine Fly', duration: '60s', muscles: 'Chest' },
      { name: 'Standing Alternating Press', duration: '60s', muscles: 'Chest' },
      { name: '1-Arm Standing Upward Fly', duration: '60s', muscles: 'Upper Chest' },
      { name: 'Standing Landmine Press', duration: '60s', muscles: 'Chest' },
      { name: 'Wide Grip Floor Press', duration: '60s', muscles: 'Chest' },
    ],
    levels: { beginner: { rounds: 3, restMin: 3 }, intermediate: { rounds: 4, restMin: 2 }, advanced: { rounds: 4, restMin: 1 } },
  },

  {
    id: 'cw-bb-back',
    name: '5-Min Barbell Back',
    equipment: 'barbell',
    muscles: 'Back, Traps, Lats',
    format: 'timed',
    duration: 5,
    exercises: [
      { name: 'Landmine Upright Row', duration: '60s', muscles: 'Traps' },
      { name: '1-Arm Landmine Row', duration: '60s', muscles: 'Lats' },
      { name: 'Front Shrug', duration: '60s', muscles: 'Traps' },
      { name: 'Underhand Row', duration: '60s', muscles: 'Lats' },
      { name: 'Good Morning', duration: '60s', muscles: 'Lower Back' },
    ],
    levels: { beginner: { rounds: 3, restMin: 3 }, intermediate: { rounds: 4, restMin: 2 }, advanced: { rounds: 4, restMin: 1 } },
  },

  {
    id: 'cw-bb-legs',
    name: '5-Min Barbell Legs',
    equipment: 'barbell',
    muscles: 'Quads, Glutes, Hamstrings',
    format: 'timed',
    duration: 5,
    exercises: [
      { name: 'Front Squat', duration: '60s', muscles: 'Quads' },
      { name: 'Alternating Lunges', duration: '60s', muscles: 'Quads, Glutes' },
      { name: 'Jefferson Squat', duration: '60s', muscles: 'Quads, Glutes' },
      { name: 'Romanian Deadlift', duration: '60s', muscles: 'Hamstrings' },
      { name: 'Back Squat', duration: '60s', muscles: 'Quads, Glutes' },
    ],
    levels: { beginner: { rounds: 3, restMin: 3 }, intermediate: { rounds: 4, restMin: 2 }, advanced: { rounds: 4, restMin: 1 } },
  },

  // ──────────────────────────────────────────────────────────
  //  KETTLEBELL
  // ──────────────────────────────────────────────────────────

  {
    id: 'cw-kb-traps',
    name: '5-Min KB Trap Workout',
    equipment: 'kettlebell',
    muscles: 'Traps',
    format: 'timed',
    duration: 5,
    exercises: [
      { name: 'Front Shrug', duration: '60s', muscles: 'Traps' },
      { name: 'Closed Bent Trap Raise', duration: '60s', muscles: 'Traps' },
      { name: 'Close Grip Upright Row', duration: '60s', muscles: 'Traps' },
      { name: 'Overhead Shrug', duration: '60s', muscles: 'Traps' },
      { name: 'Side to Behind Shrug', duration: '60s', muscles: 'Traps' },
    ],
    levels: { beginner: { rounds: 3, restMin: 3 }, intermediate: { rounds: 4, restMin: 2 }, advanced: { rounds: 4, restMin: 1 } },
  },

  {
    id: 'cw-kb-back',
    name: '5-Min KB Back Workout',
    equipment: 'kettlebell',
    muscles: 'Back, Lats',
    format: 'timed',
    duration: 5,
    exercises: [
      { name: 'Power Close Row', duration: '60s', muscles: 'Back' },
      { name: '1-Arm Underhand Row', duration: '60s', muscles: 'Lats' },
      { name: 'Alternating Y-Back', duration: '60s', muscles: 'Lower Back' },
      { name: 'Lat Pullover', duration: '60s', muscles: 'Lats' },
      { name: 'Top Bottom Supermans', duration: '60s', muscles: 'Lower Back' },
    ],
    levels: { beginner: { rounds: 3, restMin: 3 }, intermediate: { rounds: 4, restMin: 2 }, advanced: { rounds: 4, restMin: 1 } },
  },

  {
    id: 'cw-kb-triceps',
    name: '5-Min KB Tricep Workout',
    equipment: 'kettlebell',
    muscles: 'Triceps',
    format: 'timed',
    duration: 5,
    exercises: [
      { name: 'Closed Tate Press', duration: '60s', muscles: 'Triceps' },
      { name: 'Close Grip Bench Press', duration: '60s', muscles: 'Triceps' },
      { name: 'Close Grip Skull Crusher', duration: '60s', muscles: 'Triceps' },
      { name: 'Alternating Kickback', duration: '60s', muscles: 'Triceps' },
      { name: 'Close Grip Overhead Extension', duration: '60s', muscles: 'Triceps' },
    ],
    levels: { beginner: { rounds: 3, restMin: 3 }, intermediate: { rounds: 4, restMin: 2 }, advanced: { rounds: 4, restMin: 1 } },
  },

  {
    id: 'cw-kb-biceps',
    name: '5-Min KB Bicep Workout',
    equipment: 'kettlebell',
    muscles: 'Biceps',
    format: 'timed',
    duration: 5,
    exercises: [
      { name: 'Straight Curl', duration: '60s', muscles: 'Biceps' },
      { name: 'Upright Curl', duration: '60s', muscles: 'Biceps' },
      { name: 'Concentration Curl', duration: '60s', muscles: 'Biceps' },
      { name: '1-Arm Frozen Drag Curl', duration: '60s', muscles: 'Biceps' },
      { name: 'Pass Curls', duration: '60s', muscles: 'Biceps' },
    ],
    levels: { beginner: { rounds: 3, restMin: 3 }, intermediate: { rounds: 4, restMin: 2 }, advanced: { rounds: 4, restMin: 1 } },
  },

  {
    id: 'cw-kb-shoulders',
    name: '5-Min KB Shoulder Workout',
    equipment: 'kettlebell',
    muscles: 'Shoulders, Deltoids',
    format: 'timed',
    duration: 5,
    exercises: [
      { name: 'Alternating Slicer', duration: '60s', muscles: 'Rear Delts' },
      { name: 'Bent Face Pull', duration: '60s', muscles: 'Rear Delts' },
      { name: 'Close-Grip Overhead Press', duration: '60s', muscles: 'Shoulders' },
      { name: 'Alternating Side Raise', duration: '60s', muscles: 'Side Delts' },
      { name: 'Front Raise', duration: '60s', muscles: 'Front Delts' },
    ],
    levels: { beginner: { rounds: 3, restMin: 3 }, intermediate: { rounds: 4, restMin: 2 }, advanced: { rounds: 4, restMin: 1 } },
  },

  // ──────────────────────────────────────────────────────────
  //  RESISTANCE BAND
  // ──────────────────────────────────────────────────────────

  {
    id: 'cw-rb-chest',
    name: '5-Min Band Chest Workout',
    equipment: 'resistance band',
    muscles: 'Chest',
    format: 'timed',
    duration: 5,
    exercises: [
      { name: 'Reverse Grip Push-Up', duration: '60s', muscles: 'Upper Chest' },
      { name: 'Standing Upward Fly', duration: '60s', muscles: 'Upper Chest' },
      { name: 'Chest Press', duration: '60s', muscles: 'Chest' },
      { name: 'Chest Fly', duration: '60s', muscles: 'Chest' },
      { name: 'Valley Press', duration: '60s', muscles: 'Chest' },
    ],
    levels: { beginner: { rounds: 3, restMin: 3 }, intermediate: { rounds: 4, restMin: 2 }, advanced: { rounds: 4, restMin: 1 } },
  },

  {
    id: 'cw-rb-legs',
    name: '5-Min Band Leg Workout',
    equipment: 'resistance band',
    muscles: 'Quads, Hamstrings, Glutes, Calves',
    format: 'timed',
    duration: 5,
    exercises: [
      { name: 'Alternating Lunges', duration: '60s', muscles: 'Quads, Glutes' },
      { name: 'Pull Throughs', duration: '60s', muscles: 'Glutes' },
      { name: 'Straight Legged Deadlift', duration: '60s', muscles: 'Hamstrings' },
      { name: '1-Legged Leaning Calf Lift', duration: '60s', muscles: 'Calves' },
      { name: 'Overhead Squat', duration: '60s', muscles: 'Quads' },
    ],
    levels: { beginner: { rounds: 3, restMin: 3 }, intermediate: { rounds: 4, restMin: 2 }, advanced: { rounds: 4, restMin: 1 } },
  },

  {
    id: 'cw-rb-shoulders',
    name: '5-Min Band Shoulder Workout',
    equipment: 'resistance band',
    muscles: 'Shoulders, Deltoids',
    format: 'timed',
    duration: 5,
    exercises: [
      { name: 'Reverse Fly', duration: '60s', muscles: 'Rear Delts' },
      { name: 'Front Raise', duration: '60s', muscles: 'Front Delts' },
      { name: 'Shoulder Press', duration: '60s', muscles: 'Shoulders' },
      { name: 'Side Raise', duration: '60s', muscles: 'Side Delts' },
      { name: 'Slicers', duration: '60s', muscles: 'Rear Delts' },
    ],
    levels: { beginner: { rounds: 3, restMin: 3 }, intermediate: { rounds: 4, restMin: 2 }, advanced: { rounds: 4, restMin: 1 } },
  },

  {
    id: 'cw-rb-triceps',
    name: '5-Min Band Tricep Workout',
    equipment: 'resistance band',
    muscles: 'Triceps',
    format: 'timed',
    duration: 5,
    exercises: [
      { name: 'Overhead Tricep Extension', duration: '60s', muscles: 'Triceps' },
      { name: 'Tricep Kickbacks', duration: '60s', muscles: 'Triceps' },
      { name: 'Tricep Pushdown', duration: '60s', muscles: 'Triceps' },
      { name: 'Reverse Grip Tricep Pushdown', duration: '60s', muscles: 'Triceps' },
      { name: 'Triangle Push-Ups', duration: '60s', muscles: 'Triceps' },
    ],
    levels: { beginner: { rounds: 3, restMin: 3 }, intermediate: { rounds: 4, restMin: 2 }, advanced: { rounds: 4, restMin: 1 } },
  },

  {
    id: 'cw-rb-biceps',
    name: '5-Min Band Bicep Workout',
    equipment: 'resistance band',
    muscles: 'Biceps',
    format: 'timed',
    duration: 5,
    exercises: [
      { name: 'Alternating Close Curl', duration: '60s', muscles: 'Biceps' },
      { name: 'Reverse Curl', duration: '60s', muscles: 'Biceps' },
      { name: 'Wide Curl', duration: '60s', muscles: 'Biceps' },
      { name: 'Drag Curl', duration: '60s', muscles: 'Biceps' },
      { name: 'Inward Curl', duration: '60s', muscles: 'Biceps' },
    ],
    levels: { beginner: { rounds: 3, restMin: 3 }, intermediate: { rounds: 4, restMin: 2 }, advanced: { rounds: 4, restMin: 1 } },
  },

  {
    id: 'cw-rb-back',
    name: '5-Min Band Back Workout',
    equipment: 'resistance band',
    muscles: 'Back, Lats',
    format: 'timed',
    duration: 5,
    exercises: [
      { name: 'Lat Pulldown', duration: '60s', muscles: 'Lats' },
      { name: 'Straight-Arm Pulldown', duration: '60s', muscles: 'Lats' },
      { name: 'Underhand Row', duration: '60s', muscles: 'Lats' },
      { name: 'Close Grip Upright Row', duration: '60s', muscles: 'Traps' },
      { name: 'Y-Back Benders', duration: '60s', muscles: 'Lower Back' },
    ],
    levels: { beginner: { rounds: 3, restMin: 3 }, intermediate: { rounds: 4, restMin: 2 }, advanced: { rounds: 4, restMin: 1 } },
  },

];
