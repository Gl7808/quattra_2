import { createCrossfade } from './modules/crossfade.js';
import { createPreviewSlider } from './modules/preview-slider.js';
import { createMenu } from './modules/menu.js';
import { createModal } from './modules/modal.js';
import { createPageTransition } from './modules/page-transition.js';
import { createBurgerMenu } from './modules/burger-menu.js';

const menuRoot = document.querySelector('[data-menu]');
const previewRoot = document.querySelector('[data-menu-preview]');
const bgRoot = document.querySelector('[data-menu-bg]');
const modalRoot = document.querySelector('[data-modal]');
const ptRoot = document.querySelector('[data-page-transition]');

const pageTransition = ptRoot ? createPageTransition(ptRoot) : null;
pageTransition?.init();

const background = createCrossfade(bgRoot, '[data-bg-layer]');
const preview = createPreviewSlider(previewRoot);
const modal = createModal(modalRoot);
const burgerButton = document.querySelector('[data-burger]');
const fullscreenNavRoot = document.querySelector('[data-fullscreen-nav]');
createBurgerMenu(burgerButton, fullscreenNavRoot);

function setField(node, text) {
    if (!node) return;
    if (text) {
        node.textContent = text;
        node.hidden = false;
    } else {
        node.hidden = true;
    }
}

function fillModal(dish) {
    const media = modalRoot.querySelector('[data-modal-media]');
    const image = modalRoot.querySelector('[data-modal-image]');

    if (dish.image) {
        media.hidden = false;
        image.src = dish.image;
        image.alt = dish.name ?? '';
    } else {
        media.hidden = true;
    }

    setField(modalRoot.querySelector('[data-modal-name]'), dish.name);
    setField(modalRoot.querySelector('[data-modal-description]'), dish.description);
    setField(
        modalRoot.querySelector('[data-modal-composition]'),
        dish.ingredients?.length ? `Состав: ${dish.ingredients.join(', ')}` : ''
    );
    setField(modalRoot.querySelector('[data-modal-weight]'), dish.weight);
    setField(modalRoot.querySelector('[data-modal-price]'), dish.price != null ? `${dish.price} ₽` : '');
    setField(modalRoot.querySelector('[data-modal-calories]'), dish.calories != null ? `${dish.calories} ккал` : '');
    setField(
        modalRoot.querySelector('[data-modal-bju]'),
        dish.bju ? `Б ${dish.bju.protein} · Ж ${dish.bju.fat} · У ${dish.bju.carbs}` : ''
    );

    const facts = modalRoot.querySelector('[data-modal-facts]');
    facts.hidden = !(dish.calories != null || dish.bju);
}

async function bootstrap() {
    const setupMenu = () => (menuRoot
        ? createMenu(menuRoot, {
            preview,
            onActive: (dish) => { if (dish?.image) background.show(dish.image); },
            onOpen: (dish) => { fillModal(dish); modal.open(); },
        })
        : Promise.resolve(null));

    /* Если приехали через переход — сначала рендерим меню под блоком,
       потом блок уезжает вправо и раскрывает готовую страницу. */
    let arrived = false;
    if (pageTransition) {
        arrived = await pageTransition.arrive(setupMenu);
    }
    if (!arrived) {
        await setupMenu();
    }
}

bootstrap();