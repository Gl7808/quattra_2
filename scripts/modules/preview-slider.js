export function createPreviewSlider(root) {
    const track = root.querySelector('[data-preview-track]');
    const frame = root.querySelector('[data-preview-frame]');

    let slides = [];
    let activeIndex = 0;

    function layout() {
        if (!slides.length) return;
        const previewH = root.clientHeight;
        const slideH = slides[0].offsetHeight;
        const gap = parseFloat(getComputedStyle(track).rowGap) || 0;
        const y = -(activeIndex * (slideH + gap)) + (previewH - slideH) / 2;
        track.style.transform = `translate3d(0, ${y}px, 0)`;
    }

    function render(items) {
        track.innerHTML = '';
        slides = [];

        items.forEach((dish) => {
            const slide = document.createElement('div');
            slide.className = 'preview__slide';

            const placeholder = document.createElement('span');
            placeholder.className = 'preview__placeholder';
            placeholder.textContent = dish.name ?? '';
            slide.appendChild(placeholder);

            if (dish.image) {
                const img = document.createElement('img');
                img.className = 'preview__image';
                img.src = dish.image;
                img.alt = dish.name ?? '';
                img.loading = 'lazy';
                img.draggable = false;
                img.addEventListener('error', () => { img.style.display = 'none'; });
                slide.appendChild(img);
            }

            track.appendChild(slide);
            slides.push(slide);
        });

        setActive(0, false);
    }

    function pulse() {
        if (!frame) return;
        frame.classList.remove('is-pulsing');
        void frame.offsetWidth;
        frame.classList.add('is-pulsing');
    }

    function setActive(index, animate = true) {
        if (!slides.length) return;
        activeIndex = Math.max(0, Math.min(index, slides.length - 1));
        slides.forEach((s, i) => s.classList.toggle('is-active', i === activeIndex));

        if (!animate) track.classList.add('preview__track--instant');
        layout();
        if (!animate) {
            void track.offsetHeight;
            requestAnimationFrame(() => track.classList.remove('preview__track--instant'));
        } else {
            pulse();
        }
    }

    window.addEventListener('resize', layout);

    return { render, setActive };
}