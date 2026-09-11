const NUMBERS_VISIBLE = 5;
const TRANSITION_MS = 900;
const UNLOCK_MS = TRANSITION_MS * 0.75;
const FLICK_VELOCITY = 0.45;
const MAX_DRAG_STEPS = 3;

const pad = (v) => String(v + 1).padStart(2, '0');
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

export function createInteractiveSlider(root) {
    const viewport = root.querySelector('[data-interactive-viewport]');
    const track = root.querySelector('[data-interactive-track]');
    const originals = [...track.querySelectorAll('[data-interactive-slide]')];
    const count = originals.length;

    const caption = root.querySelector('[data-interactive-caption]');
    const captionTitle = caption?.querySelector('.interactive-slider__title');
    const counter = root.querySelector('[data-interactive-counter]');
    const numbersNav = root.querySelector('[data-interactive-numbers]');
    const titlesViewport = root.querySelector('[data-interactive-titles]');
    const titlesTrack = root.querySelector('[data-interactive-titles-track]');

    let locked = false;
    let unlockTimer = null;
    let captionAnimation = null;

    /* --- Клоны для бесконечного цикла --- */
    const headFrag = document.createDocumentFragment();
    const tailFrag = document.createDocumentFragment();
    originals.forEach((slide) => {
        [headFrag, tailFrag].forEach((frag) => {
            const clone = slide.cloneNode(true);
            clone.classList.add('i-slide--clone');
            clone.classList.remove('is-active');
            clone.setAttribute('aria-hidden', 'true');
            clone.querySelectorAll('video').forEach((v) => { v.pause(); v.removeAttribute('autoplay'); });
            frag.appendChild(clone);
        });
    });
    track.prepend(headFrag);
    track.append(tailFrag);

    const slides = [...track.children];
    let realIndex = count;
    const logicalIndex = () => ((realIndex % count) + count) % count;

    /* --- Мини-слайдер заголовков (3 набора) --- */
    const titleButtons = [];
    const titlesFrag = document.createDocumentFragment();
    for (let s = 0; s < 3; s++) {
        originals.forEach((slide, i) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'i-side-nav__title';
            btn.textContent = slide.dataset.title ?? '';
            btn.setAttribute('aria-label', `Перейти: ${slide.dataset.title}`);
            btn.addEventListener('click', () => goToLogical(i));
            titlesFrag.appendChild(btn);
            titleButtons.push(btn);
        });
    }
    titlesTrack.appendChild(titlesFrag);

    /* --- Геометрия (ГОРИЗОНТАЛЬНАЯ) --- */
    function trackMetrics() {
        const width = slides[0].offsetWidth;
        const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
        return { step: width + gap, size: width, box: viewport.clientWidth };
    }

    function titlesMetrics() {
        const width = titleButtons[0].offsetWidth;
        const gap = parseFloat(getComputedStyle(titlesTrack).columnGap) || 0;
        return { step: width + gap, size: width, box: titlesViewport.clientWidth };
    }

    function trackXFor(index) {
        const { step, size, box } = trackMetrics();
        return -index * step + (box - size) / 2;
    }

    function setTrackX(x) { track.style.transform = `translate3d(${x}px, 0, 0)`; }

    function renderTrack() { setTrackX(trackXFor(realIndex)); }

    function renderTitlesTrack() {
        const { step, size, box } = titlesMetrics();
        const x = -realIndex * step + (box - size) / 2;
        titlesTrack.style.transform = `translate3d(${x}px, 0, 0)`;
    }

    /* --- Видео: play/pause --- */
    function updateVideos() {
        slides.forEach((slide, i) => {
            const video = slide.querySelector('.i-slide__video');
            if (!video) return;
            if (i === realIndex) {
                video.play().catch(() => {});
            } else {
                video.pause();
                try { video.currentTime = 0; } catch (e) {}
            }
        });
    }

    /* --- Рендер UI --- */
    function renderNumbers() {
        const active = logicalIndex();
        const visible = Math.min(NUMBERS_VISIBLE, count);
        const start = clamp(active - 2, 0, count - visible);
        numbersNav.innerHTML = '';
        for (let i = start; i < start + visible; i++) {
            const li = document.createElement('li');
            li.className = 'i-side-nav__item';
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = `i-side-nav__number${i === active ? ' is-active' : ''}`;
            btn.textContent = pad(i);
            btn.setAttribute('aria-label', `Слайд ${pad(i)}`);
            btn.addEventListener('click', () => goToLogical(i));
            li.appendChild(btn);
            numbersNav.appendChild(li);
        }
    }

    function renderStates() {
        slides.forEach((s, i) => s.classList.toggle('is-active', i === realIndex));
        titleButtons.forEach((b, i) => {
            b.classList.toggle('is-active', i === realIndex);
            b.classList.toggle('is-near', Math.abs(i - realIndex) === 1);
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
        captionAnimation?.cancel();
        if (!animate) { swap(); return; }

        const out = caption.animate(
            [{ opacity: 1, transform: 'translateY(0)' }, { opacity: 0, transform: `translateY(${-18 * direction}px)` }],
            { duration: 200, easing: 'ease-in', fill: 'forwards' }
        );
        captionAnimation = out;
        out.onfinish = () => {
            swap();
            out.cancel();
            captionAnimation = caption.animate(
                [{ opacity: 0, transform: `translateY(${18 * direction}px)` }, { opacity: 1, transform: 'translateY(0)' }],
                { duration: 450, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }
            );
        };
    }

    /* --- Переключение --- */
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
        updateVideos();
        renderCaption(direction);

        root.dispatchEvent(new CustomEvent('interactive-slider:change', {
            detail: { index: logicalIndex(), direction, steps: Math.abs(steps) || 1 },
        }));

        clearTimeout(unlockTimer);
        unlockTimer = setTimeout(() => { locked = false; }, UNLOCK_MS);
    }

    function goToLogical(targetLogical) {
        const currentLogical = logicalIndex();
        let delta = (((targetLogical - currentLogical) % count) + count) % count;
        if (delta > count / 2) delta -= count;
        if (delta === 0) return;
        goToReal(realIndex + delta, delta);
    }

    /* --- Телепорт клонов --- */
    function normalizePosition() {
        if (realIndex >= count && realIndex < count * 2) return;
        const equivalent = (realIndex % count) + count;
        if (equivalent === realIndex) return;

        root.classList.add('interactive-slider--teleporting');
        track.classList.add('interactive-slider__track--instant');
        titlesTrack.classList.add('i-side-nav__titles-track--instant');

        realIndex = equivalent;
        renderTrack();
        renderTitlesTrack();
        renderStates();
        updateVideos();

        void track.offsetHeight;
        requestAnimationFrame(() => {
            root.classList.remove('interactive-slider--teleporting');
            track.classList.remove('interactive-slider__track--instant');
            titlesTrack.classList.remove('i-side-nav__titles-track--instant');
        });
    }

    track.addEventListener('transitionend', (e) => {
        if (e.target !== track || e.propertyName !== 'transform') return;
        normalizePosition();
    });

    /* --- Drag (горизонтальный) --- */
    let drag = null;

    function onPointerDown(event) {
        if (drag || locked) return;
        if (event.pointerType === 'mouse' && event.button !== 0) return;
        if (event.target.closest('a, button')) return;

        event.preventDefault();
        drag = {
            pointerId: event.pointerId,
            startX: event.clientX,
            lastX: event.clientX,
            lastTime: performance.now(),
            velocity: 0,
            baseX: trackXFor(realIndex),
        };
        root.classList.add('is-dragging');
        track.classList.add('interactive-slider__track--instant');
        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);
        window.addEventListener('pointercancel', onPointerCancel);
    }

    function onPointerMove(event) {
        if (!drag || event.pointerId !== drag.pointerId) return;
        const now = performance.now();
        const dt = now - drag.lastTime;
        if (dt > 0) {
            const inst = (event.clientX - drag.lastX) / dt;
            drag.velocity = drag.velocity * 0.8 + inst * 0.2;
        }
        drag.lastX = event.clientX;
        drag.lastTime = now;
        setTrackX(drag.baseX + (event.clientX - drag.startX));
    }

    function finishDragCleanup() {
        root.classList.remove('is-dragging');
        track.classList.remove('interactive-slider__track--instant');
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
        window.removeEventListener('pointercancel', onPointerCancel);
    }

    function onPointerUp(event) {
        if (!drag || event.pointerId !== drag.pointerId) return;
        const delta = event.clientX - drag.startX;
        const velocity = drag.velocity;
        drag = null;
        finishDragCleanup();

        const { step } = trackMetrics();
        let steps = Math.round(-delta / step);
        if (steps === 0 && Math.abs(velocity) > FLICK_VELOCITY) {
            steps = velocity < 0 ? 1 : -1;
        }
        steps = clamp(steps, -MAX_DRAG_STEPS, MAX_DRAG_STEPS);

        const target = realIndex + steps;
        if (steps === 0 || target < 0 || target > slides.length - 1) {
            renderTrack();
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

    /* --- Колесо (горизонтальное) --- */
    let wheelBlocked = false;
    function onWheel(event) {
        event.preventDefault();
        if (drag || wheelBlocked || locked) return;
        const absDelta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
        if (Math.abs(absDelta) < 8) return;
        wheelBlocked = true;
        goToReal(realIndex + (absDelta > 0 ? 1 : -1));
        setTimeout(() => { wheelBlocked = false; }, UNLOCK_MS);
    }

    function onKeydown(event) {
        const dirs = { ArrowRight: 1, ArrowDown: 1, PageDown: 1, ArrowLeft: -1, ArrowUp: -1, PageUp: -1 };
        if (event.key in dirs) {
            event.preventDefault();
            if (!drag && !locked) goToReal(realIndex + dirs[event.key]);
            return;
        }
        if (event.key === 'Home') { event.preventDefault(); goToLogical(0); }
        if (event.key === 'End') { event.preventDefault(); goToLogical(count - 1); }
    }

    function onResize() {
        track.classList.add('interactive-slider__track--instant');
        titlesTrack.classList.add('i-side-nav__titles-track--instant');
        renderTrack();
        renderTitlesTrack();
        requestAnimationFrame(() => requestAnimationFrame(() => {
            track.classList.remove('interactive-slider__track--instant');
            titlesTrack.classList.remove('i-side-nav__titles-track--instant');
        }));
    }

    function init() {
        track.classList.add('interactive-slider__track--instant');
        titlesTrack.classList.add('i-side-nav__titles-track--instant');
        renderTrack();
        renderTitlesTrack();
        renderNumbers();
        renderStates();
        updateVideos();
        renderCaption(1, false);
        requestAnimationFrame(() => requestAnimationFrame(() => {
            track.classList.remove('interactive-slider__track--instant');
            titlesTrack.classList.remove('i-side-nav__titles-track--instant');
        }));

        viewport.addEventListener('pointerdown', onPointerDown);
        window.addEventListener('wheel', onWheel, { passive: false });
        window.addEventListener('keydown', onKeydown);
        window.addEventListener('resize', onResize);
    }

    return {
        init,
        get index() { return logicalIndex(); },
        get activeSlide() { return slides[realIndex]; },
    };
}