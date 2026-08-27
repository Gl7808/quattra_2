/* Тайминги «въезда» (клик по ссылке) */
const PANEL_DURATION = 550;
const CHAR_ANIMATION = 400;
const CHAR_STAGGER = 35;
const HOLD_OPEN = 380;
const NAVIGATE_DELAY = 160;

/* Тайминг «выезда» при загрузке страницы */
const ARRIVE_DURATION = 650;

const STORAGE_KEY = 'pt:arrive';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function createPageTransition(root) {
    const panel = root.querySelector('[data-pt-panel]');
    const label = root.querySelector('[data-pt-label]');

    let isAnimating = false;

    function resolveLabel(link) {
        const custom = link.dataset.transitionLabel;
        if (custom?.trim()) return custom.trim();

        const slide = link.closest('[data-slider-slide]');
        if (slide?.dataset.title?.trim()) return slide.dataset.title.trim();

        const aria = link.getAttribute('aria-label');
        if (aria?.trim()) return aria.trim();

        return link.textContent.trim();
    }

    function buildChars(text) {
        label.innerHTML = '';
        for (const ch of text) {
            const wrap = document.createElement('span');
            wrap.className = 'page-transition__char';
            const inner = document.createElement('span');
            inner.className = 'page-transition__char-inner';
            inner.textContent = ch === ' ' ? '\u00A0' : ch;
            wrap.appendChild(inner);
            label.appendChild(wrap);
        }
        return [...label.querySelectorAll('.page-transition__char-inner')];
    }

    function setOpenDelays(inners, fromLeft) {
        const n = inners.length;
        inners.forEach((el, i) => {
            const order = fromLeft ? i : n - 1 - i;
            el.style.transitionDelay = `${order * CHAR_STAGGER}ms`;
        });
    }

    function setCloseDelays(inners, fromLeft) {
        const n = inners.length;
        inners.forEach((el, i) => {
            const openOrder = fromLeft ? i : n - 1 - i;
            const closeOrder = n - 1 - openOrder;
            el.style.transitionDelay = `${closeOrder * CHAR_STAGGER}ms`;
        });
    }

    /* ── ВЪЕЗД: клик по ссылке ── */
    async function play(href, text) {
        if (isAnimating) {
            window.location.href = href;
            return;
        }
        isAnimating = true;

        const fromLeft = Math.random() < 0.5;

        root.classList.remove('page-transition--from-left', 'page-transition--from-right');
        root.classList.add(fromLeft ? 'page-transition--from-left' : 'page-transition--from-right');

        const inners = buildChars(text);

        root.classList.add('is-active');
        void panel.offsetWidth;
        root.classList.add('is-panel-in');

        await wait(PANEL_DURATION);

        setOpenDelays(inners, fromLeft);
        void label.offsetWidth;
        root.classList.add('is-label-open');

        const openTotal = CHAR_ANIMATION + (inners.length - 1) * CHAR_STAGGER;
        await wait(openTotal + HOLD_OPEN);

        setCloseDelays(inners, fromLeft);
        void label.offsetWidth;
        root.classList.remove('is-label-open');

        const closeTotal = CHAR_ANIMATION + (inners.length - 1) * CHAR_STAGGER;
        await wait(closeTotal + NAVIGATE_DELAY);

        /* Сообщаем следующей странице, что приехали через переход.
           Подпись не храним — её анимация уже отыграла. */
        try {
            sessionStorage.setItem(STORAGE_KEY, '1');
        } catch (e) {}

        window.location.href = href;
    }

    /* ── ВЫЕЗД: загрузка страницы после перехода ──
       Пустая плита накрывает экран, пока скрыто выполняется whileCovered,
       затем плита уезжает вправо, раскрывая страницу. */
    function arrive(whileCovered) {
        return new Promise((resolve) => {
            let arrived = false;

            try {
                if (sessionStorage.getItem(STORAGE_KEY) === '1') {
                    arrived = true;
                    sessionStorage.removeItem(STORAGE_KEY);
                }
            } catch (e) {}

            if (!arrived) {
                resolve(false);
                return;
            }

            /* мгновенно накрываем экран плитой (без транзишена, без текста) */
            root.classList.add('page-transition--no-anim', 'is-active');
            panel.style.transform = 'translateX(0)';
            void root.offsetWidth;

            const exit = () => {
                const anim = root.animate(
                    [
                        { transform: 'translateX(0)' },
                        { transform: 'translateX(100%)' },
                    ],
                    { duration: ARRIVE_DURATION, easing: 'cubic-bezier(0.65, 0, 0.35, 1)' }
                );

                anim.onfinish = () => {
                    root.classList.remove('is-active', 'page-transition--no-anim');
                    panel.style.transform = '';
                    resolve(true);
                };
            };

            /* даём накрытию отрисоваться, выполняем колбэк, затем уезжаем */
            requestAnimationFrame(() => requestAnimationFrame(async () => {
                if (whileCovered) await whileCovered();
                exit();
            }));
        });
    }

    function isNavigable(link) {
        const href = link.getAttribute('href');
        if (!href) return false;
        if (href.startsWith('#')) return false;
        if (link.target === '_blank') return false;
        if (link.hasAttribute('download')) return false;
        if (/^(mailto:|tel:|javascript:)/i.test(href)) return false;

        try {
            const url = new URL(href, window.location.href);
            if (url.origin !== window.location.origin) return false;
        } catch (e) {
            return false;
        }
        return true;
    }

    function handleClick(event) {
        const link = event.target.closest('a');
        if (!link || !isNavigable(link)) return;
        event.preventDefault();
        const text = resolveLabel(link) || 'Переход';
        play(link.href, text);
    }

    function init() {
        document.addEventListener('click', handleClick);
    }

    return { init, arrive };
}