import { createPageTransition } from './modules/page-transition.js';
import { createBurgerMenu } from './modules/burger-menu.js';
import { createLoungeHero } from './modules/lounge-hero.js';
import { createLoungePresets } from './modules/lounge-presets.js';
import { createBookModal } from './modules/book-modal.js';

const ptRoot = document.querySelector('[data-page-transition]');
const pageTransition = ptRoot ? createPageTransition(ptRoot) : null;
pageTransition?.init();

createBurgerMenu(
    document.querySelector('[data-burger]'),
    document.querySelector('[data-fullscreen-nav]')
);

const heroRoot = document.querySelector('[data-lounge-hero]');
if (heroRoot) createLoungeHero(heroRoot);

const presetsRoot = document.querySelector('[data-lounge-presets]');
if (presetsRoot) createLoungePresets(presetsRoot);

/* год в футере */
const yearEl = document.querySelector('[data-year]');
if (yearEl) yearEl.textContent = String(new Date().getFullYear());
/* модалка бронирования */
const bookModalRoot = document.querySelector('[data-book-modal]');
const bookModal = bookModalRoot ? createBookModal(bookModalRoot) : null;

document.querySelectorAll('[data-book-open]').forEach((button) => {
    button.addEventListener('click', () => bookModal?.open());
});

/* раскрытие страницы после внутреннего перехода */
if (pageTransition) pageTransition.arrive();