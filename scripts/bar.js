import { createCrossfade } from './modules/crossfade.js';
import { createMenu } from './modules/menu.js';
import { createModal } from './modules/modal.js';
import { createPageTransition } from './modules/page-transition.js';
import { createBurgerMenu } from './modules/burger-menu.js';

const menuRoot = document.querySelector('[data-menu]');
const bgRoot = document.querySelector('[data-menu-bg]');
const modalRoot = document.querySelector('[data-modal]');
const ptRoot = document.querySelector('[data-page-transition]');
const sectionImageEl = document.querySelector('[data-bar-image-img]');
const burgerButton = document.querySelector('[data-burger]');

const pageTransition = ptRoot ? createPageTransition(ptRoot) : null;
pageTransition?.init();

const background = createCrossfade(bgRoot, '[data-bg-layer]');
const modal = createModal(modalRoot);

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
            /* Без превью-слайдера, только статичная картинка раздела */
            preview: null,
            sectionImage: sectionImageEl,
            dataSource: 'data/bar.json',
            onActive: (dish) => { if (dish?.image) background.show(dish.image); },
            onOpen: (dish) => { fillModal(dish); modal.open(); },
        })
        : Promise.resolve(null));

    let arrived = false;
    if (pageTransition) {
        arrived = await pageTransition.arrive(setupMenu);
    }
    if (!arrived) {
        await setupMenu();
    }
}

bootstrap();