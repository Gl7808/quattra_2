import { createPageTransition } from './modules/page-transition.js';
import { initRevealGrid } from './modules/reveal-grid.js';
import { createTournamentSlider } from './modules/tournament-slider.js';

const ptRoot = document.querySelector('[data-page-transition]');
const sliderRoot = document.querySelector('[data-t-slider]');

const pageTransition = ptRoot ? createPageTransition(ptRoot) : null;
pageTransition?.init();

async function bootstrap() {
    /* Анимация приезда панели при переходе */
    if (pageTransition) {
        await pageTransition.arrive();
    }

    /* Hero: разрезание надписи при скролле */
    initRevealGrid();

    /* 3D-слайдер турниров */
    if (sliderRoot) {
        const slider = createTournamentSlider(sliderRoot);
        await slider.init();
    }
}

bootstrap();