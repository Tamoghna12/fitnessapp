import { state, updateProfile } from '../state.js';
import { signIn, signOut, currentUser } from '../auth.js';
import { rerender } from '../router.js';

export function renderMe() {
  const p = state.profile;
  const name = currentUser?.displayName || currentUser?.email || null;
  const initials = name
    ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  const LEVELS = ['beginner', 'intermediate', 'advanced'];
  const LEVEL_LABELS = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' };
  const DAYS = [2, 3, 4, 5, 6];

  return `
    <div class="page active me-page">

      <!-- Hero / user identity -->
      <div class="me-hero">
        <div class="me-avatar">${currentUser ? initials : '?'}</div>
        <div class="me-identity">
          <div class="me-name">${name || 'Guest'}</div>
          <div class="me-subtitle">${currentUser ? 'Synced to cloud ✓' : 'Local only — sign in to sync'}</div>
        </div>
        ${currentUser
          ? `<button class="me-signout-btn" onclick="meSignOut()">Sign out</button>`
          : `<button class="btn btn-accent" style="font-size:0.82rem;padding:7px 16px" onclick="signIn()">Sign In</button>`
        }
      </div>

      <!-- Level -->
      <div class="me-section">
        <div class="me-section-label">Training Level</div>
        <div class="me-chip-row">
          ${LEVELS.map(l => `
            <button class="me-chip ${p.level === l ? 'active' : ''}" onclick="meUpdateProfile({level:'${l}'})">
              ${LEVEL_LABELS[l]}
            </button>
          `).join('')}
        </div>
      </div>

      <!-- Days per week -->
      <div class="me-section">
        <div class="me-section-label">Days per week</div>
        <div class="me-chip-row">
          ${DAYS.map(n => `
            <button class="me-chip me-chip-num ${p.daysPerWeek === n ? 'active' : ''}" onclick="meUpdateProfile({daysPerWeek:${n}})">
              ${n}
            </button>
          `).join('')}
        </div>
      </div>

      <!-- Data management -->
      <div class="me-section">
        <div class="me-section-label">Data</div>
        <div class="me-data-rows">
          <button class="me-data-row" onclick="exportData()">
            <div class="me-data-icon">↓</div>
            <div class="me-data-info">
              <div class="me-data-title">Export Backup</div>
              <div class="me-data-desc">Download a JSON copy of all your data</div>
            </div>
            <span class="me-data-arrow">›</span>
          </button>
          <button class="me-data-row" onclick="document.getElementById('import-input').click()">
            <div class="me-data-icon">↑</div>
            <div class="me-data-info">
              <div class="me-data-title">Import Backup</div>
              <div class="me-data-desc">Restore from a previously exported file</div>
            </div>
            <span class="me-data-arrow">›</span>
          </button>
          <button class="me-data-row danger" onclick="if(confirm('Clear ALL data? This cannot be undone.')){localStorage.clear();location.reload()}">
            <div class="me-data-icon me-data-icon-danger">!</div>
            <div class="me-data-info">
              <div class="me-data-title">Reset All Data</div>
              <div class="me-data-desc">Permanently delete all programs and logs</div>
            </div>
            <span class="me-data-arrow">›</span>
          </button>
        </div>
        <input type="file" id="import-input" accept=".json" style="display:none" onchange="importData(event)">
      </div>

    </div>
  `;
}

window.signIn = signIn;

window.meSignOut = function() {
  signOut();
};

window.meUpdateProfile = function(patch) {
  updateProfile(patch);
  rerender();
};

// keep legacy alias for any other callers
window.updateProfile = window.meUpdateProfile;

window.exportData = function() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(blob),
    download: `iron-protocol-${new Date().toISOString().slice(0,10)}.json`,
  });
  a.click();
};

window.importData = function(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const imported = JSON.parse(e.target.result);
      Object.assign(state, imported);
      import('../state.js').then(m => m.saveState());
      location.reload();
    } catch { alert('Invalid backup file.'); }
  };
  reader.readAsText(file);
};
