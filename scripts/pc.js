import { createPageTransition } from './modules/page-transition.js';
import { createBurgerMenu } from './modules/burger-menu.js';
import { createClubHero } from './modules/club-hero.js';
import { createGlitchTitle } from './modules/glitch-title.js';
import { createLightbox } from './modules/lightbox.js';
import { createPeriphSlider } from './modules/periph-slider.js';

const ptRoot = document.querySelector('[data-page-transition]');
const pageTransition = ptRoot ? createPageTransition(ptRoot) : null;
pageTransition?.init();

createBurgerMenu(
    document.querySelector('[data-burger]'),
    document.querySelector('[data-fullscreen-nav]')
);

const heroRoot = document.querySelector('[data-club-hero]');
if (heroRoot) createClubHero(heroRoot);

const glitchRoot = document.querySelector('[data-hero-title]');
if (glitchRoot) createGlitchTitle(glitchRoot);

const lightboxRoot = document.querySelector('[data-lightbox]');
if (lightboxRoot) {
    const lightbox = createLightbox(lightboxRoot);
    document.querySelectorAll('[data-lightbox-open]').forEach((button) => {
        button.addEventListener('click', () => {
            const img = button.querySelector('img');
            const src = button.dataset.full || img?.currentSrc || img?.src;
            lightbox.open(src, img?.alt ?? '');
        });
    });
}
document.querySelectorAll('[data-periph]').forEach((el) => createPeriphSlider(el));
/* раскрытие страницы после внутреннего перехода */
if (pageTransition) pageTransition.arrive();