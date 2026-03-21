import { state, updateProfile } from '../state.js';
import { signIn, signOut, currentUser } from '../auth.js';
import { rerender } from '../router.js';

export function renderMe() {
  const p = state.profile;
  const name = currentUser?.displayName || currentUser?.email || 'Not signed in';

  return `
    <div class="page active">
      <div class="page-title">Me</div>

      <div class="card" style="margin-bottom:1rem">
        <div class="card-title" style="margin-bottom:12px">☁ Account</div>
        ${currentUser ? `
          <div style="color:var(--text-secondary);font-size:0.9rem;margin-bottom:12px">Signed in as ${name}</div>
          <button class="btn btn-ghost" onclick="firebase.auth().signOut()">Sign Out</button>
        ` : `
          <div style="color:var(--text-secondary);font-size:0.85rem;margin-bottom:12px">Sign in to sync across devices</div>
          <button class="btn btn-accent" onclick="signIn()">Sign In with Google</button>
        `}
      </div>

      <div class="card" style="margin-bottom:1rem">
        <div class="card-title" style="margin-bottom:12px">Profile</div>
        <div class="metric-row">
          <span class="metric-name">Level</span>
          <select class="db-search" style="width:auto" onchange="updateProfile({level:this.value})">
            ${['beginner','intermediate','advanced'].map(l => `<option value="${l}" ${p.level===l?'selected':''}>${l}</option>`).join('')}
          </select>
        </div>
        <div class="metric-row" style="margin-top:8px">
          <span class="metric-name">Days/week preference</span>
          <select class="db-search" style="width:auto" onchange="updateProfile({daysPerWeek:+this.value})">
            ${[2,3,4,5,6].map(n => `<option value="${n}" ${p.daysPerWeek===n?'selected':''}>${n}</option>`).join('')}
          </select>
        </div>
      </div>

      <div class="card">
        <div class="card-title" style="margin-bottom:12px">💾 Data</div>
        <div class="data-actions">
          <button class="btn btn-accent" onclick="exportData()">Export Backup</button>
          <button class="btn btn-ghost" onclick="document.getElementById('import-input').click()">Import Backup</button>
          <input type="file" id="import-input" accept=".json" style="display:none" onchange="importData(event)">
          <button class="btn btn-ghost" onclick="if(confirm('Clear ALL data?')){localStorage.clear();location.reload()}">Reset All</button>
        </div>
      </div>
    </div>
  `;
}

// Expose auth functions globally for inline onclick handlers
window.signIn = signIn;

window.updateProfile = function(patch) {
  updateProfile(patch);
  rerender();
};

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
