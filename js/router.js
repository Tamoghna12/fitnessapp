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
  if (!fn) return;
  const el = document.getElementById('main-content');
  if (el) el.innerHTML = fn(currentSubPage());
}

export function rerender() { _render(); }

export function initNav() {
  document.querySelectorAll('.nav-btn[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => navigateTo(btn.dataset.tab));
  });
}
