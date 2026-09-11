import { createInteractiveSlider } from './modules/interactive-slider.js';
import { createCrosshair } from './modules/crosshair.js';
import { createPageTransition } from './modules/page-transition.js';
import { createBurgerMenu } from './modules/burger-menu.js';


const loaderRoot = document.querySelector('[data-loader]');
const sliderRoot = document.querySelector('[data-interactive-slider]');
const crosshairRoot = document.querySelector('[data-crosshair]');
const ptRoot = document.querySelector('[data-page-transition]');
const bgRoot = document.querySelector('[data-interactive-bg]');
const pageTransition = ptRoot ? createPageTransition(ptRoot) : null;
pageTransition?.init();

createBurgerMenu(
    document.querySelector('[data-burger]'),
    document.querySelector('[data-fullscreen-nav]')
);

/* На мобильных слайдер не нужен — блоки идут обычным списком */
const isMobile = window.matchMedia('(max-width: 768px)').matches;

if (ptRoot) createPageTransition(ptRoot).init();

async function bootstrap() {
    let slider = null;

    const crosshair = (!isMobile && crosshairRoot)
        ? createCrosshair(crosshairRoot, () => slider?.activeSlide, { intro: true })
        : null;

    if (sliderRoot && !isMobile) {
        slider = createInteractiveSlider(sliderRoot);
        slider.init();
    } else if (crosshairRoot) {
        /* На мобильном прицел не нужен — убираем его из DOM */
        crosshairRoot.remove();
    }

    /* Фон активного слайда (только десктоп) */
    if (slider && bgRoot) {
        const BG_IMAGES = [
            'images/slides/slide-01.png',
            'images/slides/slide-02.png',
            'images/slides/slide-03.png',
            'images/slides/slide-04.png',
            'images/slides/slide-05.png',
            'images/slides/slide-06.png',
        ];
        const layers = [...bgRoot.querySelectorAll('[data-interactive-bg-layer]')];
        let activeLayer = 1;
        let gen = 0;

        function showBg(idx) {
            const src = BG_IMAGES[idx];
            if (!src || layers.length < 2) return;
            const g = ++gen;
            const next = layers[1 - activeLayer];
            const prev = layers[activeLayer];
            const apply = () => {
                if (g !== gen) return;
                next.classList.add('is-active');
                prev.classList.remove('is-active');
                activeLayer = 1 - activeLayer;
            };
            if (next.dataset.current === src) { apply(); return; }
            next.dataset.current = src;
            next.src = src;
            if (next.complete && next.naturalWidth > 0) apply();
            else {
                next.addEventListener('load', apply, { once: true });
                next.addEventListener('error', apply, { once: true });
            }
        }

        showBg(slider.index);
        sliderRoot.addEventListener('interactive-slider:change', (e) => showBg(e.detail.index));
        window.addEventListener('load', () => BG_IMAGES.forEach((s) => { const i = new Image(); i.src = s; }), { once: true });
    }

    let skipLoader = true;
    try {
        if (sessionStorage.getItem('pt:skip-loader') === '1') {
            skipLoader = true;
            sessionStorage.removeItem('pt:skip-loader');
        }
    } catch (e) {}

    if (loaderRoot && !skipLoader) {
        await createLoader(loaderRoot);
        loaderRoot.classList.add('is-hidden');
        crosshair?.engage();
        loaderRoot.addEventListener('transitionend', () => {
            if (loaderRoot.classList.contains('is-hidden')) loaderRoot.remove();
        }, { once: true });
    } else {
        loaderRoot?.remove();
        crosshair?.engage();
    }

    if (sliderRoot && crosshair) {
        sliderRoot.addEventListener('interactive-slider:change', (e) => {
            crosshair.kick(e.detail?.steps ?? 1);
        });
    }
}

if (pageTransition) pageTransition.arrive();


bootstrap();