const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const pad = (value) => String(value).padStart(2, '0');

/* Какую часть высоты секции занимает раскрытие картинки.
   0.5 — картинка полностью раскрыта ровно в центре секции, когда виден текст. */
const REVEAL_PORTION = 0.5;

export function createTobaccoCatalog(root) {
    const sections = [...root.querySelectorAll('[data-tobacco-section]')];
    const images = [...root.querySelectorAll('[data-brand-image]')];
    const progressFill = root.querySelector('[data-progress-fill]');
    const progressCount = root.querySelector('[data-progress-count]');
    if (sections.length === 0 || images.length === 0) return null;

    /* индекс для каскадного появления вкусов */
    sections.forEach((section) => {
        section.querySelectorAll('.tobacco-section__flavor').forEach((flavor, i) => {
            flavor.style.setProperty('--i', i);
        });
    });

    let activeIndex = -1;

    /**
     * Видимость картинки — функция прогресса (0..1).
     * Клип СВЕРХУ: раскрытие идёт снизу вверх.
     */
    function applyImage(img, progress) {
        const p = clamp(progress, 0, 1);
        img.style.clipPath = `inset(${((1 - p) * 100).toFixed(2)}% 0 0 0)`;
    }

    /* Прогресс-линия: 0 — центр первой секции, 1 — центр последней */
    function updateProgress(mid) {
        if (!progressFill && !progressCount) return;

        const rect = root.getBoundingClientRect();
        const sectionH = sections[0].getBoundingClientRect().height;
        const total = rect.height - sectionH;
        const p = total > 0 ? clamp((mid - rect.top - sectionH / 2) / total, 0, 1) : 0;

        if (progressFill) progressFill.style.height = `${(p * 100).toFixed(2)}%`;
        if (progressCount) {
            progressCount.textContent = `${pad(Math.max(activeIndex, 0) + 1)} / ${pad(sections.length)}`;
        }
    }

    function update() {
        const mid = window.innerHeight / 2;
        let current = -1;

        sections.forEach((section, i) => {
            const rect = section.getBoundingClientRect();

            /* активная секция — та, что пересекает середину экрана */
            if (mid >= rect.top && mid <= rect.bottom) current = i;

            /* первая картинка — базовый слой (класс --base), её не трогаем */
            if (i === 0 || !images[i]) return;

            applyImage(
                images[i],
                clamp((mid - rect.top) / (rect.height * REVEAL_PORTION), 0, 1)
            );
        });

        if (current !== activeIndex) {
            activeIndex = current;
            sections.forEach((section, i) => section.classList.toggle('is-active', i === current));
        }

        updateProgress(mid);
    }

    /* обновляем не чаще кадра */
    let ticking = false;
    function requestUpdate() {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
            ticking = false;
            update();
        });
    }

    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);
    update();

    return { update };
}