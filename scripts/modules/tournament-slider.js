const REST_ROTATE_X = 15;
const REST_ROTATE_Y = -20;
const TILT_MAX = 18;

function pad(n) {
    return String(n + 1).padStart(2, '0');
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

export function createTournamentSlider(root) {
    const scale = root.querySelector('[data-t-scale]');
    const scaleThumb = root.querySelector('[data-t-scale-thumb]');
    const scaleItems = root.querySelector('[data-t-scale-items]');
    const cardInner = root.querySelector('[data-t-card-inner]');
    const card = root.querySelector('[data-t-card]');
    const glare = root.querySelector('[data-t-card-glare]');
    const placeholder = root.querySelector('[data-t-card-placeholder]');
    const counterEl = root.querySelector('[data-t-counter]');
    const titleEl = root.querySelector('[data-t-title]');
    const descEl = root.querySelector('[data-t-desc]');
    const metaEl = root.querySelector('[data-t-meta]');

    let slides = [];
    let activeIndex = 0;
    let items = [];
    let isSpinning = false;
    let isHovered = false;
    let dragging = false;
    let pendingIndex = null;

    async function loadData() {
        try {
            const res = await fetch('data/tournaments.json');
            if (!res.ok) throw new Error(res.status);
            slides = await res.json();
        } catch (e) {
            console.error('Не удалось загрузить tournaments.json:', e);
            slides = [];
        }
    }

    /* ── Построение миниатюр на шкале ── */
    function buildScale() {
        scaleItems.innerHTML = '';
        items = [];

        slides.forEach((slide, i) => {
            const item = document.createElement('button');
            item.type = 'button';
            item.className = 't-scale__item';
            item.innerHTML = `
        <span class="t-scale__tick"></span>
        <span class="t-scale__number">${pad(i)}</span>
        <span class="t-scale__label">${slide.short ?? ''}</span>
      `;
            item.addEventListener('click', () => goTo(i));
            scaleItems.appendChild(item);
            items.push(item);
        });

        positionItems();
    }

    /* Распределяем миниатюры равномерно по высоте шкалы */
    function positionItems() {
        const count = slides.length;
        items.forEach((item, i) => {
            const top = count > 1 ? (i / (count - 1)) * 100 : 0;
            item.style.top = `${top}%`;
        });
    }

    /* ── Позиция ползунка на активном слайде ── */
    function syncThumb(instant = false) {
        const count = slides.length;
        if (count <= 1) return;

        const h = scale.clientHeight;
        const y = (activeIndex / (count - 1)) * h;

        if (instant) {
            scaleThumb.classList.add('is-dragging'); // отключаем transition
            scaleThumb.style.transform = `translateY(${y}px)`;
            void scaleThumb.offsetWidth;
            scaleThumb.classList.remove('is-dragging');
        } else {
            scaleThumb.style.transform = `translateY(${y}px)`;
        }

        items.forEach((item, i) => item.classList.toggle('is-active', i === activeIndex));
    }

    /* ── Обновление информации справа ── */
    function updateInfo() {
        const slide = slides[activeIndex];
        if (!slide) return;

        counterEl.textContent = `${pad(activeIndex)} / ${String(slides.length).padStart(2, '0')}`;
        titleEl.textContent = slide.name ?? '';
        descEl.textContent = slide.description ?? '';
        if (placeholder) placeholder.textContent = slide.short ?? '';

        metaEl.innerHTML = '';
        if (Array.isArray(slide.tags)) {
            slide.tags.forEach((tag) => {
                const span = document.createElement('span');
                span.className = 't-slider__tag';
                span.textContent = tag;
                metaEl.appendChild(span);
            });
        }

        const media = cardInner.querySelector('.t-card__media');
        if (slide.image) {
            media.style.backgroundImage = `url('${slide.image}')`;
            media.style.backgroundSize = 'cover';
            media.style.backgroundPosition = 'center';
            if (placeholder) placeholder.style.display = 'none';
        } else {
            media.style.backgroundImage = '';
            if (placeholder) placeholder.style.display = '';
        }
    }

    /* ── Начальный наклон карточки ── */
    function setRestTransform() {
        if (!cardInner || isHovered) return;
        cardInner.style.transform = `rotateX(${REST_ROTATE_X}deg) rotateY(${REST_ROTATE_Y}deg)`;
    }

    /* ── Переключение слайда ── */
    function goTo(index, options = {}) {
        const { spin = true } = options;

        if (index === activeIndex || index < 0 || index >= slides.length) return;

        /* Если анимация уже идёт — ставим запрос в очередь */
        if (isSpinning) {
            pendingIndex = index;
            return;
        }

        if (spin) {
            spinTo(index);
        } else {
            quickSwap(index);
        }
    }

    /* Полный оборот 360° (клик по миниатюре, клавиатура, колесо) */
    function spinTo(index) {
        isSpinning = true;

        const dir = index > activeIndex ? 1 : -1;
        const startX = isHovered ? 0 : REST_ROTATE_X;
        const startY = isHovered ? 0 : REST_ROTATE_Y;

        cardInner.classList.add('is-spinning');

        const anim = cardInner.animate(
            [
                { transform: `rotateX(${startX}deg) rotateY(${startY}deg)` },
                { transform: `rotateX(${startX * 0.3}deg) rotateY(${startY + dir * 180}deg)` },
                { transform: `rotateX(${startX}deg) rotateY(${startY + dir * 360}deg)` },
            ],
            { duration: 900, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', fill: 'forwards' }
        );

        setTimeout(() => {
            activeIndex = index;
            updateInfo();
            if (!dragging) syncThumb();
        }, 450);

        anim.onfinish = () => finishSpin(anim);
    }

    /* Быстрая смена на 90° (перетаскивание ползунка) */
    function quickSwap(index) {
        isSpinning = true;

        const dir = index > activeIndex ? 1 : -1;
        const baseX = isHovered ? 0 : REST_ROTATE_X;
        const baseY = isHovered ? 0 : REST_ROTATE_Y;

        cardInner.classList.add('is-spinning');

        const anim = cardInner.animate(
            [
                { transform: `rotateX(${baseX}deg) rotateY(${baseY}deg)` },
                { transform: `rotateX(${baseX}deg) rotateY(${baseY + dir * 90}deg)` },
                { transform: `rotateX(${baseX}deg) rotateY(${baseY}deg)` },
            ],
            { duration: 400, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', fill: 'forwards' }
        );

        setTimeout(() => {
            activeIndex = index;
            updateInfo();
            if (!dragging) syncThumb();
        }, 200);

        anim.onfinish = () => finishSpin(anim);
    }

    function finishSpin(anim) {
        cardInner.classList.remove('is-spinning');
        isSpinning = false;
        anim.cancel();

        if (isHovered) {
            cardInner.style.transform = 'rotateX(0deg) rotateY(0deg)';
        } else {
            setRestTransform();
        }

        /* Обрабатываем отложенный запрос (быстрый драг/колесо) */
        if (pendingIndex !== null && pendingIndex !== activeIndex) {
            const next = pendingIndex;
            pendingIndex = null;
            goTo(next, { spin: false });
        }
    }

    /* ── 3D-тильт карточки ── */
    function initTilt() {
        if (!card || !cardInner || !glare) return;

        card.addEventListener('mouseenter', () => {
            if (isSpinning) return;
            isHovered = true;
            card.classList.add('is-hovered');
            cardInner.style.transform = 'rotateX(0deg) rotateY(0deg)';
        });

        card.addEventListener('mouseleave', () => {
            if (isSpinning) return;
            isHovered = false;
            card.classList.remove('is-hovered');
            setRestTransform();
            glare.style.setProperty('--glare-x', '50%');
            glare.style.setProperty('--glare-y', '50%');
        });

        card.addEventListener('mousemove', (e) => {
            if (isSpinning || !isHovered) return;

            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const normX = (x - centerX) / centerX;
            const normY = (y - centerY) / centerY;

            const rotateY = normX * TILT_MAX;
            const rotateX = -normY * TILT_MAX;

            cardInner.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;

            const glareX = (x / rect.width) * 100;
            const glareY = (y / rect.height) * 100;
            glare.style.setProperty('--glare-x', `${glareX}%`);
            glare.style.setProperty('--glare-y', `${glareY}%`);
        });
    }

    /* ── Колесо мыши над шкалой ── */
    let wheelLock = false;

    function initWheel() {
        scale.addEventListener('wheel', (e) => {
            e.preventDefault();
            if (wheelLock) return;

            const dir = e.deltaY > 0 ? 1 : -1;
            const next = activeIndex + dir;
            if (next < 0 || next >= slides.length) return;

            wheelLock = true;
            goTo(next);
            setTimeout(() => { wheelLock = false; }, 950);
        }, { passive: false });
    }

    /* ── Перетаскивание ползунка ── */
    function initDrag() {
        scaleThumb.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            dragging = true;
            scaleThumb.classList.add('is-dragging');
            scaleThumb.setPointerCapture(e.pointerId);
        });

        scaleThumb.addEventListener('pointermove', (e) => {
            if (!dragging) return;

            const rect = scale.getBoundingClientRect();
            const y = clamp(e.clientY - rect.top, 0, rect.height);
            scaleThumb.style.transform = `translateY(${y}px)`;

            const count = slides.length;
            const idx = clamp(Math.round((y / rect.height) * (count - 1)), 0, count - 1);
            if (idx !== activeIndex) {
                goTo(idx, { spin: false });
            }
        });

        const endDrag = () => {
            if (!dragging) return;
            dragging = false;
            scaleThumb.classList.remove('is-dragging');
            syncThumb(); // снап на активную позицию с анимацией
        };

        scaleThumb.addEventListener('pointerup', endDrag);
        scaleThumb.addEventListener('pointercancel', endDrag);
    }

    /* ── Клавиатура ── */
    function onKeyDown(e) {
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
            e.preventDefault();
            goTo(activeIndex + 1);
        }
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
            e.preventDefault();
            goTo(activeIndex - 1);
        }
    }

    /* ── Ресайз ── */
    function onResize() {
        syncThumb(true);
    }

    /* ── Инициализация ── */
    async function init() {
        await loadData();
        if (!slides.length) return;

        buildScale();
        updateInfo();
        syncThumb(true);
        setRestTransform();
        initTilt();
        initWheel();
        initDrag();

        document.addEventListener('keydown', onKeyDown);
        window.addEventListener('resize', onResize);
    }

    return { init, goTo };
}