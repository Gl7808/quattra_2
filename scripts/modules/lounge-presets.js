const pad = (value) => String(value).padStart(2, '0');
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const FLICK_VELOCITY = 0.45;
const MAX_DRAG_STEPS = 2;

export function createLoungePresets(root) {
    const viewport = root.querySelector('.lounge-presets__viewport');
    const track = root.querySelector('[data-presets-track]');
    const prevBtn = root.querySelector('[data-presets-prev]');
    const nextBtn = root.querySelector('[data-presets-next]');
    const counter = root.querySelector('[data-presets-counter]');

    const originals = [...track.querySelectorAll('[data-presets-slide]')];
    const count = originals.length;
    if (!viewport || !track || count === 0) return null;

    /* клоны для бесконечной прокрутки */
    const headFragment = document.createDocumentFragment();
    const tailFragment = document.createDocumentFragment();

    originals.forEach((slide) => {
        [headFragment, tailFragment].forEach((fragment) => {
            const clone = slide.cloneNode(true);
            clone.setAttribute('aria-hidden', 'true');
            fragment.appendChild(clone);
        });
    });

    track.prepend(headFragment);
    track.append(tailFragment);

    const slides = [...track.querySelectorAll('[data-presets-slide]')];

    let realIndex = count;
    const logicalIndex = () => ((realIndex % count) + count) % count;

    function metrics() {
        const width = slides[0].offsetWidth;
        const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
        return { step: width + gap, width, viewport: viewport.clientWidth };
    }

    function xFor(index) {
        const { step, width, viewport: viewportWidth } = metrics();
        return viewportWidth / 2 - width / 2 - index * step;
    }

    function render() {
        track.style.transform = `translate3d(${xFor(realIndex)}px, 0, 0)`;
        slides.forEach((slide, i) => slide.classList.toggle('is-active', i === realIndex));
        if (counter) counter.textContent = `${pad(logicalIndex() + 1)} / ${pad(count)}`;
    }

    function goTo(target) {
        const nextIndex = clamp(target, 0, slides.length - 1);
        if (nextIndex === realIndex) return;
        realIndex = nextIndex;
        render();
    }

    const goNext = () => goTo(realIndex + 1);
    const goPrev = () => goTo(realIndex - 1);

    prevBtn?.addEventListener('click', goPrev);
    nextBtn?.addEventListener('click', goNext);

    /* бесшовный возврат в средний набор клонов */
    function normalize() {
        if (realIndex >= count && realIndex < count * 2) return;
        const equivalent = (realIndex % count) + count;
        if (equivalent === realIndex) return;

        track.classList.add('lounge-presets__track--instant');
        realIndex = equivalent;
        render();
        void track.offsetHeight;
        requestAnimationFrame(() => track.classList.remove('lounge-presets__track--instant'));
    }

    track.addEventListener('transitionend', (event) => {
        if (event.target !== track || event.propertyName !== 'transform') return;
        normalize();
    });

    /* drag */
    let drag = null;

    function onPointerDown(event) {
        if (drag) return;
        if (event.pointerType === 'mouse' && event.button !== 0) return;
        if (event.target.closest('button, a')) return;

        event.preventDefault();
        drag = {
            pointerId: event.pointerId,
            startX: event.clientX,
            lastX: event.clientX,
            lastTime: performance.now(),
            velocity: 0,
            baseX: xFor(realIndex),
        };

        root.classList.add('is-dragging');
        track.classList.add('lounge-presets__track--instant');

        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);
        window.addEventListener('pointercancel', onPointerCancel);
    }

    function onPointerMove(event) {
        if (!drag || event.pointerId !== drag.pointerId) return;
        const now = performance.now();
        const dt = now - drag.lastTime;
        if (dt > 0) {
            const instant = (event.clientX - drag.lastX) / dt;
            drag.velocity = drag.velocity * 0.8 + instant * 0.2;
        }
        drag.lastX = event.clientX;
        drag.lastTime = now;

        track.style.transform = `translate3d(${drag.baseX + (event.clientX - drag.startX)}px, 0, 0)`;
    }

    function finishDragCleanup() {
        root.classList.remove('is-dragging');
        track.classList.remove('lounge-presets__track--instant');
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
        window.removeEventListener('pointercancel', onPointerCancel);
    }

    function onPointerUp(event) {
        if (!drag || event.pointerId !== drag.pointerId) return;
        const deltaX = event.clientX - drag.startX;
        const velocity = drag.velocity;
        drag = null;
        finishDragCleanup();

        const { step } = metrics();
        let steps = Math.round(-deltaX / step);
        if (steps === 0 && Math.abs(velocity) > FLICK_VELOCITY) {
            steps = velocity < 0 ? 1 : -1;
        }
        steps = clamp(steps, -MAX_DRAG_STEPS, MAX_DRAG_STEPS);

        if (steps === 0) {
            render();
            return;
        }
        goTo(realIndex + steps);
    }

    function onPointerCancel(event) {
        if (!drag || event.pointerId !== drag.pointerId) return;
        drag = null;
        finishDragCleanup();
        render();
    }

    viewport.addEventListener('pointerdown', onPointerDown);

    function onResize() {
        track.classList.add('lounge-presets__track--instant');
        render();
        requestAnimationFrame(() => requestAnimationFrame(() => {
            track.classList.remove('lounge-presets__track--instant');
        }));
    }

    window.addEventListener('resize', onResize);

    track.classList.add('lounge-presets__track--instant');
    render();
    requestAnimationFrame(() => requestAnimationFrame(() => {
        track.classList.remove('lounge-presets__track--instant');
    }));

    return { next: goNext, prev: goPrev };
}