import { state, saveState } from '../state.js';

function saveCalcProfile(profile) {
  state._calcProfile = profile;
  saveState();
}

function getCalcProfile() {
  return state._calcProfile || {};
}

export function renderCalculators() {
  const p = getCalcProfile();

  return `
    <div class="page active">
      <div class="page-title">Calculators</div>
      <div class="page-subtitle">BMR · TDEE · Body Fat · BMI · FFMI · Macros · Heart Rate Zones — all evidence-based formulas</div>

      <div class="calc-hero">
        <!-- Input Panel -->
        <div class="calc-input-panel">
          <div class="section-label" style="margin-bottom:1rem">📋 Your Profile</div>
          <div class="calc-form-grid">
            <div class="calc-field">
              <label>Age</label>
              <input class="calc-input" type="number" id="calc-age" placeholder="e.g. 28" min="14" max="100" value="${p.age || ''}">
            </div>
            <div class="calc-field">
              <label>Biological Sex</label>
              <select class="calc-select" id="calc-sex" onchange="calcToggleHip()">
                <option value="male" ${p.sex === 'male' || !p.sex ? 'selected' : ''}>Male</option>
                <option value="female" ${p.sex === 'female' ? 'selected' : ''}>Female</option>
              </select>
            </div>
            <div class="calc-field">
              <label>Height (cm)</label>
              <input class="calc-input" type="number" id="calc-height" placeholder="e.g. 178" min="100" max="250" value="${p.heightCm || ''}">
            </div>
            <div class="calc-field">
              <label>Weight (kg)</label>
              <input class="calc-input" type="number" id="calc-weight" placeholder="e.g. 82" min="30" max="300" step="0.1" value="${p.weightKg || ''}">
            </div>
            <div class="calc-field">
              <label>Ethnicity (for BF% adjustment)</label>
              <select class="calc-select" id="calc-ethnicity">
                <option value="caucasian" ${p.ethnicity === 'caucasian' || !p.ethnicity ? 'selected' : ''}>Caucasian / European</option>
                <option value="african" ${p.ethnicity === 'african' ? 'selected' : ''}>African / Afro-Caribbean</option>
                <option value="south_asian" ${p.ethnicity === 'south_asian' ? 'selected' : ''}>South Asian</option>
                <option value="east_asian" ${p.ethnicity === 'east_asian' ? 'selected' : ''}>East Asian / SE Asian</option>
                <option value="hispanic" ${p.ethnicity === 'hispanic' ? 'selected' : ''}>Hispanic / Latino</option>
                <option value="other" ${p.ethnicity === 'other' ? 'selected' : ''}>Other / Prefer not to say</option>
              </select>
            </div>
            <div class="calc-field">
              <label>Activity Level</label>
              <select class="calc-select" id="calc-activity">
                <option value="1.2" ${p.activityLevel === '1.2' ? 'selected' : ''}>Sedentary (desk job, no exercise)</option>
                <option value="1.375" ${p.activityLevel === '1.375' ? 'selected' : ''}>Lightly Active (1–2 days/wk)</option>
                <option value="1.55" ${p.activityLevel === '1.55' || !p.activityLevel ? 'selected' : ''}>Moderately Active (3–4 days/wk)</option>
                <option value="1.725" ${p.activityLevel === '1.725' ? 'selected' : ''}>Very Active (5–6 days/wk)</option>
                <option value="1.9" ${p.activityLevel === '1.9' ? 'selected' : ''}>Extremely Active (2×/day, physical job)</option>
              </select>
            </div>
            <div class="calc-field full-width">
              <label>Goal</label>
              <select class="calc-select" id="calc-goal">
                <option value="cut_aggressive" ${p.goal === 'cut_aggressive' ? 'selected' : ''}>Aggressive Cut (−750 kcal) — ~0.7 kg/wk loss</option>
                <option value="cut" ${p.goal === 'cut' ? 'selected' : ''}>Moderate Cut (−500 kcal) — ~0.5 kg/wk loss</option>
                <option value="cut_mild" ${p.goal === 'cut_mild' ? 'selected' : ''}>Mild Cut (−250 kcal) — ~0.25 kg/wk loss</option>
                <option value="maintain" ${p.goal === 'maintain' || !p.goal ? 'selected' : ''}>Maintenance</option>
                <option value="lean_bulk" ${p.goal === 'lean_bulk' ? 'selected' : ''}>Lean Bulk (+250 kcal) — ~0.25 kg/wk gain</option>
                <option value="bulk" ${p.goal === 'bulk' ? 'selected' : ''}>Bulk (+500 kcal) — ~0.5 kg/wk gain</option>
              </select>
            </div>

            <div class="calc-field full-width" style="margin-top:8px">
              <div class="section-label">📏 Optional — Tape Measurements (for body fat)</div>
            </div>
            <div class="calc-field">
              <label>Waist at navel (cm)</label>
              <input class="calc-input" type="number" id="calc-waist" placeholder="e.g. 84" step="0.1" value="${p.waistCm || ''}">
            </div>
            <div class="calc-field">
              <label>Neck circumference (cm)</label>
              <input class="calc-input" type="number" id="calc-neck" placeholder="e.g. 38" step="0.1" value="${p.neckCm || ''}">
            </div>
            <div class="calc-field" id="hip-field" style="${(!p.sex || p.sex === 'male') ? 'opacity:0.4' : ''}">
              <label>Hip circumference (cm) — females</label>
              <input class="calc-input" type="number" id="calc-hip" placeholder="e.g. 98" step="0.1" value="${p.hipCm || ''}">
            </div>

            <div class="calc-btn-row">
              <button class="btn btn-accent" style="flex:1;padding:13px;font-size:0.95rem;font-weight:800;letter-spacing:1px" onclick="runCalculations()">CALCULATE</button>
            </div>
          </div>
        </div>

        <!-- Results Panel -->
        <div class="calc-results-panel" id="calc-results">
          <div class="result-card" style="flex-direction:column;align-items:center;text-align:center;padding:3rem 2rem">
            <div style="font-size:3rem;margin-bottom:12px">🧮</div>
            <div style="font-size:1.1rem;font-weight:700;margin-bottom:4px">Enter your details & hit Calculate</div>
            <div style="font-size:0.85rem;color:var(--text-secondary)">
              BMR · TDEE · body fat · BMI · FFMI · macros · ideal weight · water · heart rate zones
            </div>
          </div>
        </div>
      </div>

      <!-- Formula reference -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">📚 Formula Reference</div>
        </div>
        <div class="formula-grid">
          <div class="formula-card">
            <div class="formula-name">Mifflin-St Jeor BMR <span class="formula-tag">GOLD STANDARD</span></div>
            <div class="formula-desc">Most validated BMR equation for general populations. Recommended by the Academy of Nutrition and Dietetics.</div>
            <div class="formula-eq">Male: 10×W + 6.25×H − 5×A + 5<br>Female: 10×W + 6.25×H − 5×A − 161<br><em>W=kg, H=cm, A=years</em></div>
          </div>
          <div class="formula-card">
            <div class="formula-name">Katch-McArdle BMR <span class="formula-tag">LEAN MASS</span></div>
            <div class="formula-desc">Uses lean body mass — more accurate for athletic or lean individuals who know their body fat %.</div>
            <div class="formula-eq">BMR = 370 + 21.6 × LBM (kg)<br><em>LBM = Weight × (1 − BF%/100)</em></div>
          </div>
          <div class="formula-card">
            <div class="formula-name">US Navy Body Fat % <span class="formula-tag">TAPE METHOD</span></div>
            <div class="formula-desc">Uses tape measurements of waist, neck (and hip for females). Within ±3–4% of DEXA for most people.</div>
            <div class="formula-eq">Male: 86.010×log₁₀(waist−neck) − 70.041×log₁₀(height) + 36.76<br>Female: 163.205×log₁₀(waist+hip−neck) − 97.684×log₁₀(height) − 78.387</div>
          </div>
          <div class="formula-card">
            <div class="formula-name">CUN-BAE Body Fat % <span class="formula-tag">BMI-BASED</span></div>
            <div class="formula-desc">Estimates body fat from BMI, age, and sex when tape measurements are unavailable. Validated in multiple populations.</div>
            <div class="formula-eq">−44.988 + 0.503×age + 10.689×sex + 3.172×BMI − 0.026×BMI²<br>+ 0.181×BMI×sex − 0.02×BMI×age − 0.005×BMI²×sex + 0.00021×BMI²×age<br><em>sex: male=0, female=1</em></div>
          </div>
          <div class="formula-card">
            <div class="formula-name">FFMI <span class="formula-tag">MUSCLE INDEX</span></div>
            <div class="formula-desc">Height-normalised lean mass index. More useful than BMI for trained individuals. Natural limit is ~25 for men.</div>
            <div class="formula-eq">FFMI = LBM/height² + 6.1 × (1.8 − height)<br><em>LBM in kg, height in metres</em></div>
          </div>
          <div class="formula-card">
            <div class="formula-name">Tanaka Max Heart Rate <span class="formula-tag">CARDIO</span></div>
            <div class="formula-desc">More accurate than 220−age. Based on meta-analysis of 351 studies.</div>
            <div class="formula-eq">MHR = 208 − 0.7 × age</div>
          </div>
          <div class="formula-card">
            <div class="formula-name">Devine Ideal Body Weight <span class="formula-tag">CLINICAL</span></div>
            <div class="formula-desc">Originally developed for drug dosing, widely used as a general reference for frame-appropriate weight.</div>
            <div class="formula-eq">Male: 50 + 2.3 × (height_in − 60)<br>Female: 45.5 + 2.3 × (height_in − 60)</div>
          </div>
          <div class="formula-card">
            <div class="formula-name">Ethnicity Adjustments <span class="formula-tag">WHO EVIDENCE</span></div>
            <div class="formula-desc">WHO and published research show body fat varies by ethnicity at the same BMI. Deurenberg-style offsets applied.</div>
            <div class="formula-eq">South/East Asian: +3.5% BF<br>Hispanic: +1.5% BF<br>African descent: −2% BF<br>Caucasian/Other: baseline</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Global handlers
window.calcToggleHip = function() {
  const sex = document.getElementById('calc-sex')?.value;
  const hipField = document.getElementById('hip-field');
  if (hipField) hipField.style.opacity = sex === 'female' ? '1' : '0.4';
};

window.runCalculations = function() {
  const age = parseFloat(document.getElementById('calc-age')?.value) || 0;
  const sex = document.getElementById('calc-sex')?.value || 'male';
  const heightCm = parseFloat(document.getElementById('calc-height')?.value) || 0;
  const weightKg = parseFloat(document.getElementById('calc-weight')?.value) || 0;
  const activityLevel = document.getElementById('calc-activity')?.value || '1.55';
  const goal = document.getElementById('calc-goal')?.value || 'maintain';
  const waistCm = parseFloat(document.getElementById('calc-waist')?.value) || 0;
  const neckCm = parseFloat(document.getElementById('calc-neck')?.value) || 0;
  const hipCm = parseFloat(document.getElementById('calc-hip')?.value) || 0;
  const ethnicity = document.getElementById('calc-ethnicity')?.value || 'caucasian';

  if (!age || !heightCm || !weightKg) {
    alert('Please enter at least your age, height, and weight.');
    return;
  }

  const actMult = parseFloat(activityLevel);
  const heightM = heightCm / 100;

  // BMR — Mifflin-St Jeor
  let bmr = sex === 'male'
    ? (10 * weightKg) + (6.25 * heightCm) - (5 * age) + 5
    : (10 * weightKg) + (6.25 * heightCm) - (5 * age) - 161;

  const tdee = bmr * actMult;
  const bmi = weightKg / (heightM * heightM);

  // BMI category
  let bmiCategory, bmiColor;
  if (bmi < 18.5)      { bmiCategory = 'Underweight'; bmiColor = '#3b82f6'; }
  else if (bmi < 25)   { bmiCategory = 'Normal';      bmiColor = '#22c55e'; }
  else if (bmi < 30)   { bmiCategory = 'Overweight';  bmiColor = '#f59e0b'; }
  else                 { bmiCategory = 'Obese';        bmiColor = '#ef4444'; }

  // Body fat — US Navy (if tape measurements available)
  let bodyFatPct = null, bodyFatMethod = '';
  if (waistCm && neckCm) {
    if (sex === 'male' && waistCm > neckCm) {
      bodyFatPct = 86.010 * Math.log10(waistCm - neckCm) - 70.041 * Math.log10(heightCm) + 36.76;
      bodyFatMethod = 'US Navy';
    } else if (sex === 'female' && hipCm && (waistCm + hipCm) > neckCm) {
      bodyFatPct = 163.205 * Math.log10(waistCm + hipCm - neckCm) - 97.684 * Math.log10(heightCm) - 78.387;
      bodyFatMethod = 'US Navy';
    }
  }

  // CUN-BAE fallback
  if (!bodyFatPct) {
    const sexVal = sex === 'female' ? 1 : 0;
    bodyFatPct = -44.988 + (0.503 * age) + (10.689 * sexVal) + (3.172 * bmi)
      - (0.026 * bmi * bmi) + (0.181 * bmi * sexVal) - (0.02 * bmi * age)
      - (0.005 * bmi * bmi * sexVal) + (0.00021 * bmi * bmi * age);
    bodyFatMethod = 'CUN-BAE';
  }

  // Ethnicity adjustment
  let ethnicAdj = 0, ethnicNote = '';
  if (ethnicity === 'south_asian' || ethnicity === 'east_asian') {
    ethnicAdj = 3.5;
    ethnicNote = 'Adjusted +3.5% for South/East Asian populations (higher adiposity at equivalent BMI per WHO evidence)';
  } else if (ethnicity === 'african') {
    ethnicAdj = -2.0;
    ethnicNote = 'Adjusted −2% for African descent populations (higher lean mass at equivalent BMI)';
  } else if (ethnicity === 'hispanic') {
    ethnicAdj = 1.5;
    ethnicNote = 'Adjusted +1.5% for Hispanic populations';
  }

  const bodyFatAdj = Math.max(3, bodyFatPct + ethnicAdj);
  const fatMass = weightKg * (bodyFatAdj / 100);
  const leanMass = weightKg - fatMass;

  // Katch-McArdle BMR with lean mass
  const bmrKatch = 370 + (21.6 * leanMass);

  // FFMI
  const ffmi = (leanMass / (heightM * heightM)) + 6.1 * (1.8 - heightM);
  let ffmiCategory;
  if (sex === 'male') {
    if (ffmi < 18) ffmiCategory = 'Below average';
    else if (ffmi < 20) ffmiCategory = 'Average';
    else if (ffmi < 22) ffmiCategory = 'Above average';
    else if (ffmi < 25) ffmiCategory = 'Excellent / Advanced';
    else ffmiCategory = 'Near genetic limit';
  } else {
    if (ffmi < 14) ffmiCategory = 'Below average';
    else if (ffmi < 16.5) ffmiCategory = 'Average';
    else if (ffmi < 18) ffmiCategory = 'Above average';
    else if (ffmi < 21) ffmiCategory = 'Excellent / Advanced';
    else ffmiCategory = 'Near genetic limit';
  }

  // Waist-to-height ratio
  let wthr = null, wthrRisk = '';
  if (waistCm) {
    wthr = waistCm / heightCm;
    if (wthr < 0.4) wthrRisk = 'Underweight risk';
    else if (wthr < 0.5) wthrRisk = 'Healthy';
    else if (wthr < 0.6) wthrRisk = 'Elevated risk';
    else wthrRisk = 'High risk';
  }

  // Ideal body weight (Devine)
  const heightIn = heightCm / 2.54;
  let ibw = sex === 'male'
    ? 50 + 2.3 * (heightIn - 60)
    : 45.5 + 2.3 * (heightIn - 60);
  if (ibw < 0) ibw = weightKg;

  // Caloric target
  const goalMap = {
    cut_aggressive: { delta: -750, label: 'Aggressive Cut (−750 kcal)' },
    cut:            { delta: -500, label: 'Moderate Cut (−500 kcal)' },
    cut_mild:       { delta: -250, label: 'Mild Cut (−250 kcal)' },
    maintain:       { delta:    0, label: 'Maintenance' },
    lean_bulk:      { delta: +250, label: 'Lean Bulk (+250 kcal)' },
    bulk:           { delta: +500, label: 'Bulk (+500 kcal)' },
  };
  const { delta, label: goalLabel } = goalMap[goal] || goalMap.maintain;
  const targetCals = tdee + delta;

  // Macros
  const proteinG = Math.round(leanMass * 2.2);
  const fatG = Math.round(targetCals * 0.25 / 9);
  const carbG = Math.round(Math.max(0, (targetCals - proteinG * 4 - fatG * 9) / 4));
  const totalMacroCals = proteinG * 4 + carbG * 4 + fatG * 9;
  const protPct  = ((proteinG * 4) / totalMacroCals * 100).toFixed(0);
  const carbPct  = ((carbG    * 4) / totalMacroCals * 100).toFixed(0);
  const fatPct   = ((fatG     * 9) / totalMacroCals * 100).toFixed(0);

  // Water & Max HR
  const waterL = ((weightKg * 0.033) * actMult / 1.55).toFixed(1);
  const mhr = Math.round(208 - 0.7 * age);
  const hrZones = [
    { zone: 'Zone 1 — Recovery',  range: `${Math.round(mhr*0.5)}–${Math.round(mhr*0.6)} bpm`, pct: '50-60%', color: '#3b82f6' },
    { zone: 'Zone 2 — Fat Burn',  range: `${Math.round(mhr*0.6)}–${Math.round(mhr*0.7)} bpm`, pct: '60-70%', color: '#22c55e' },
    { zone: 'Zone 3 — Aerobic',   range: `${Math.round(mhr*0.7)}–${Math.round(mhr*0.8)} bpm`, pct: '70-80%', color: '#f59e0b' },
    { zone: 'Zone 4 — Threshold', range: `${Math.round(mhr*0.8)}–${Math.round(mhr*0.9)} bpm`, pct: '80-90%', color: '#f97316' },
    { zone: 'Zone 5 — Max Effort',range: `${Math.round(mhr*0.9)}–${mhr} bpm`,              pct: '90-100%', color: '#ef4444' },
  ];

  // Body fat gauge (SVG ring)
  const bfPct = Math.min(bodyFatAdj, 50);
  const bfStroke = (bfPct / 50) * 251;
  let bfColor = '#22c55e';
  if (sex === 'male') {
    bfColor = bfPct > 25 ? '#ef4444' : bfPct > 20 ? '#f59e0b' : bfPct > 14 ? '#22c55e' : '#3b82f6';
  } else {
    bfColor = bfPct > 32 ? '#ef4444' : bfPct > 25 ? '#f59e0b' : bfPct > 20 ? '#22c55e' : '#3b82f6';
  }

  const resultsPanel = document.getElementById('calc-results');
  if (!resultsPanel) return;

  resultsPanel.innerHTML = `
    <div class="result-card">
      <div class="result-icon fire">🔥</div>
      <div class="result-info">
        <div class="result-label">BMR (Mifflin-St Jeor)</div>
        <div class="result-value">${Math.round(bmr)} <span style="font-size:0.9rem;color:var(--text-secondary)">kcal/day</span></div>
        <div class="result-sub">Calories burned at complete rest</div>
      </div>
    </div>

    <div class="result-card">
      <div class="result-icon fire">⚡</div>
      <div class="result-info">
        <div class="result-label">BMR (Katch-McArdle — lean mass adjusted)</div>
        <div class="result-value">${Math.round(bmrKatch)} <span style="font-size:0.9rem;color:var(--text-secondary)">kcal/day</span></div>
        <div class="result-sub">More accurate for trained individuals</div>
      </div>
    </div>

    <div class="result-card">
      <div class="result-icon bolt">⚡</div>
      <div class="result-info">
        <div class="result-label">TDEE (Total Daily Energy Expenditure)</div>
        <div class="result-value">${Math.round(tdee)} <span style="font-size:0.9rem;color:var(--text-secondary)">kcal/day</span></div>
        <div class="result-sub">BMR × ${actMult} activity multiplier</div>
        <div class="tdee-bar-container">
          <div class="tdee-bar">
            <div class="tdee-bar-segment" style="width:${((bmr/tdee)*100).toFixed(0)}%;background:var(--accent)"></div>
            <div class="tdee-bar-segment" style="width:${(((tdee-bmr)/tdee)*100).toFixed(0)}%;background:var(--accent-secondary)"></div>
          </div>
          <div class="tdee-legend">
            <div class="tdee-legend-item"><div class="tdee-legend-dot" style="background:var(--accent)"></div>BMR (${Math.round(bmr)})</div>
            <div class="tdee-legend-item"><div class="tdee-legend-dot" style="background:var(--accent-secondary)"></div>Activity (${Math.round(tdee-bmr)})</div>
          </div>
        </div>
      </div>
    </div>

    <div class="result-card" style="border-color:var(--accent)">
      <div class="result-icon target">🎯</div>
      <div class="result-info">
        <div class="result-label">Daily Calorie Target — ${goalLabel}</div>
        <div class="result-value" style="color:var(--accent)">${Math.round(targetCals)} <span style="font-size:0.9rem">kcal/day</span></div>
        <div class="result-sub">${Math.round(targetCals * 7)} kcal/week</div>
      </div>
    </div>

    <div class="card" style="margin:0">
      <div class="card-header"><div class="card-title">🍽 Recommended Macros</div></div>
      <div class="macro-grid">
        <div class="macro-card">
          <div class="macro-name">Protein</div>
          <div class="macro-value" style="color:#ef4444">${proteinG}<span class="macro-unit">g</span></div>
          <div style="font-size:0.75rem;color:var(--text-secondary)">${protPct}% · ${proteinG*4} kcal</div>
          <div class="macro-bar"><div class="macro-bar-fill" style="width:${protPct}%;background:#ef4444"></div></div>
        </div>
        <div class="macro-card">
          <div class="macro-name">Carbs</div>
          <div class="macro-value" style="color:#f59e0b">${carbG}<span class="macro-unit">g</span></div>
          <div style="font-size:0.75rem;color:var(--text-secondary)">${carbPct}% · ${carbG*4} kcal</div>
          <div class="macro-bar"><div class="macro-bar-fill" style="width:${carbPct}%;background:#f59e0b"></div></div>
        </div>
        <div class="macro-card">
          <div class="macro-name">Fat</div>
          <div class="macro-value" style="color:#3b82f6">${fatG}<span class="macro-unit">g</span></div>
          <div style="font-size:0.75rem;color:var(--text-secondary)">${fatPct}% · ${fatG*9} kcal</div>
          <div class="macro-bar"><div class="macro-bar-fill" style="width:${fatPct}%;background:#3b82f6"></div></div>
        </div>
      </div>
      <div style="font-size:0.75rem;color:var(--text-muted);margin-top:10px">Protein @ 2.2g/kg lean mass · Fat @ 25% total kcal · Carbs fill the rest</div>
    </div>

    <div class="bodycomp-row">
      <div class="gauge-ring">
        <svg viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="none" stroke="var(--bg-elevated)" stroke-width="8"/>
          <circle cx="50" cy="50" r="40" fill="none" stroke="${bfColor}" stroke-width="8"
            stroke-dasharray="${bfStroke} ${251-bfStroke}" stroke-linecap="round"/>
        </svg>
        <div class="gauge-ring-text">
          ${bodyFatAdj.toFixed(1)}%
          <span class="gauge-ring-sub">BODY FAT</span>
        </div>
      </div>
      <div class="bodycomp-details">
        <div class="bodycomp-stat">
          <div class="bodycomp-stat-label">Method</div>
          <div class="bodycomp-stat-value" style="font-size:0.85rem">${bodyFatMethod}${ethnicAdj ? ' + Ethnic Adj.' : ''}</div>
        </div>
        <div class="bodycomp-stat">
          <div class="bodycomp-stat-label">Lean Mass</div>
          <div class="bodycomp-stat-value">${leanMass.toFixed(1)} kg</div>
        </div>
        <div class="bodycomp-stat">
          <div class="bodycomp-stat-label">Fat Mass</div>
          <div class="bodycomp-stat-value">${fatMass.toFixed(1)} kg</div>
        </div>
        <div class="bodycomp-stat">
          <div class="bodycomp-stat-label">FFMI</div>
          <div class="bodycomp-stat-value">${ffmi.toFixed(1)} <span style="font-size:0.75rem;color:var(--text-secondary)">— ${ffmiCategory}</span></div>
        </div>
      </div>
    </div>
    ${ethnicNote ? `<div style="font-size:0.75rem;color:var(--text-muted);margin-top:4px;padding:0 4px">ℹ ${ethnicNote}</div>` : ''}

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <div class="result-card">
        <div class="result-icon scale">⚖</div>
        <div class="result-info">
          <div class="result-label">BMI</div>
          <div class="result-value" style="color:${bmiColor}">${bmi.toFixed(1)}</div>
          <div class="result-sub">${bmiCategory} · Ideal: ${ibw.toFixed(1)} kg (Devine)</div>
        </div>
      </div>
      ${wthr !== null ? `
      <div class="result-card">
        <div class="result-icon drop">📐</div>
        <div class="result-info">
          <div class="result-label">Waist-to-Height Ratio</div>
          <div class="result-value">${wthr.toFixed(3)}</div>
          <div class="result-sub">${wthrRisk} · Target: &lt; 0.50</div>
        </div>
      </div>` : `
      <div class="result-card">
        <div class="result-icon drop">💧</div>
        <div class="result-info">
          <div class="result-label">Daily Water Intake</div>
          <div class="result-value">${waterL} <span style="font-size:0.9rem;color:var(--text-secondary)">L</span></div>
          <div class="result-sub">Based on weight & activity</div>
        </div>
      </div>`}
    </div>

    ${wthr !== null ? `
    <div class="result-card">
      <div class="result-icon drop">💧</div>
      <div class="result-info">
        <div class="result-label">Daily Water Intake</div>
        <div class="result-value">${waterL} <span style="font-size:0.9rem;color:var(--text-secondary)">L</span></div>
        <div class="result-sub">Based on weight & activity level</div>
      </div>
    </div>` : ''}

    <div class="card" style="margin:0">
      <div class="card-header">
        <div class="card-title">❤ Heart Rate Zones</div>
        <span class="section-label">Max HR: ${mhr} bpm (Tanaka)</span>
      </div>
      <div style="display:flex;flex-direction:column;gap:6px">
        ${hrZones.map(z => `
          <div style="display:flex;align-items:center;gap:12px;padding:8px 12px;background:var(--bg-elevated);border-radius:var(--radius-xs)">
            <div style="width:10px;height:10px;border-radius:50%;background:${z.color};flex-shrink:0"></div>
            <div style="flex:1;font-size:0.85rem;font-weight:500">${z.zone}</div>
            <div style="font-family:'JetBrains Mono',monospace;font-size:0.8rem;color:var(--text-secondary)">${z.range}</div>
            <span style="font-family:'JetBrains Mono',monospace;font-size:0.65rem;padding:2px 8px;border-radius:4px;background:var(--bg-card);color:var(--text-muted)">${z.pct}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  // Save profile
  saveCalcProfile({ age, sex, heightCm, weightKg, activityLevel, goal, waistCm, neckCm, hipCm, ethnicity });

  // Auto-run if profile loaded
  resultsPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
};
