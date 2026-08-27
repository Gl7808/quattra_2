const NUMBERS_VISIBLE = 5;      // окно цифр справа
const TRANSITION_MS = 900;      // держать в синхроне с --slider-duration
const UNLOCK_MS = TRANSITION_MS * 0.75;
const DRAG_STEP_RATIO = 0.5;    // доля шага, после которой считаем шаги при драге
const FLICK_VELOCITY = 0.45;    // px/ms — минимальная скорость щелчка
const MAX_DRAG_STEPS = 3;       // максимум слайдов за один драг

const pad = (value) => String(value + 1).padStart(2, '0');
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export function createSlider(root) {
    const viewport = root.querySelector('[data-slider-viewport]');
    const track = root.querySelector('[data-slider-track]');
    const originals = [...track.querySelectorAll('[data-slider-slide]')];
    const count = originals.length;

    const caption = root.querySelector('[data-slider-caption]');
    const captionTitle = caption?.querySelector('.slider__title');
    const counter = root.querySelector('[data-slider-counter]');
    const numbersNav = root.querySelector('[data-nav-numbers]');
    const titlesViewport = root.querySelector('[data-nav-titles]');
    const titlesTrack = root.querySelector('[data-nav-titles-track]');

    let locked = false;
    let unlockTimer = null;
    let captionAnimation = null;

    /* --- бесконечность: клонируем слайды до и после оригиналов --- */
    const headFragment = document.createDocumentFragment();
    const tailFragment = document.createDocumentFragment();

    originals.forEach((slide) => {
        [headFragment, tailFragment].forEach((fragment) => {
            const clone = slide.cloneNode(true);
            clone.classList.add('slide--clone');
            clone.classList.remove('is-active');
            clone.setAttribute('aria-hidden', 'true');
            fragment.appendChild(clone);
        });
    });

    track.prepend(headFragment);
    track.append(tailFragment);

    const slides = [...track.children]; // 3 × count
    let realIndex = count; // старт в среднем наборе
    const logicalIndex = () => ((realIndex % count) + count) % count;

    /* --- мини-слайдер заголовков: тоже 3 набора, идёт синхронно --- */
    const titleButtons = [];
    const titlesFragment = document.createDocumentFragment();

    for (let set = 0; set < 3; set += 1) {
        originals.forEach((slide, i) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'side-nav__title';
            button.textContent = slide.dataset.title ?? '';
            button.setAttribute('aria-label', `Перейти к слайду ${i + 1}: ${slide.dataset.title}`);
            button.addEventListener('click', () => goToLogical(i));
            titlesFragment.appendChild(button);
            titleButtons.push(button);
        });
    }
    titlesTrack.appendChild(titlesFragment);

    /* --- геометрия --- */
    function trackMetrics() {
        const height = slides[0].offsetHeight;
        const gap = parseFloat(getComputedStyle(track).rowGap) || 0;
        return { step: height + gap, height, box: viewport.clientHeight };
    }

    function titlesMetrics() {
        const height = titleButtons[0].offsetHeight;
        const gap = parseFloat(getComputedStyle(titlesTrack).rowGap) || 0;
        return { step: height + gap, height, box: titlesViewport.clientHeight };
    }

    function trackYFor(index) {
        const { step, height, box } = trackMetrics();
        return -index * step + (box - height) / 2;
    }

    function setTrackY(y) {
        track.style.transform = `translate3d(0, ${y}px, 0)`;
    }

    function renderTrack() {
        setTrackY(trackYFor(realIndex));
    }

    function renderTitlesTrack() {
        const { step, height, box } = titlesMetrics();
        const y = -realIndex * step + (box - height) / 2;
        titlesTrack.style.transform = `translate3d(0, ${y}px, 0)`;
    }

    function renderNumbers() {
        const active = logicalIndex();
        const visible = Math.min(NUMBERS_VISIBLE, count);
        const start = clamp(active - 2, 0, count - visible);

        numbersNav.innerHTML = '';
        for (let i = start; i < start + visible; i += 1) {
            const item = document.createElement('li');
            item.className = 'side-nav__item';

            const button = document.createElement('button');
            button.type = 'button';
            button.className = `side-nav__number${i === active ? ' is-active' : ''}`;
            button.textContent = pad(i);
            button.setAttribute('aria-label', `Слайд ${pad(i)}`);
            button.addEventListener('click', () => goToLogical(i));

            item.appendChild(button);
            numbersNav.appendChild(item);
        }
    }

    function renderStates() {
        slides.forEach((slide, i) => slide.classList.toggle('is-active', i === realIndex));
        titleButtons.forEach((button, i) => {
            button.classList.toggle('is-active', i === realIndex);
            button.classList.toggle('is-near', Math.abs(i - realIndex) === 1);
        });
    }


    function renderCaption(direction, animate = true) {
        if (!caption) return;

        const title = originals[logicalIndex()].dataset.title ?? '';
        const counterText = `${pad(logicalIndex())} / ${String(count).padStart(2, '0')}`;
        const swap = () => {
            if (captionTitle) captionTitle.textContent = title;
            if (counter) counter.textContent = counterText;
        };

        /* снимаем все зависшие анимации, чтобы caption не остался с opacity: 0 */
        captionAnimation?.cancel();

        if (!animate) {
            swap();
            return;
        }

        const outAnimation = caption.animate(
            [
                { opacity: 1, transform: 'translateY(0)' },
                { opacity: 0, transform: `translateY(${-22 * direction}px)` },
            ],
            { duration: 200, easing: 'ease-in', fill: 'forwards' }
        );

        captionAnimation = outAnimation;

        outAnimation.onfinish = () => {
            swap();
            /* без этого cancel эффект fill: 'forwards' (opacity: 0) «прилипает» навсегда,
               т.к. входная анимация не имеет fill и после завершения перестаёт действовать */
            outAnimation.cancel();
            captionAnimation = caption.animate(
                [
                    { opacity: 0, transform: `translateY(${22 * direction}px)` },
                    { opacity: 1, transform: 'translateY(0)' },
                ],
                { duration: 450, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }
            );
        };
    }

    /* --- переключение --- */
    function goToReal(target, steps = 1) {
        const next = clamp(target, 0, slides.length - 1);
        if (next === realIndex) return;

        const direction = next > realIndex ? 1 : -1;
        realIndex = next;
        locked = true;

        renderTrack();
        renderTitlesTrack();
        renderNumbers();
        renderStates();
        renderCaption(direction);

        root.dispatchEvent(new CustomEvent('slider:change', {
            detail: { index: logicalIndex(), direction, steps: Math.abs(steps) || 1 },
        }));

        clearTimeout(unlockTimer);
        unlockTimer = setTimeout(() => { locked = false; }, UNLOCK_MS);
    }

    /* клик по цифре/заголовку — кратчайшим путём по кругу */
    function goToLogical(targetLogical) {
        const currentLogical = logicalIndex();
        let delta = (((targetLogical - currentLogical) % count) + count) % count;
        if (delta > count / 2) delta -= count;
        if (delta === 0) return;
        goToReal(realIndex + delta, delta);
    }

    const next = () => goToReal(realIndex + 1);
    const prev = () => goToReal(realIndex - 1);

    /* --- бесшовный возврат в средний набор клонов --- */
    function normalizePosition() {
        if (realIndex >= count && realIndex < count * 2) return;

        const equivalent = (realIndex % count) + count;
        if (equivalent === realIndex) return;

        /* на время телепорта выключаем транзишены: активное состояние
           переносится с клона на оригинал и не должно проигрываться визуально */
        root.classList.add('slider--teleporting');
        track.classList.add('slider__track--instant');
        titlesTrack.classList.add('side-nav__titles-track--instant');

        realIndex = equivalent;
        renderTrack();
        renderTitlesTrack();
        renderStates(); // переносим is-active с клона на оригинал в среднем наборе

        void track.offsetHeight;
        requestAnimationFrame(() => {
            root.classList.remove('slider--teleporting');
            track.classList.remove('slider__track--instant');
            titlesTrack.classList.remove('side-nav__titles-track--instant');
        });
    }

    track.addEventListener('transitionend', (event) => {
        if (event.target !== track || event.propertyName !== 'transform') return;
        normalizePosition();
    });

    /* --- drag --- */
    let drag = null;

    function onPointerDown(event) {
        if (drag || locked) return;
        if (event.pointerType === 'mouse' && event.button !== 0) return;

        /* Если нажатие пришлось на ссылку или кнопку внутри слайда —
           не начинаем драг и не блокируем переход.
           Клик по кнопке «Подробнее» сработает как обычный переход. */
        if (event.target.closest('a, button')) return;

        event.preventDefault();

        drag = {
            pointerId: event.pointerId,
            startY: event.clientY,
            lastY: event.clientY,
            lastTime: performance.now(),
            velocity: 0,
            baseY: trackYFor(realIndex),
        };

        root.classList.add('is-dragging');
        track.classList.add('slider__track--instant');

        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);
        window.addEventListener('pointercancel', onPointerCancel);
    }

    function onPointerMove(event) {
        if (!drag || event.pointerId !== drag.pointerId) return;

        const now = performance.now();
        const dt = now - drag.lastTime;
        if (dt > 0) {
            const instant = (event.clientY - drag.lastY) / dt;
            drag.velocity = drag.velocity * 0.8 + instant * 0.2; // сглаживание
        }
        drag.lastY = event.clientY;
        drag.lastTime = now;

        setTrackY(drag.baseY + (event.clientY - drag.startY));
    }

    function finishDragCleanup() {
        root.classList.remove('is-dragging');
        track.classList.remove('slider__track--instant');
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
        window.removeEventListener('pointercancel', onPointerCancel);
    }

    function onPointerUp(event) {
        if (!drag || event.pointerId !== drag.pointerId) return;

        const delta = event.clientY - drag.startY;
        const velocity = drag.velocity;
        drag = null;
        finishDragCleanup();

        const { step } = trackMetrics();
        let steps = Math.round(-delta / (step * DRAG_STEP_RATIO) * DRAG_STEP_RATIO);
        // то же самое, читаемее:
        steps = Math.round(-delta / step);
        if (steps === 0 && Math.abs(velocity) > FLICK_VELOCITY) {
            steps = velocity < 0 ? 1 : -1; // резкий щелчок вверх = вперёд
        }
        steps = clamp(steps, -MAX_DRAG_STEPS, MAX_DRAG_STEPS);

        const target = realIndex + steps;
        if (steps === 0 || target < 0 || target > slides.length - 1) {
            renderTrack(); // снапбек на место
            locked = true;
            clearTimeout(unlockTimer);
            unlockTimer = setTimeout(() => { locked = false; }, 400);
            return;
        }

        goToReal(target, steps);
    }

    function onPointerCancel(event) {
        if (!drag || event.pointerId !== drag.pointerId) return;
        drag = null;
        finishDragCleanup();
        renderTrack();
    }

    /* --- колесо и клавиатура (теперь без границ) --- */
    let wheelBlocked = false;

    function onWheel(event) {
        event.preventDefault();
        if (drag || wheelBlocked || locked) return;
        if (Math.abs(event.deltaY) < 8) return;

        wheelBlocked = true;
        goToReal(realIndex + (event.deltaY > 0 ? 1 : -1));
        setTimeout(() => { wheelBlocked = false; }, UNLOCK_MS);
    }

    function onKeydown(event) {
        const dirs = { ArrowDown: 1, PageDown: 1, ArrowUp: -1, PageUp: -1 };

        if (event.key in dirs) {
            event.preventDefault();
            if (!drag && !locked) goToReal(realIndex + dirs[event.key]);
            return;
        }
        if (event.key === 'Home') { event.preventDefault(); goToLogical(0); }
        if (event.key === 'End') { event.preventDefault(); goToLogical(count - 1); }
    }

    function onResize() {
        track.classList.add('slider__track--instant');
        titlesTrack.classList.add('side-nav__titles-track--instant');
        renderTrack();
        renderTitlesTrack();
        requestAnimationFrame(() => requestAnimationFrame(() => {
            track.classList.remove('slider__track--instant');
            titlesTrack.classList.remove('side-nav__titles-track--instant');
        }));
    }

    function init() {
        track.classList.add('slider__track--instant');
        titlesTrack.classList.add('side-nav__titles-track--instant');
        renderTrack();
        renderTitlesTrack();
        renderNumbers();
        renderStates();
        renderCaption(1, false);
        requestAnimationFrame(() => requestAnimationFrame(() => {
            track.classList.remove('slider__track--instant');
            titlesTrack.classList.remove('side-nav__titles-track--instant');
        }));

        viewport.addEventListener('pointerdown', onPointerDown);
        window.addEventListener('wheel', onWheel, { passive: false });
        window.addEventListener('keydown', onKeydown);
        window.addEventListener('resize', onResize);
    }

    return {
        init,
        next,
        prev,
        goToLogical,
        get index() { return logicalIndex(); },
        get activeSlide() { return slides[realIndex]; },
    };
}