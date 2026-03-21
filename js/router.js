// Tab → render function registry
const routes = {};
let currentTab = 'today';
let backStack = []; // for sub-pages within a tab

export function registerRoute(tab, renderFn) {
  routes[tab] = renderFn;
}

export function navigateTo(tab, subPage = null) {
  currentTab = tab;
  backStack = subPage ? [subPage] : [];
  _render();
  // Update nav buttons
  document.querySelectorAll('.nav-btn[data-tab]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

export function pushSubPage(subPage) {
  backStack.push(subPage);
  _render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

export function popSubPage() {
  backStack.pop();
  _render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

export function currentSubPage() {
  return backStack[backStack.length - 1] ?? null;
}

function _render() {
  const fn = routes[currentTab];
  const el = document.getElementById('main-content');
  if (!el) return;
  if (!fn) {
    el.innerHTML = `<div class="page active" style="text-align:center;padding:3rem 1rem"><div class="page-title">Page not found</div><div class="page-subtitle">Route "${currentTab}" has no renderer registered.</div></div>`;
    return;
  }
  try {
    el.innerHTML = fn(currentSubPage());
  } catch (e) {
    console.error('[router] render error on tab', currentTab, e);
    el.innerHTML = `<div class="page active"><div class="card" style="color:#ef4444;padding:1.5rem"><strong>Render error:</strong> ${e.message}<br><pre style="font-size:0.7rem;margin-top:8px;overflow:auto">${e.stack}</pre></div></div>`;
  }
}

export function rerender() { _render(); }

export function initNav() {
  document.querySelectorAll('.nav-btn[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => navigateTo(btn.dataset.tab));
  });
}
