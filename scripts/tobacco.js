import { createPageTransition } from './modules/page-transition.js';
import { createBurgerMenu } from './modules/burger-menu.js';
import { createTobaccoCatalog } from './modules/tobacco-catalog.js';

const ptRoot = document.querySelector('[data-page-transition]');
const pageTransition = ptRoot ? createPageTransition(ptRoot) : null;
pageTransition?.init();

createBurgerMenu(
    document.querySelector('[data-burger]'),
    document.querySelector('[data-fullscreen-nav]')
);

const catalogRoot = document.querySelector('[data-tobacco-catalog]');
if (catalogRoot) createTobaccoCatalog(catalogRoot);

const yearEl = document.querySelector('[data-year]');
if (yearEl) yearEl.textContent = String(new Date().getFullYear());

if (pageTransition) pageTransition.arrive();