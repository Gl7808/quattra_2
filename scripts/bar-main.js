import { createLoader } from './modules/loader.js';
import { createPageTransition } from './modules/page-transition.js';
import { createBarMenu } from './modules/bar-menu.js';

const loaderRoot = document.querySelector('[data-loader]');
const barRoot = document.querySelector('[data-bar-menu]');
const ptRoot = document.querySelector('[data-page-transition]');

if (ptRoot) createPageTransition(ptRoot).init();

async function bootstrap() {
    if (barRoot) {
        await createBarMenu(barRoot);
    }

    let skipLoader = false;
    try {
        if (sessionStorage.getItem('pt:skip-loader') === '1') {
            skipLoader = true;
            sessionStorage.removeItem('pt:skip-loader');
        }
    } catch (e) {}

    if (loaderRoot && !skipLoader) {
        await createLoader(loaderRoot);
        loaderRoot.classList.add('is-hidden');
        loaderRoot.addEventListener('transitionend', () => {
            if (loaderRoot.classList.contains('is-hidden')) loaderRoot.remove();
        }, { once: true });
    } else {
        loaderRoot?.remove();
    }
}

bootstrap();