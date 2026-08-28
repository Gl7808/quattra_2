import { createSlider } from './modules/slider.js';
import { createCrosshair } from './modules/crosshair.js';
import { createLoader } from './modules/loader.js';
import { createPageTransition } from './modules/page-transition.js';
import { createSliderBg } from './modules/slider-bg.js';
import { createBurgerMenu } from './modules/burger-menu.js';

const loaderRoot = document.querySelector('[data-loader]');
const sliderRoot = document.querySelector('[data-slider]');
const crosshairRoot = document.querySelector('[data-crosshair]');
const ptRoot = document.querySelector('[data-page-transition]');
const sliderBgRoot = document.querySelector('[data-slider-bg]');

const pageTransition = ptRoot ? createPageTransition(ptRoot) : null;
pageTransition?.init();

const burgerButton = document.querySelector('[data-burger]');
const fullscreenNavRoot = document.querySelector('[data-fullscreen-nav]');
createBurgerMenu(burgerButton, fullscreenNavRoot);

async function bootstrap() {
    let slider = null;

    const crosshair = crosshairRoot
        ? createCrosshair(crosshairRoot, () => slider?.activeSlide, { intro: true })
        : null;

    if (sliderRoot) {
        slider = createSlider(sliderRoot);
        slider.init();
    }

    if (slider && sliderBgRoot) {
        const sliderBg = createSliderBg(sliderBgRoot);
        sliderBg.show(slider.index);
        sliderRoot.addEventListener('slider:change', (event) => {
            sliderBg.show(event.detail.index);
        });
    }

    /* Если приехали через переход — блок накрывает экран и уезжает вправо.
       Пока он закрывает страницу, убираем лоадер, чтобы он не всплыл. */
    const arrived = pageTransition
        ? await pageTransition.arrive(() => { loaderRoot?.remove(); })
        : false;

    if (arrived) {
        crosshair?.engage();
    } else if (loaderRoot) {
        /* Первый визит: крутим лоадер 0–100 */
        await createLoader(loaderRoot);
        loaderRoot.classList.add('is-hidden');
        crosshair?.engage();

        loaderRoot.addEventListener('transitionend', () => {
            if (loaderRoot.classList.contains('is-hidden')) loaderRoot.remove();
        }, { once: true });
    } else {
        crosshair?.engage();
    }

    if (sliderRoot && crosshair) {
        sliderRoot.addEventListener('slider:change', (event) => {
            crosshair.kick(event.detail?.steps ?? 1);
        });
    }
}

bootstrap();