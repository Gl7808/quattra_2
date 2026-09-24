import { createPageTransition } from './modules/page-transition.js';

const ptRoot = document.querySelector('[data-page-transition]');

/* Если нужно, чтобы переходы работали и отсюда —
   добавьте data-page-transition в разметку placeholder.html.
   Без него страница просто перейдёт по ссылке стандартно. */
if (ptRoot) {
    createPageTransition(ptRoot).init();
}