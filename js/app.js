import { loadState } from './state.js';
import { initAuth } from './auth.js';
import { initNav, navigateTo, registerRoute } from './router.js';
import { renderToday } from './render/today.js';
import { renderTrain } from './render/train.js';
import { renderBuild } from './render/build.js';
import { renderMe } from './render/me.js';
import { checkOnboarding } from './onboarding.js';

loadState();
initNav();

registerRoute('today', renderToday);
registerRoute('train', renderTrain);
registerRoute('build', renderBuild);
registerRoute('me', renderMe);

initAuth(); // fires rerender after auth state resolves

checkOnboarding(); // shows onboarding overlay if needed, else navigateTo('today')
